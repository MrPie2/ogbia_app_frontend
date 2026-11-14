import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AdminFamilyClaimItem, AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-family-claims',
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule],
  templateUrl: './admin-family-claims.page.html',
  styleUrl: './admin-family-claims.page.scss',
})
export class AdminFamilyClaimsPage implements OnInit {
  claims: AdminFamilyClaimItem[] = [];
  loading = true;
  savingId: number | null = null;
  error = '';
  message = '';
  notes: Record<number, string> = {};

  constructor(private readonly auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.auth.getAdminFamilyClaims().subscribe({
      next: response => { this.claims = response.data || []; this.loading = false; },
      error: error => {
        this.loading = false;
        this.error = error.status === 403
          ? 'Administrator access is required to review family claims.'
          : error.error?.message || 'Could not load family claim requests.';
      }
    });
  }

  decide(claim: AdminFamilyClaimItem, decision: 'approved' | 'rejected'): void {
    const note = (this.notes[claim.id] || '').trim();
    if (decision === 'rejected' && note.length < 5) {
      this.error = 'Add a short explanation before rejecting a claim.';
      return;
    }
    this.savingId = claim.id;
    this.error = '';
    this.message = '';
    this.auth.reviewFamilyClaimAsAdmin(claim.id, decision, note).subscribe({
      next: () => {
        this.savingId = null;
        this.message = decision === 'approved'
          ? 'Claim approved. The claimant can now complete account linking.'
          : 'Claim rejected. The claimant will not be able to complete ownership transfer.';
        this.load();
      },
      error: error => {
        this.savingId = null;
        this.error = error.error?.message || 'Could not update this claim.';
      }
    });
  }
}
