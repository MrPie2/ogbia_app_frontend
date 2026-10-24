import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
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
  imports: [FormsModule, CommonModule, IonRouterOutlet, IonApp, NavbarComponent],
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
      .subscribe(() => this.updateNavbarInclusion(this.router.url));
    // Register the Ionicons used across the app so they render reliably in
    // standalone Angular/Ionic pages instead of depending on lazy icon loading.
    addIcons({
      add,
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
  }

  private updateNavbarInclusion(url: string): void {
    const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    const publicRoutes = ['/', '/welcome', '/login', '/get_started', '/complete-profile'];
    const hasSessionToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
    this.includeNavbar = hasSessionToken && !publicRoutes.includes(path);
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
