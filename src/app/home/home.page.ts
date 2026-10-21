import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, AuthUser } from '../services/auth.service';
import { CommunityPost, PostsService } from '../services/posts.service';
import { StoriesService, StoryGroup } from '../services/stories.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe, IonContent, IonIcon, RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage implements OnInit {
  user: AuthUser | null = null;
  loadingUser = true;
  userError = '';
  posts: CommunityPost[] = [];
  loadingPosts = true;
  feedError = '';
  storyGroups: StoryGroup[] = [];
  loadingStories = true;
  storiesError = '';
  activeStoryGroup: StoryGroup | null = null;
  activeStoryIndex = 0;

  constructor(
    private readonly auth: AuthService,
    private readonly postsService: PostsService,
    private readonly storiesService: StoriesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = this.auth.getCachedUser();
    this.auth.getAuthenticatedUser().subscribe({
      next: (user) => { this.user = user; this.loadingUser = false; },
      error: (error: HttpErrorResponse) => {
        this.loadingUser = false;
        if (error.status === 401 || error.status === 419) {
          this.auth.logout();
          this.router.navigate(['/login']);
          return;
        }
        this.userError = 'We could not refresh your account details. Showing saved details if available.';
      }
    });
    this.loadFeed();
  }

  ionViewWillEnter(): void {
    if (localStorage.getItem('token')) this.loadStories();
  }

  loadFeed(): void {
    this.loadingPosts = true;
    this.postsService.getPosts().subscribe({
      next: (response) => {
        this.posts = response.data || [];
        this.loadingPosts = false;
        this.feedError = '';
      },
      error: (error: HttpErrorResponse) => {
        this.loadingPosts = false;
        if (error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login']);
          return;
        }
        this.feedError = 'The community feed could not be loaded. Please try again.';
      }
    });
  }

  loadStories(): void {
    this.loadingStories = true;
    this.storiesService.getStories().subscribe({
      next: (response) => {
        this.storyGroups = response.data || [];
        this.loadingStories = false;
        this.storiesError = '';
      },
      error: (error: HttpErrorResponse) => {
        this.loadingStories = false;
        if (error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login']);
          return;
        }
        this.storiesError = 'Stories could not be loaded.';
      }
    });
  }

  openStory(group: StoryGroup): void {
    if (group.is_mine && !group.stories.length) {
      this.router.navigate(['/create-story']);
      return;
    }
    if (!group.stories.length) return;
    this.activeStoryGroup = group;
    this.activeStoryIndex = 0;
  }

  nextStory(): void {
    if (!this.activeStoryGroup) return;
    if (this.activeStoryIndex < this.activeStoryGroup.stories.length - 1) {
      this.activeStoryIndex++;
      return;
    }
    const currentIndex = this.storyGroups.findIndex(group => group.user.id === this.activeStoryGroup?.user.id);
    const nextGroup = this.storyGroups.slice(currentIndex + 1).find(group => group.stories.length > 0);
    if (nextGroup) {
      this.activeStoryGroup = nextGroup;
      this.activeStoryIndex = 0;
    } else {
      this.closeStory();
    }
  }

  closeStory(): void {
    this.activeStoryGroup = null;
    this.activeStoryIndex = 0;
  }

  get displayName(): string { return this.user?.name?.trim() || 'Ogbia user'; }

  get initials(): string {
    return this.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  storyInitials(group: StoryGroup): string {
    return (group.user.name || 'Ogbia member').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  postInitials(post: CommunityPost): string {
    return (post.author?.name || 'Ogbia member').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}