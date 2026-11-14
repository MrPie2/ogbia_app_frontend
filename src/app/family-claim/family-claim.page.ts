import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  otpSent = false;
  sendingOtp = false;
  verifying = false;
  verified = false;
  claimId: number | null = null;
  error = '';
  message = '';

  constructor(private readonly route: ActivatedRoute, private readonly auth: AuthService) {}

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
    this.verifying = true; this.error = ''; this.message = '';
    this.auth.verifyFamilyClaim(this.token, this.phone.trim(), this.code.trim()).subscribe({
      next: response => {
        this.verifying = false;
        this.verified = true;
        this.claimId = response.data?.claim_id ?? null;
        this.message = response.message || 'Your phone number is verified. The profile creator has been notified.';
      },
      error: error => {
        this.verifying = false;
        this.error = error.error?.message || 'We could not verify this family profile.';
      }
    });
  }
}
