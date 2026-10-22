import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { KnowledgeBaseService, KnowledgeCommunity, KnowledgeWard, KnowledgeRepresentative } from '../services/knowledge-base.service';

@Component({
  selector: 'app-constituency',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
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

  constructor(private readonly knowledgeBase: KnowledgeBaseService) {}

  ngOnInit(): void {
    this.loadCommunities();
    this.loadWards();
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
    this.knowledgeBase.getCommunities().subscribe({
      next: response => {
        this.communities = response.data ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.status === 0
          ? 'Could not connect to the knowledge base. Check your internet connection and try again.'
          : 'The community directory could not be loaded. Please try again later.';
      }
    });
  }

  loadWards(): void {
    this.knowledgeBase.getWards().subscribe({
      next: response => this.wards = response.data ?? [],
      error: () => {
        // Keep the directory usable if wards have not been loaded into the database yet.
        this.wards = [];
      }
    });
  }

  openCommunity(community: KnowledgeCommunity): void {
    this.selectedCommunity = community;
    this.detailLoading = true;
    this.detailError = '';
    this.knowledgeBase.getCommunity(community.slug).subscribe({
      next: response => {
        this.selectedCommunity = response.data;
        this.detailLoading = false;
      },
      error: () => {
        this.detailLoading = false;
        this.detailError = 'Community details are temporarily unavailable. Please try again.';
      }
    });
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
