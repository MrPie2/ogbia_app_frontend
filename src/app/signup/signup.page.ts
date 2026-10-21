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
  phoneNumber = '';
  referralId = '';
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const phone = this.phoneNumber.trim();
    const referral = this.referralId.trim();

    if (!phone) { this.errorMessage = 'Enter your phone number to continue.'; return; }
    if (!/^\\+?[0-9\\s().-]{10,20}$/.test(phone)) {
      this.errorMessage = 'Enter a valid phone number, including your country code if needed.';
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
