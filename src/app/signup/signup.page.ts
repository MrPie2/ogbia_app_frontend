import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  standalone: true,
})
export class SignupPage {
  phoneNumber = '+234';
  referralId = '';
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

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

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const phone = this.normalizeNigerianPhone(this.phoneNumber);
    this.phoneNumber = phone;
    const referral = this.referralId.trim();

    if (phone.length <= 4) { this.errorMessage = 'Enter your phone number to continue.'; return; }
    if (!/^\+234[0-9]{7,10}$/.test(phone)) {
      this.errorMessage = 'Enter a valid Nigerian phone number after +234.';
      return;
    }
    if (!referral) { this.errorMessage = 'A Referral ID is required. Ogbia Connect is invite-only.'; return; }
    if (this.submitting) return;

    this.submitting = true;
    this.auth.register(phone, referral).subscribe({
      next: async () => {
        this.submitting = false;
        await this.router.navigateByUrl('/complete-profile', { replaceUrl: true });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        const errors = error.error?.errors as Record<string, string[]> | undefined;
        this.errorMessage = errors?.['referral_id']?.[0] || errors?.['phone']?.[0] ||
          error.error?.message || 'We could not create your account. Check your details and try again.';
      },
    });
  }
}
