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
  phoneNumber = '+234';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {
    if (localStorage.getItem('token')) {
      const user = this.auth.getCachedUser();
      void this.router.navigateByUrl(user?.name && user.name !== 'Ogbia Member' && user.email ? '/home' : '/complete-profile', { replaceUrl: true });
    }
  }

  onPhoneNumberChange(value: string): void {
    this.phoneNumber = this.normalizeNigerianPhone(value);
  }

  private normalizeNigerianPhone(value: string): string {
    const compact = (value || '').replace(/[\s().-]/g, '');
    const digits = compact.replace(/\D/g, '');

    if (compact.startsWith('+234')) return '+234' + digits.slice(3).replace(/^0/, '');
    if (digits.startsWith('234')) return '+234' + digits.slice(3).replace(/^0/, '');
    if (digits.startsWith('0')) return '+234' + digits.slice(1);
    return '+234' + digits.replace(/^0/, '');
  }

  login(): void {
    const phone = this.normalizeNigerianPhone(this.phoneNumber);
    this.phoneNumber = phone;
    if (phone.length <= 4 || !this.password) {
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
