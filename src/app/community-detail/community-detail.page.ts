import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { KnowledgeBaseService, KnowledgeCommunity, KnowledgeRepresentative } from '../services/knowledge-base.service';

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, RouterLink],
  templateUrl: './community-detail.page.html',
  styleUrl: '../constituency/constituency.page.scss'
})
export class CommunityDetailPage implements OnInit {
  community: KnowledgeCommunity | null = null;
  loading = true;
  errorMessage = '';
  coverPhotoFailed = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly knowledgeBase: KnowledgeBaseService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) {
        this.loading = false;
        this.errorMessage = 'The community could not be identified.';
        this.changeDetector.markForCheck();
        return;
      }
      this.loadCommunity(slug);
    });
  }

  loadCommunity(slug: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.coverPhotoFailed = false;
    this.knowledgeBase.getCommunity(slug).subscribe({
      next: response => {
        this.community = response.data;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.community = null;
        this.loading = false;
        this.errorMessage = 'Community details are temporarily unavailable. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  roleIcon(role: string): string {
    const value = role.toLowerCase();
    if (value.includes('clan') || value.includes('traditional')) return 'ribbon-outline';
    if (value.includes('senate') || value.includes('senator')) return 'podium-outline';
    if (value.includes('assembly')) return 'business-outline';
    if (value.includes('representative') || value.includes('house of reps')) return 'people-circle-outline';
    if (value.includes('ward') || value.includes('councillor') || value.includes('councilor')) return 'people-outline';
    return 'home-outline';
  }

  roleSubtitle(role: string): string {
    const value = role.toLowerCase();
    if (value.includes('clan') || value.includes('traditional')) return 'Traditional leadership';
    if (value.includes('senate') || value.includes('senator')) return 'Bayelsa East Senatorial District';
    if (value.includes('assembly')) return 'Bayelsa State legislature';
    if (value.includes('representative') || value.includes('house of reps')) return 'Federal constituency';
    if (value.includes('ward') || value.includes('councillor') || value.includes('councilor')) return 'Ward-level representation';
    return 'Community leadership';
  }

  representativeLabel(person: KnowledgeRepresentative): string {
    return person.full_name?.trim() || 'Representative not yet listed';
  }

  onCoverPhotoError(): void {
    this.coverPhotoFailed = true;
    this.changeDetector.markForCheck();
  }

  retry(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) this.loadCommunity(slug);
  }
}
