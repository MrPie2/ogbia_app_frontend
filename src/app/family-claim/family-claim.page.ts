import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-family-claim',
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule],
  templateUrl: './family-claim.page.html',
  styleUrl: './family-claim.page.scss',
})
export class FamilyClaimPage implements OnInit {
  token = '';
  phone = '';
  code = '';
  password = '';
  passwordConfirmation = '';
  otpSent = false;
  sendingOtp = false;
  claiming = false;
  error = '';
  message = '';

  constructor(private readonly route: ActivatedRoute, private readonly auth: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';

  }

  requestCode(): void {
    if (!this.token || !this.phone.trim()) { this.error = 'Enter the phone number for this family invitation.'; return; }
    this.sendingOtp = true; this.error = ''; this.message = '';
    this.auth.requestFamilyClaimOtp(this.token, this.phone.trim()).subscribe({
      next: response => { this.sendingOtp = false; this.otpSent = true; this.message = response.message; },
      error: error => { this.sendingOtp = false; this.error = error.error?.message || 'Could not send the verification code. Please try again.'; }
    });
  }

  claimProfile(): void {
    if (!this.otpSent) { this.error = 'Request a verification code first.'; return; }
    if (!/^\d{6}$/.test(this.code.trim())) { this.error = 'Enter the six-digit verification code.'; return; }
    if (this.password && this.password !== this.passwordConfirmation) { this.error = 'Your passwords do not match.'; return; }
    this.claiming = true; this.error = ''; this.message = '';
    this.auth.verifyFamilyClaim(this.token, this.phone.trim(), this.code.trim(), this.password, this.passwordConfirmation).subscribe({
      next: response => {
        this.claiming = false;
        this.message = response.message || 'Family profile claimed successfully.';
        void this.router.navigateByUrl(response.user?.email ? '/home' : '/complete-profile', { replaceUrl: true });
      },
      error: error => {
        this.claiming = false;
        const errors = error.error?.errors;
        this.error = errors?.code?.[0] || errors?.password?.[0] || error.error?.message || 'We could not verify this family profile.';
      }
    });
  }
}
