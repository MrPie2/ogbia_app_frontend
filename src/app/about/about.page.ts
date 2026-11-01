import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  template: `
    <ion-content [fullscreen]="true">
      <main class="about-page">
        <a class="back-link" routerLink="/profile" aria-label="Back to profile"><ion-icon name="arrow-back-outline"></ion-icon></a>
        <header class="page-heading">
          <span class="eyebrow">MY OGBIA</span>
          <h1>About &amp; Legal</h1>
          <p>Learn about the app, check its version and find the policies that guide our community.</p>
        </header>
        <section class="brand-card">
          <div class="brand-mark"><ion-icon name="people-circle-outline"></ion-icon></div>
          <div><h2>My Ogbia</h2><p>Connecting our people. Preserving our heritage.</p></div>
        </section>
        <section class="section">
          <div class="section-heading"><div><h2>App information</h2><p>Version details from this device</p></div><span class="platform-pill">{{ platformLabel }}</span></div>
          <div class="version-card">
            <div class="version-row"><span>Installed app version</span><strong>{{ nativeVersion || 'Checking…' }}</strong></div>
            <div class="version-row"><span>Active live-update bundle</span><strong>{{ bundleVersion || 'Checking…' }}</strong></div>
            <div class="version-row" *ngIf="pendingVersion"><span>Update queued for next launch</span><strong>{{ pendingVersion }}</strong></div>
            <div class="version-row" *ngIf="latestVersion"><span>Latest published version</span><strong>{{ latestVersion }}</strong></div>
            <div class="update-status" [class.status-good]="updateState === 'current'" [class.status-warning]="updateState === 'available'" [class.status-error]="updateState === 'error'"><span class="status-dot"></span><span>{{ updateMessage }}</span></div>
            <button class="check-button" type="button" (click)="checkForUpdates()" [disabled]="checking || !isNative"><ion-icon name="refresh-outline"></ion-icon>{{ checking ? 'Checking…' : 'Check for updates' }}</button>
            <p class="checked-at" *ngIf="lastChecked">Last checked: {{ lastChecked | date:'medium' }}</p>
            <p class="update-note" *ngIf="isNative">Live updates download in the background and are normally applied when you next reopen the app. This check does not force an installation.</p>
            <p class="update-note" *ngIf="!isNative">Live-update diagnostics are available in the installed Android or iOS app.</p>
          </div>
        </section>
        <section class="section">
          <div class="section-heading"><div><h2>Policies &amp; documentation</h2><p>The standards and information for using My Ogbia</p></div></div>
          <div class="document-list">
            <article class="document-row"><span class="document-icon"><ion-icon name="shield-checkmark-outline"></ion-icon></span><span class="document-copy"><strong>Privacy Policy</strong><small>How account and community information is handled</small></span><span class="document-status">In preparation</span></article>
            <article class="document-row"><span class="document-icon"><ion-icon name="document-text-outline"></ion-icon></span><span class="document-copy"><strong>Terms &amp; Conditions</strong><small>Terms governing access to and use of the app</small></span><span class="document-status">In preparation</span></article>
            <article class="document-row"><span class="document-icon"><ion-icon name="people-circle-outline"></ion-icon></span><span class="document-copy"><strong>Community Guidelines</strong><small>Respectful participation and community standards</small></span><span class="document-status">In preparation</span></article>
            <article class="document-row"><span class="document-icon"><ion-icon name="information-circle-outline"></ion-icon></span><span class="document-copy"><strong>Disclaimer</strong><small>Important information about community content and services</small></span><span class="document-status">In preparation</span></article>
            <article class="document-row"><span class="document-icon"><ion-icon name="document-text-outline"></ion-icon></span><span class="document-copy"><strong>Copyright &amp; Intellectual Property</strong><small>Ownership, permissions and reporting concerns</small></span><span class="document-status">In preparation</span></article>
            <article class="document-row"><span class="document-icon"><ion-icon name="finger-print-outline"></ion-icon></span><span class="document-copy"><strong>Data Requests &amp; Account Deletion</strong><small>How to request access, correction or deletion</small></span><span class="document-status">In preparation</span></article>
          </div>
          <p class="legal-note">These documents are being prepared for publication. The final policies should be reviewed and approved before being presented as binding terms.</p>
        </section>
        <section class="support-card"><ion-icon name="mail-outline"></ion-icon><div><strong>Need help?</strong><p>For app support or questions about these documents, contact the My Ogbia support team.</p></div></section>
        <footer>My Ogbia <span>•</span> Built for the Ogbia community</footer>
      </main>
    </ion-content>
  `,
  styles: [`
    :host{--brand:#393185;--ink:#292442;--muted:#817d94;display:block}
    .about-page{max-width:760px;margin:0 auto;padding:24px 18px calc(100px + env(safe-area-inset-bottom));color:var(--ink);background:linear-gradient(180deg,#f2efff 0,#fbfaff 240px,#fbfaff 100%);min-height:100%}
    .back-link{display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border:1px solid #e7e2f4;border-radius:12px;background:#fff;color:var(--brand);text-decoration:none;font-size:20px}
    .page-heading{padding:22px 2px 18px}.eyebrow{color:#766bb5;font-size:10px;font-weight:850;letter-spacing:1.8px}
    h1{margin:7px 0;color:#282343;font-size:clamp(27px,6vw,34px);font-weight:850;letter-spacing:-.8px}
    .page-heading p,.section-heading p{margin:0;color:var(--muted);font-size:12px;line-height:1.6}
    .brand-card{display:flex;align-items:center;gap:14px;padding:18px;border-radius:20px;background:linear-gradient(120deg,#30296f,#393185 65%,#514a9b);color:#fff;box-shadow:0 13px 28px #39318526}
    .brand-mark{width:48px;height:48px;display:grid;place-items:center;border:1px solid #ffffff30;border-radius:15px;background:#ffffff17;font-size:27px}
    .brand-card h2{margin:0 0 5px;font-size:17px;font-weight:850}.brand-card p{margin:0;color:#e4e1f8;font-size:11px}
    .section{margin-top:27px}.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .section-heading h2{margin:0 0 4px;color:#302b4c;font-size:16px;font-weight:850}
    .platform-pill{padding:6px 10px;border:1px solid #e6e1f4;border-radius:999px;background:#fff;color:var(--brand);font-size:10px;font-weight:800}
    .version-card{padding:16px;border:1px solid #ebe7f4;border-radius:18px;background:#fff;box-shadow:0 8px 24px #332b6410}
    .version-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:10px 0;border-bottom:1px solid #f0edf6;font-size:11px}
    .version-row:first-child{padding-top:0}.version-row span{color:#77738b}.version-row strong{max-width:55%;color:#302b4c;text-align:right;font-size:12px;overflow-wrap:anywhere}
    .update-status{display:flex;align-items:center;gap:8px;margin:14px 0 12px;padding:10px 11px;border-radius:11px;background:#f3f1fb;color:#68617f;font-size:11px;font-weight:750}
    .status-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#8d87a6}
    .status-good{background:#eef9f2;color:#217447}.status-good .status-dot{background:#26965a}
    .status-warning{background:#fff8e9;color:#93600d}.status-warning .status-dot{background:#d99a28}
    .status-error{background:#fff1f1;color:#a33c3c}.status-error .status-dot{background:#c84c4c}
    .check-button{display:flex;width:100%;min-height:44px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;background:var(--brand);color:#fff;font-size:12px;font-weight:800}
    .check-button:disabled{opacity:.55}.check-button ion-icon{font-size:17px}
    .checked-at,.update-note{margin:9px 0 0;color:#89859a;font-size:10px;line-height:1.6}.update-note{padding-top:8px}
    .document-list{overflow:hidden;border:1px solid #ebe7f4;border-radius:17px;background:#fff}
    .document-row{display:flex;align-items:center;gap:11px;padding:13px;border-bottom:1px solid #f0edf6}.document-row:last-child{border-bottom:0}
    .document-icon{width:37px;height:37px;flex:0 0 37px;display:grid;place-items:center;border-radius:12px;background:#f1edfb;color:var(--brand);font-size:19px}
    .document-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.document-copy strong{color:#302b4c;font-size:11px;font-weight:800}.document-copy small{color:#89859a;font-size:9px;line-height:1.4}
    .document-status{flex:0 0 auto;color:#9386b7;font-size:9px;font-weight:750;text-align:right}
    .legal-note{margin:10px 2px 0;color:#918ca0;font-size:10px;line-height:1.6}
    .support-card{display:flex;gap:12px;margin-top:24px;padding:15px;border:1px solid #e8e3f3;border-radius:16px;background:#fff;color:var(--brand)}
    .support-card>ion-icon{font-size:22px}.support-card strong{color:#302b4c;font-size:12px}.support-card p{margin:4px 0 0;color:#817d94;font-size:10px;line-height:1.5}
    footer{padding:25px 0 5px;color:#9691a5;text-align:center;font-size:10px}footer span{padding:0 5px;color:var(--brand)}
    @media(max-width:360px){.document-row{gap:8px;padding:11px 9px}.document-status{max-width:62px}.document-copy strong{font-size:10px}}
  `]
})
export class AboutPage implements OnInit {
  readonly isNative = Capacitor.isNativePlatform();
  readonly platformLabel = Capacitor.getPlatform().toUpperCase();
  nativeVersion = '';
  bundleVersion = '';
  latestVersion = '';
  pendingVersion = '';
  checking = false;
  lastChecked: Date | null = null;
  updateState: 'checking' | 'current' | 'available' | 'error' = 'checking';
  updateMessage = this.isNative ? 'Reading update information…' : 'Open this page in the installed app to inspect live updates.';

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.isNative) void this.checkForUpdates();
  }

  async checkForUpdates(): Promise<void> {
    if (!this.isNative || this.checking) return;
    this.checking = true;
    this.updateState = 'checking';
    this.updateMessage = 'Checking this device and the update server…';
    try {
      const current = await CapacitorUpdater.current();
      this.nativeVersion = current.native || 'Not reported';
      this.bundleVersion = current.bundle?.id === 'builtin' ? 'Built-in app bundle' : (current.bundle?.version || current.bundle?.id || 'Not reported');
      const next = await CapacitorUpdater.getNextBundle();
      this.pendingVersion = next?.version || '';
      const latest = await CapacitorUpdater.getLatest();
      this.lastChecked = new Date();
      if (latest.version) this.latestVersion = latest.version;
      if (next?.version) {
        this.updateState = 'available';
        this.updateMessage = 'An update is downloaded and waiting for the next app launch.';
      } else if (latest.error === 'no_new_version_available' || latest.kind === 'up_to_date') {
        this.updateState = 'current';
        this.updateMessage = 'This app is up to date.';
      } else if (latest.version) {
        this.updateState = 'available';
        this.updateMessage = 'A newer version is available. Automatic download may still be in progress.';
      } else if (latest.error) {
        this.updateState = 'error';
        this.updateMessage = 'The update server returned: ' + latest.error;
      } else {
        this.updateState = 'current';
        this.updateMessage = 'Update check completed.';
      }
    } catch (error) {
      console.warn('[Ogbia About] Update check failed:', error);
      this.lastChecked = new Date();
      this.updateState = 'error';
      this.updateMessage = 'Could not read update information. Check your connection and try again.';
    } finally {
      this.checking = false;
      this.cdr.markForCheck();
    }
  }
}
