import { ChangeDetectorRef, Component, OnDestroy, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, AuthUser, CommunityLeader, FamilyMember, FamilyProfileResponse, UserMemory } from '../services/auth.service';
import { KnowledgeBaseService } from '../services/knowledge-base.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfilePage implements OnInit, OnDestroy {
  user: AuthUser | null = null;
  referralCode = '';
  loading = true;
  savingPhoto = false;
  photoError = '';
  photoSuccess = '';
  photoPreview: string | null = null;
  profilePhotoViewerOpen = false;
  selectedPhoto: File | null = null;
  family: FamilyProfileResponse['data'] = { children: [], father: null, mother: null, all: [] };
  familyLoading = true;
  familyError = '';
  childrenListOpen = false;
  familyFormOpen = false;
  familySaving = false;
  familyFormName = '';
  familyFormPhone = '';
  familyFormRelationship: 'child' | 'father' | 'mother' = 'child';
  familyGuardianRelationship: 'father' | 'mother' = 'father';
  familyFormError = '';
  newFamilyClaimLink = '';
  familyInviteReady = false;
  memories: UserMemory[] = [];
  selectedMemory: File | null = null;
  loadingMemories = true;
  uploadingMemory = false;
  memoryError = '';
  memorySuccess = '';
  leadersLoading = true;
  leadersError = '';
  leadershipGroups: { key: string; title: string; subtitle: string; icon: string; members: CommunityLeader[] }[] = [];
  hometownWards: string[] = [];
  wardLookupLoading = false;
  wardLookupFailed = false;
  readonly constituencyName = 'Ogbia Federal Constituency';

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly cdr: ChangeDetectorRef, private readonly knowledgeBase: KnowledgeBaseService) {}

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  ngOnInit(): void {
    this.loadFamilyProfile();
    this.loadCommunityLeaders();
    this.loadMemories();
    this.user = this.auth.getCachedUser();
    this.referralCode = this.user?.referral_code || '';
    this.loadHometownWards(this.user?.hometown);
    this.auth.getAuthenticatedUser().subscribe({
      next: (user) => {
        this.user = user;
        this.referralCode = user.referral_code || '';
        this.loadHometownWards(user.hometown);
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

  get visibleChildren(): FamilyMember[] {
    return this.family.children.slice(0, 4);
  }

  familyInitials(name: string | null | undefined): string {
    return (name || 'Ogbia Member').trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(part => part[0]).join('').toUpperCase();
  }

  loadFamilyProfile(): void {
    this.familyLoading = true;
    this.familyError = '';
    this.auth.getFamilyProfile().subscribe({
      next: response => {
        this.family = response.data || { children: [], father: null, mother: null, all: [] };
        this.familyLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.familyLoading = false;
        this.familyError = 'Your family connections could not be loaded.';
        this.cdr.markForCheck();
      }
    });
  }

  openChildrenList(): void { this.childrenListOpen = true; }
  closeChildrenList(): void { this.childrenListOpen = false; }
  openFamilyForm(): void { this.familyFormOpen = true; this.familyFormError = ''; }
  closeFamilyForm(): void { this.familyFormOpen = false; }

  saveFamilyProfile(): void {
    const name = this.familyFormName.trim();
    if (name.length < 2) { this.familyFormError = 'Enter the family member’s full name.'; return; }
    this.familySaving = true; this.familyFormError = '';
    this.auth.createFamilyProfile(name, this.familyFormRelationship, this.familyFormPhone, this.familyGuardianRelationship).subscribe({
      next: response => {
        this.familySaving = false; this.familyFormOpen = false;
        this.familyFormName = ''; this.familyFormPhone = ''; this.familyFormRelationship = 'child'; this.familyGuardianRelationship = 'father';
        this.loadFamilyProfile();
        if (response.data?.claim_token) { this.newFamilyClaimLink = this.familyClaimUrl(response.data.claim_token); this.familyInviteReady = true; }
        this.cdr.markForCheck();
      },
      error: error => {
        this.familySaving = false;
        this.familyFormError = error.error?.errors?.relationship?.[0] || error.error?.message || 'Could not create this family profile.';
        this.cdr.markForCheck();
      }
    });
  }

  familyClaimUrl(token: string): string { return window.location.protocol.startsWith('http') ? `${window.location.origin}/family/claim/${token}` : token; }

  async shareFamilyClaim(member: FamilyMember): Promise<void> {
    const link = this.familyClaimUrl(member.claim_token);
    try {
      if (navigator.share) await navigator.share({ title: 'Claim your Ogbia family profile', text: link.startsWith('http') ? 'Use this secure link to claim your family profile on Ogbia Connect.' : `Your Ogbia Connect family claim code is: ${link}. Open the app and choose Claim family profile.`, ...(link.startsWith('http') ? { url: link } : {}) });
      else await navigator.clipboard.writeText(link);
    } catch { try { await navigator.clipboard.writeText(link); } catch { window.prompt('Copy this family claim link:', link); } }
  }

  removeFamilyProfile(member: FamilyMember): void {
    if (member.claim_status === 'claimed') return;
    if (!window.confirm(`Remove ${member.name || 'this family profile'}?`)) return;
    this.auth.deleteFamilyProfile(member.id).subscribe({
      next: () => { this.loadFamilyProfile(); this.cdr.markForCheck(); },
      error: error => {
        this.familyError = error.error?.message || 'Could not remove this family profile.';
        this.cdr.markForCheck();
      }
    });
  }

  async copyNewFamilyClaimLink(): Promise<void> {
    if (!this.newFamilyClaimLink) return;
    try { await navigator.clipboard.writeText(this.newFamilyClaimLink); } catch { window.prompt('Copy family claim link:', this.newFamilyClaimLink); }
    this.familyInviteReady = false;
  }

  private loadHometownWards(hometown: string | null | undefined): void {
    this.hometownWards = [];
    this.wardLookupFailed = false;
    const communityName = hometown?.trim();
    if (!communityName) {
      this.wardLookupLoading = false;
      return;
    }

    this.wardLookupLoading = true;
    const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
    this.knowledgeBase.getCommunities().subscribe({
      next: response => {
        const community = (response.data || []).find(item => normalize(item.name) === normalize(communityName));
        if (!community) {
          this.wardLookupLoading = false;
          this.cdr.markForCheck();
          return;
        }

        this.knowledgeBase.getCommunity(community.slug).subscribe({
          next: detail => {
            this.hometownWards = (detail.data?.wards || []).map(ward => ward.name).filter(Boolean);
            this.wardLookupLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.wardLookupLoading = false;
            this.wardLookupFailed = true;
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.wardLookupLoading = false;
        this.wardLookupFailed = true;
        this.cdr.markForCheck();
      }
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

  get hasCommunityLeaders(): boolean {
    return this.leadershipGroups.some(group => group.members.length > 0);
  }

  initialsForLeader(name: string | null | undefined): string {
    return (name || 'Ogbia Member').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  get displayName(): string {
    return this.user?.name?.trim() || 'Ogbia Member';
  }

  get initials(): string {
    return this.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  openProfilePhotoPreview(): void {
    if (this.user?.profile_photo_url) this.profilePhotoViewerOpen = true;
  }

  closeProfilePhotoPreview(): void {
    this.profilePhotoViewerOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeProfilePhotoPreview();
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

  loadMemories(): void {
    this.loadingMemories = true;
    this.auth.getMyMemories().subscribe({
      next: response => {
        this.memories = response.data ?? [];
        this.loadingMemories = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingMemories = false;
        this.memoryError = 'Your memories could not be loaded. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  onMemorySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.memoryError = '';
    this.memorySuccess = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.memoryError = 'Choose an image or video file.';
      input.value = '';
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      this.memoryError = 'Each photo or video must be 100 MB or smaller.';
      input.value = '';
      return;
    }
    this.selectedMemory = file;
    this.cdr.markForCheck();
  }

  uploadSelectedMemory(): void {
    if (!this.selectedMemory || this.uploadingMemory) return;
    this.uploadingMemory = true;
    this.memoryError = '';
    this.memorySuccess = '';
    this.auth.uploadMemory(this.selectedMemory).subscribe({
      next: response => {
        this.memories = [response.data, ...this.memories];
        this.selectedMemory = null;
        this.uploadingMemory = false;
        this.memorySuccess = response.message || 'Memory uploaded successfully.';
        this.cdr.markForCheck();
      },
      error: error => {
        this.uploadingMemory = false;
        this.memoryError = error.error?.errors?.media?.[0] || error.error?.message || 'Could not upload this memory. Please try again.';
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
