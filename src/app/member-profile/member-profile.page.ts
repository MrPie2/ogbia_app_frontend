import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, MemberProfile } from '../services/auth.service';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, RouterLink],
  templateUrl: './member-profile.page.html',
  styleUrl: './member-profile.page.scss',
})
export class MemberProfilePage implements OnInit {
  member: MemberProfile | null = null;
  loading = true;
  errorMessage = '';

  constructor(private readonly route: ActivatedRoute, private readonly auth: AuthService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id < 1) {
        this.loading = false;
        this.errorMessage = 'This member profile could not be found.';
        return;
      }
      this.loading = true;
      this.errorMessage = '';
      this.auth.getMemberProfile(id).pipe(timeout(15000)).subscribe({
        next: response => {
          this.member = response?.data ?? null;
          this.loading = false;
          if (!this.member) this.errorMessage = 'This member profile could not be found.';
          this.cdr.markForCheck();
        },
        error: error => {
          this.loading = false;
          this.cdr.markForCheck();
          this.errorMessage = error.status === 404
            ? 'This member profile could not be found.'
            : error.name === 'TimeoutError'
              ? 'Loading this profile took too long. Check your connection and try again.'
              : error.status === 0
                ? 'Could not reach the profile server. Check your connection and try again.'
                : 'Unable to load this member profile. Please try again.';
        }
      });
    });
  }

  get roleLabel(): string {
    const labels: Record<string, string> = {
      representative: 'Rep Member',
      community_representative: 'Community Representative',
      clan_head: 'Clan Head',
      youth_leader: 'Youth Leader',
      cdc_chairman: 'CDC Chairman',
      senate_member: 'Senate Member',
      councillor: 'Councillor',
      house_of_representatives_member: 'House of Representatives Member',
      house_of_assembly_member: 'House of Assembly Member',
    };
    return this.member?.community_role ? labels[this.member.community_role] || 'Ogbia Connect Member' : 'Ogbia Connect Member';
  }

  get initials(): string {
    return (this.member?.name || 'Ogbia Member').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }
}
