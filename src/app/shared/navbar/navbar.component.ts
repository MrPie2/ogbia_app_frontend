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
  currentPath = '/';
  private previousPath = '';
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly router: Router, public readonly notifications: NotificationService) {
    this.currentPath = this.normalizePath(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const nextPath = this.normalizePath(event.urlAfterRedirects);
        if (nextPath !== this.currentPath) this.previousPath = this.currentPath;
        this.currentPath = nextPath;
        this.closeMenu();
      });
  }

  get isHome(): boolean {
    return this.currentPath === '/home' || this.currentPath === '/';
  }

  goBack(): void {
    const publicRoutes = ['/', '/welcome', '/login', '/get_started', '/complete-profile'];
    if (this.previousPath && !publicRoutes.includes(this.previousPath)) {
      void this.router.navigateByUrl(this.previousPath);
      return;
    }
    void this.router.navigateByUrl('/home');
  }

  private normalizePath(url: string): string {
    return url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
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
