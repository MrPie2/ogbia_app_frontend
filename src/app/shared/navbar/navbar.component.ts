import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';

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

  constructor(private readonly router: Router, private readonly auth: AuthService) {
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

    this.auth.sessionChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateNavbarVisibility(this.router.url));
  }

  private updateNavbarVisibility(url: string): void {
    const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    const authenticationRoutes = ['/welcome', '/login', '/get_started'];
    const isAuthenticationPage = authenticationRoutes.includes(path);
    const hasSessionToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');

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
