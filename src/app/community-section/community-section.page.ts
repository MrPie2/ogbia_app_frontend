import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { PostsService, CommunityPost } from '../services/posts.service';

type SectionCategory = 'politics' | 'entertainment' | 'photos' | 'events';

@Component({
  selector: 'app-community-section',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, IonContent, IonIcon],
  templateUrl: './community-section.page.html',
  styleUrl: './community-section.page.scss'
})
export class CommunitySectionPage implements OnInit {
  category: SectionCategory = 'politics';
  posts: CommunityPost[] = [];
  loading = true;
  error = '';

  private readonly sectionDetails: Record<SectionCategory, { title: string; subtitle: string; icon: string; emptyTitle: string; emptyText: string }> = {
    politics: {
      title: 'Politics',
      subtitle: 'Civic conversations, public affairs and community leadership across Ogbia.',
      icon: 'landmark-outline',
      emptyTitle: 'No political posts yet',
      emptyText: 'When members share posts under Politics, they will appear here.'
    },
    entertainment: {
      title: 'Entertainment',
      subtitle: 'Culture, music, creative work and entertainment from our people.',
      icon: 'film-outline',
      emptyTitle: 'No entertainment posts yet',
      emptyText: 'Be the first to share something under Entertainment.'
    },
    photos: {
      title: 'Photos',
      subtitle: 'A gallery of moments and pictures shared by the Ogbia community.',
      icon: 'images-outline',
      emptyTitle: 'No photos shared yet',
      emptyText: 'Photos shared in the community will appear here.'
    },
    events: {
      title: 'Events',
      subtitle: 'Discover upcoming gatherings, meetings and activities in Ogbia.',
      icon: 'calendar-outline',
      emptyTitle: 'No events available',
      emptyText: 'Scheduled community events will appear here.'
    }
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly postsService: PostsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const requested = params.get('category') as SectionCategory | null;
      this.category = requested && requested in this.sectionDetails ? requested : 'politics';
      this.loadPosts();
    });
  }

  get details() {
    return this.sectionDetails[this.category];
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    this.postsService.getPosts(1, '', this.category).subscribe({
      next: response => {
        this.posts = response.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.error = error.status === 401
          ? 'Please sign in again to view this section.'
          : 'We could not load this section. Check your connection and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  postText(post: CommunityPost): string {
    return post.is_event ? (post.event_title || post.content || 'Community event') : (post.content || 'Shared a photo');
  }
}
