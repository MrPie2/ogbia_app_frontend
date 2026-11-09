import { afterNextRender, Component, HostListener, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  archiveOutline,
  businessOutline,
  chevronForwardOutline,
  cloudOfflineOutline,
  cloudUploadOutline,
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
  cameraOutline,
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
  isWelcomeRoute = false;
  notificationToast: AppNotification | null = null;
  private readonly destroy$ = new Subject<void>();
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeStartAllowed = false;

  private readonly swipePages = [
    { path: '/home', label: 'Home' },
    { path: '/friends', label: 'Friends' },
    { path: '/create-post', label: 'Create' },
    { path: '/constituency', label: 'My Ogbia' },
    { path: '/profile', label: 'Profile' },
  ];

  constructor(
    private readonly presence: PresenceService,
    private readonly router: Router,
    private readonly navController: NavController,
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
      'cloud-upload-outline': cloudUploadOutline,
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
      'camera-outline': cameraOutline,
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
    if (Capacitor.isNativePlatform()) {
      afterNextRender(() => {
        void CapacitorUpdater.notifyAppReady().catch((error) => {
          console.warn('[Ogbia Updates] Could not confirm app readiness:', error);
        });
      });
    }
    this.notifications.start();
    this.notifications.toast$.pipe(takeUntil(this.destroy$)).subscribe((notification) => {
      this.notificationToast = notification;
    });
    this.notifications.navigation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((url) => this.openNotificationUrl(url));
  }

  @HostListener('document:touchstart', ['$event'])
  onPageSwipeStart(event: TouchEvent): void {
    this.swipeStartAllowed = false;
    if (event.touches.length !== 1 || !this.includeNavbar) return;

    // Use the composed event path so gestures work across Ionic/Web Component
    // shadow boundaries and can begin anywhere in the app, including the top
    // and bottom navigation bars.
    this.swipeStartAllowed = this.canStartPageSwipe(event);
    if (!this.swipeStartAllowed) return;

    this.swipeStartX = event.touches[0].clientX;
    this.swipeStartY = event.touches[0].clientY;
  }

  @HostListener('document:touchend', ['$event'])
  onPageSwipeEnd(event: TouchEvent): void {
    const allowed = this.swipeStartAllowed;
    this.swipeStartAllowed = false;
    if (!allowed || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.swipeStartX;
    const deltaY = touch.clientY - this.swipeStartY;

    // Require a deliberate horizontal gesture; normal vertical page scrolling wins.
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    const currentPath = this.router.url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    const currentIndex = this.swipePages.findIndex(page => page.path === currentPath);
    if (currentIndex < 0) return;

    // Swipe left advances; swipe right returns.
    if (deltaX < 0 && currentIndex < this.swipePages.length - 1) {
      void this.navController.navigateForward(this.swipePages[currentIndex + 1].path, { animated: true });
    } else if (deltaX > 0 && currentIndex > 0) {
      void this.navController.navigateBack(this.swipePages[currentIndex - 1].path, { animated: true });
    }
  }

  @HostListener('document:touchcancel')
  onPageSwipeCancel(): void {
    this.swipeStartAllowed = false;
  }

  private canStartPageSwipe(event: TouchEvent): boolean {
    const path = event.composedPath();
    const blockedSelectors = [
      'input', 'textarea', 'select', '[contenteditable="true"]',
      'video', 'audio', 'canvas', 'ion-modal', 'ion-alert', 'ion-popover',
      '.search-overlay', '[data-no-page-swipe]', '[data-horizontal-scroll]',
      '.swiper', '.swiper-container', 'swiper-container', 'ion-slides',
      'ion-segment', '.story-viewer', '.story-strip', '.stories-row',
      '.horizontal-scroll'
    ];

    // Don't hijack typing, dialogs, media controls, or horizontal carousels.
    for (const item of path) {
      if (!(item instanceof HTMLElement)) continue;
      if (blockedSelectors.some(selector => item.matches(selector))) return false;

      const overflowX = window.getComputedStyle(item).overflowX;
      if ((overflowX === 'auto' || overflowX === 'scroll') &&
          item.scrollWidth > item.clientWidth + 8) return false;
    }

    return true;
  }

  private updateNavbarInclusion(url: string): void {
    const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    const publicRoutes = ['/', '/welcome', '/login', '/get_started', '/complete-profile'];
    const hasSessionToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
    this.isWelcomeRoute = path === '/welcome';
    this.includeNavbar = hasSessionToken && !publicRoutes.includes(path);
  }

  private openNotificationUrl(url: string): void {
    // Push payloads may only navigate to internal app routes.
    if (!url.startsWith('/') || url.startsWith('//') || url.includes('\\')) return;
    void this.router.navigateByUrl(url);
  }

  openToastNotification(notification: AppNotification): void {
    if (!notification.url) return;
    if (notification.id) this.notifications.markRead(notification.id);
    this.notificationToast = null;
    this.openNotificationUrl(notification.url);
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
