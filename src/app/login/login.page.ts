import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  standalone: true,
})
export class LoginPage {
  phoneNumber = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {
    if (localStorage.getItem('token')) {
      const user = this.auth.getCachedUser();
      void this.router.navigateByUrl(user?.name && user.name !== 'Ogbia Member' && user.email ? '/home' : '/complete-profile', { replaceUrl: true });
    }
  }

  login(): void {
    const phone = this.phoneNumber.trim();
    if (!phone || !this.password) {
      this.errorMessage = 'Enter your phone number and password to continue.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.auth.login(phone, this.password).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(['/home'], { replaceUrl: true });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Unable to log in. Please try again.';
      }
    });
  }
}
