import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, AuthUser, CommunityLeader } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  referralCode = '';
  loading = true;
  savingPhoto = false;
  photoError = '';
  photoSuccess = '';
  photoPreview: string | null = null;
  selectedPhoto: File | null = null;
  leadersLoading = true;
  leadersError = '';
  leadershipGroups: { key: string; title: string; subtitle: string; icon: string; members: CommunityLeader[] }[] = [];

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly cdr: ChangeDetectorRef) {}

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  ngOnInit(): void {
    this.loadCommunityLeaders();
    this.user = this.auth.getCachedUser();
    this.referralCode = this.user?.referral_code || '';
    this.auth.getAuthenticatedUser().subscribe({
      next: (user) => {
        this.user = user;
        this.referralCode = user.referral_code || '';
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.photoError = error.status === 401
          ? 'Your session has expired. Please sign in again.'
          : 'Could not refresh your profile. Showing saved details if available.';
        this.cdr.markForCheck();
      },
    });
  }

  loadCommunityLeaders(): void {
    this.leadersLoading = true;
    this.leadersError = '';
    this.auth.getCommunityLeaders().subscribe({
      next: response => {
        const data = response.data;
        this.leadershipGroups = [
          { key: 'representative', title: 'Rep Member', subtitle: 'Your hometown representative', icon: 'people-circle-outline', members: data?.representative ?? [] },
          { key: 'clan_head', title: 'Clan Head', subtitle: 'Traditional leadership', icon: 'ribbon-outline', members: data?.clan_head ?? [] },
          { key: 'youth_leader', title: 'Youth Leader', subtitle: 'Youth leadership', icon: 'people-outline', members: data?.youth_leader ?? [] },
          { key: 'cdc_chairman', title: 'CDC Chairman', subtitle: 'Community development', icon: 'business-outline', members: data?.cdc_chairman ?? [] },
        ];
        this.leadersLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.leadersLoading = false;
        this.leadersError = 'Community leaders could not be loaded. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
  }

  get displayName(): string {
    return this.user?.name?.trim() || 'Ogbia Member';
  }

  get initials(): string {
    return this.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.photoError = '';
    this.photoSuccess = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'Choose a JPG, PNG, or WebP image.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'Your profile picture must be 5 MB or smaller.';
      input.value = '';
      return;
    }
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
    this.selectedPhoto = file;
    this.photoPreview = URL.createObjectURL(file);
    this.cdr.markForCheck();
  }

  uploadProfilePhoto(): void {
    if (!this.selectedPhoto || this.savingPhoto) return;
    this.savingPhoto = true;
    this.photoError = '';
    this.photoSuccess = '';
    this.auth.uploadProfilePhoto(this.selectedPhoto).subscribe({
      next: (response) => {
        this.user = response.user;
        this.selectedPhoto = null;
        if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
        this.photoPreview = null;
        this.savingPhoto = false;
        this.photoSuccess = response.message || 'Profile picture updated.';
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.savingPhoto = false;
        this.photoError = error.error?.errors?.profile_photo?.[0] ||
          error.error?.message || 'Could not upload your profile picture. Please try again.';
        this.cdr.markForCheck();
      }
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
