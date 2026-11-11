import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { KnowledgeBaseService, KnowledgeCommunity, KnowledgeWard, KnowledgeRepresentative } from '../services/knowledge-base.service';

@Component({
  selector: 'app-constituency',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, RouterLink],
  templateUrl: './constituency.page.html',
  styleUrl: './constituency.page.scss'
})
export class ConstituencyPage implements OnInit {
  searchTerm = '';
  selectedCommunity: KnowledgeCommunity | null = null;
  activeTab: 'communities' | 'wards' = 'communities';
  communities: KnowledgeCommunity[] = [];
  wards: KnowledgeWard[] = [];
  loading = false;
  detailLoading = false;
  errorMessage = '';
  detailError = '';
  politicalTab: 'house_reps' | 'senators' | 'assembly' = 'house_reps';
  politicalRepresentatives: KnowledgeRepresentative[] = [];
  politicalLoading = false;
  politicalError = '';

  constructor(
    private readonly knowledgeBase: KnowledgeBaseService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCommunities();
    this.loadWards();
    this.loadPoliticalRepresentatives();
  }

  get filteredCommunities(): KnowledgeCommunity[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return term
      ? this.communities.filter(item => item.name.toLocaleLowerCase().includes(term))
      : this.communities;
  }

  loadCommunities(): void {
    this.loading = true;
    this.errorMessage = '';
    this.changeDetector.markForCheck();

    this.knowledgeBase.getCommunities().subscribe({
      next: response => {
        this.communities = response.data ?? [];
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.status === 0
          ? 'Could not connect to the knowledge base. Check your internet connection and try again.'
          : 'The community directory could not be loaded. Please try again later.';
        this.changeDetector.markForCheck();
      }
    });
  }

  loadWards(): void {
    this.knowledgeBase.getWards().subscribe({
      next: response => {
        this.wards = response.data ?? [];
        this.changeDetector.markForCheck();
      },
      error: () => {
        // Keep the directory usable if wards have not been loaded into the database yet.
        this.wards = [];
        this.changeDetector.markForCheck();
      }
    });
  }

  selectPoliticalTab(tab: 'house_reps' | 'senators' | 'assembly'): void {
    if (this.politicalTab === tab) return;
    this.politicalTab = tab;
    this.loadPoliticalRepresentatives();
  }

  loadPoliticalRepresentatives(): void {
    this.politicalLoading = true;
    this.politicalError = '';
    this.changeDetector.markForCheck();

    this.knowledgeBase.getPoliticalRepresentatives(this.politicalTab).subscribe({
      next: response => {
        this.politicalRepresentatives = response.data ?? [];
        this.politicalLoading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.politicalRepresentatives = [];
        this.politicalLoading = false;
        this.politicalError = 'Political representatives could not be loaded. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  representativeLocation(person: KnowledgeRepresentative): string {
    return [person.constituency, person.ward?.name, person.community?.name]
      .filter((value): value is string => !!value?.trim())
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(' · ') || 'Ogbia representation';
  }

  openCommunity(community: KnowledgeCommunity): void {
    void this.router.navigate(['/community', community.slug]);
  }

  closeCommunity(): void {
    this.selectedCommunity = null;
    this.detailError = '';
  }

  selectTab(tab: 'communities' | 'wards'): void {
    this.activeTab = tab;
    this.selectedCommunity = null;
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
}
