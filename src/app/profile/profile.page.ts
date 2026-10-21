import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  referralCode = '';

  constructor(private readonly auth: AuthService) {}

  ngOnInit(): void {
    const cached = this.auth.getCachedUser();
    this.referralCode = cached?.referral_code || '';
    this.auth.getAuthenticatedUser().subscribe({
      next: (user) => this.referralCode = user.referral_code || '',
      error: () => {},
    });
  }

  async copyReferralId(): Promise<void> {
    if (!this.referralCode) return;
    try {
      await navigator.clipboard.writeText(this.referralCode);
      window.alert('Referral ID copied.');
    } catch {
      window.prompt('Copy your Referral ID:', this.referralCode);
    }
  }
}
