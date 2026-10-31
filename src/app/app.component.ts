import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  archiveOutline,
  businessOutline,
  chevronForwardOutline,
  cloudOfflineOutline,
  compassOutline,
  filmOutline,
  fingerPrintOutline,
  gridOutline,
  imagesOutline,
  libraryOutline,
  mailOutline,
  ribbonOutline,
  timeOutline,
  arrowBack,
  arrowBackOutline,
  arrowForwardOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  briefcaseOutline,
  calendarOutline,
  callOutline,
  chatbubbleOutline,
  chatbubblesOutline,
  chevronForward,
  close,
  closeCircle,
  copyOutline,
  createOutline,
  documentTextOutline,
  ellipsisHorizontal,
  flagOutline,
  globeOutline,
  heartOutline,
  homeOutline,
  imageOutline,
  informationCircleOutline,
  leafOutline,
  locationOutline,
  logOutOutline,
  mapOutline,
  menuOutline,
  newspaperOutline,
  notificationsOutline,
  paperPlaneOutline,
  pause,
  peopleCircleOutline,
  peopleOutline,
  personAddOutline,
  personCircleOutline,
  personOutline,
  refreshOutline,
  searchOutline,
  settingsOutline,
  shareSocialOutline,
  statsChartOutline,
  syncOutline,
  shieldCheckmarkOutline,
  ticketOutline,
  textOutline,
  trashOutline,
  videocamOutline,
} from 'ionicons/icons';
import { PresenceService } from './services/presence.service';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from './services/auth.service';
import { NotificationService, AppNotification } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, IonRouterOutlet, IonApp, IonIcon, NavbarComponent],
})
export class AppComponent implements OnDestroy {
  includeNavbar = false;
  notificationToast: AppNotification | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly presence: PresenceService,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly notifications: NotificationService
  ) {
    this.updateNavbarInclusion(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((event) => this.updateNavbarInclusion(event.urlAfterRedirects));
    this.auth.sessionChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateNavbarInclusion(this.router.url);
        if (localStorage.getItem('token')) this.notifications.start();
        else this.notifications.stop();
      });
    // Register the Ionicons used across the app so they render reliably in
    // standalone Angular/Ionic pages instead of depending on lazy icon loading.
    addIcons({
      add,

      'archive-outline': archiveOutline,
      'business-outline': businessOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'cloud-offline-outline': cloudOfflineOutline,
      'compass-outline': compassOutline,
      'film-outline': filmOutline,
      'finger-print-outline': fingerPrintOutline,
      'grid-outline': gridOutline,
      'images-outline': imagesOutline,
      'library-outline': libraryOutline,
      'mail-outline': mailOutline,
      'ribbon-outline': ribbonOutline,
      'time-outline': timeOutline,
      'arrow-back': arrowBack,
      'arrow-back-outline': arrowBackOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'alert-circle-outline': alertCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'briefcase-outline': briefcaseOutline,
      'calendar-outline': calendarOutline,
      'call-outline': callOutline,
      'chatbubble-outline': chatbubbleOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'chevron-forward': chevronForward,
      close,
      'close-circle': closeCircle,
      'copy-outline': copyOutline,
      'create-outline': createOutline,
      'document-text-outline': documentTextOutline,
      'ellipsis-horizontal': ellipsisHorizontal,
      'flag-outline': flagOutline,
      'globe-outline': globeOutline,
      'heart-outline': heartOutline,
      'home-outline': homeOutline,
      'image-outline': imageOutline,
      'information-circle-outline': informationCircleOutline,
      'leaf-outline': leafOutline,
      'location-outline': locationOutline,
      'log-out-outline': logOutOutline,
      'map-outline': mapOutline,
      'menu-outline': menuOutline,
      'newspaper-outline': newspaperOutline,
      'notifications-outline': notificationsOutline,
      'paper-plane-outline': paperPlaneOutline,
      pause,
      'people-circle-outline': peopleCircleOutline,
      'people-outline': peopleOutline,
      'person-add-outline': personAddOutline,
      'person-circle-outline': personCircleOutline,
      'person-outline': personOutline,
      'refresh-outline': refreshOutline,
      'search-outline': searchOutline,
      'settings-outline': settingsOutline,
      'share-social-outline': shareSocialOutline,
      'stats-chart-outline': statsChartOutline,
      'sync-outline': syncOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'ticket-outline': ticketOutline,
      'text-outline': textOutline,
      'trash-outline': trashOutline,
      'videocam-outline': videocamOutline,
    });
    this.presence.start();
    this.notifications.start();
    this.notifications.toast$.pipe(takeUntil(this.destroy$)).subscribe((notification) => {
      this.notificationToast = notification;
    });
    this.notifications.navigation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((url) => this.openNotificationUrl(url));
  }

  private updateNavbarInclusion(url: string): void {
    const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    const publicRoutes = ['/', '/welcome', '/login', '/get_started', '/complete-profile'];
    const hasSessionToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
    this.includeNavbar = hasSessionToken && !publicRoutes.includes(path);
  }

  private openNotificationUrl(url: string): void {
    // Push payloads may only navigate to internal app routes.
    if (!url.startsWith('/') || url.startsWith('//') || url.includes('\\')) return;
    void this.router.navigateByUrl(url);
  }

  dismissNotification(): void {
    const notification = this.notificationToast;
    this.notificationToast = null;
    if (notification?.id) this.notifications.markRead(notification.id);
  }

  ngOnDestroy(): void {
    this.notifications.stop();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
