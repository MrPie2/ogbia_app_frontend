import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-shared-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IonIcon],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnDestroy {
  menuOpen = false;
  showNavbar = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly router: Router) {
    this.updateNavbarVisibility(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.closeMenu();
        this.updateNavbarVisibility(event.urlAfterRedirects);
      });
  }

  private updateNavbarVisibility(url: string): void {
    const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    const authenticationRoutes = ['/welcome', '/login', '/get_started', '/complete-profile'];
    const isAuthenticationPage = authenticationRoutes.includes(path);
    const hasSessionToken = !!localStorage.getItem('token');

    this.showNavbar = hasSessionToken && !isAuthenticationPage;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
