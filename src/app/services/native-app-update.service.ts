import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';

interface NativeApkInfo {
  versionName: string;
  versionCode: number;
}

interface NativeApkUpdate {
  update_available: boolean;
  version_code?: number;
  version_name?: string;
  release_notes?: string;
  mandatory?: boolean;
  sha256?: string;
  download_url?: string;
}

interface NativeApkUpdaterPlugin {
  getAppInfo(): Promise<NativeApkInfo>;
  downloadAndInstall(options: { url: string; sha256: string }): Promise<{ started: boolean }>;
}

const NativeApkUpdater = registerPlugin<NativeApkUpdaterPlugin>('NativeApkUpdater');
const API_BASE_URL = 'https://api.parcellsend.com/api';

@Injectable({ providedIn: 'root' })
export class NativeAppUpdateService {
  private checkStarted = false;

  constructor(
    private readonly http: HttpClient,
    private readonly alerts: AlertController
  ) {}

  async checkAndPrompt(): Promise<void> {
    if (this.checkStarted || Capacitor.getPlatform() !== 'android') return;
    this.checkStarted = true;

    try {
      const installed = await NativeApkUpdater.getAppInfo();
      const params = new HttpParams()
        .set('app_id', 'com.myogbia.app')
        .set('version_code', String(installed.versionCode));

      const update = await firstValueFrom(
        this.http.get<NativeApkUpdate>(`${API_BASE_URL}/native-app-updates/check`, { params })
      );

      if (
        !update.update_available ||
        !update.download_url ||
        !update.sha256 ||
        !update.version_name ||
        !update.version_code
      ) return;

      const buttons: any[] = [
        {
          text: 'Update now',
          role: 'confirm',
          handler: () => {
            void NativeApkUpdater.downloadAndInstall({
              url: update.download_url!,
              sha256: update.sha256!
            }).catch(error => console.error('[Ogbia APK Update] Installation could not start:', error));
          }
        }
      ];

      if (!update.mandatory) {
        buttons.unshift({ text: 'Later', role: 'cancel' });
      }

      const alert = await this.alerts.create({
        header: `My Ogbia ${update.version_name} is available`,
        message: update.release_notes
          ? `${update.release_notes}<br><br>Download the update to get the latest improvements.`
          : 'A new version of My Ogbia is ready. Download and install it now?',
        buttons,
        backdropDismiss: !update.mandatory
      });
      await alert.present();
    } catch (error) {
      // Update checks must never block normal app startup or sign-in.
      console.warn('[Ogbia APK Update] Update check skipped:', error);
    }
  }
}
