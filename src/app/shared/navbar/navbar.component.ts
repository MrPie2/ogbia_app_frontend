import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { Subject, filter, takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-shared-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IonIcon],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnDestroy {
  menuOpen = false;
  private previousUrl = '';
  private currentUrl = this.router.url;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly router: Router, public readonly notifications: NotificationService) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.urlAfterRedirects;
        this.closeMenu();
      });
  }

  goBack(): void {
    if (this.previousUrl && this.previousUrl !== this.currentUrl) {
      void this.router.navigateByUrl(this.previousUrl);
      return;
    }

    if (this.currentUrl !== '/home') {
      void this.router.navigateByUrl('/home');
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  refreshNotifications(): void {
    this.notifications.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
