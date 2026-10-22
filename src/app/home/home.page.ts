import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, AuthUser } from '../services/auth.service';
import { CommunityPost, PostsService } from '../services/posts.service';
import { StoriesService, StoryGroup, StoryItem } from '../services/stories.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe, IonContent, IonIcon, RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage implements OnInit, OnDestroy {
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
  storyProgress = 0;
  storyPaused = false;
  storyActionError = '';
  deletingStory = false;
  private storyPointerStartedAt = 0;
  private suppressStoryTap = false;

  private storyTimer: ReturnType<typeof setInterval> | null = null;
  private storyStartedAt = 0;
  private storyElapsedBeforePause = 0;
  private storyDuration = 7000;

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

    // Load immediately when Home is first created (including immediately after login).
    // The Ionic view-enter hook below handles later returns to this cached page.
    this.loadFeed();
    this.loadStories();
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
  }

  ngOnDestroy(): void {
    this.stopStoryTimer();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeStoryGroup) this.closeStory();
  }

  ionViewWillEnter(): void {
    // Keep the feed and stories current whenever Home becomes visible.
    // ngOnInit also loads both immediately on first creation; this refresh
    // handles Ionic's cached-page navigation and returning from Create Post.
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadFeed();
    this.loadStories();
  }

  loadFeed(): void {
    this.loadingPosts = true;
    this.postsService.getPosts().pipe(timeout(15000)).subscribe({
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
        this.feedError = error.name === 'TimeoutError'
          ? 'The community feed is taking too long to respond. Check your connection or API server, then retry.'
          : 'The community feed could not be loaded. Please try again.';
      }
    });
  }

  loadStories(): void {
    this.loadingStories = true;
    this.storiesService.getStories().pipe(timeout(15000)).subscribe({
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
        this.storiesError = error.name === 'TimeoutError'
          ? 'Stories are taking too long to load. Check your connection or API server, then retry.'
          : 'Stories could not be loaded.';
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
    this.storyActionError = '';
    this.startStoryTimer();
  }

  nextStory(): void {
    if (!this.activeStoryGroup) return;
    if (this.activeStoryIndex < this.activeStoryGroup.stories.length - 1) {
      this.activeStoryIndex++;
      this.startStoryTimer();
      return;
    }
    const currentIndex = this.storyGroups.findIndex(group => group.user.id === this.activeStoryGroup?.user.id);
    const nextGroup = this.storyGroups.slice(currentIndex + 1).find(group => group.stories.length > 0);
    if (nextGroup) {
      this.activeStoryGroup = nextGroup;
      this.activeStoryIndex = 0;
      this.startStoryTimer();
    } else {
      this.closeStory();
    }
  }

  previousStory(): void {
    if (!this.activeStoryGroup) return;
    if (this.activeStoryIndex > 0) {
      this.activeStoryIndex--;
      this.startStoryTimer();
      return;
    }
    const currentIndex = this.storyGroups.findIndex(group => group.user.id === this.activeStoryGroup?.user.id);
    const previousGroup = this.storyGroups.slice(0, currentIndex).reverse().find(group => group.stories.length > 0);
    if (previousGroup) {
      this.activeStoryGroup = previousGroup;
      this.activeStoryIndex = previousGroup.stories.length - 1;
      this.startStoryTimer();
    } else {
      this.storyProgress = 0;
      this.startStoryTimer();
    }
  }

  closeStory(): void {
    this.stopStoryTimer();
    this.activeStoryGroup = null;
    this.activeStoryIndex = 0;
    this.storyProgress = 0;
    this.storyPaused = false;
    this.storyActionError = '';
  }

  toggleStoryPause(paused: boolean): void {
    if (!this.activeStoryGroup || this.currentStory?.type === 'video') return;
    if (paused === this.storyPaused) return;

    if (paused) {
      this.storyElapsedBeforePause += Date.now() - this.storyStartedAt;
      this.stopStoryTimer();
      this.storyPaused = true;
      return;
    }

    this.storyPaused = false;
    this.runStoryTimer();
  }

  beginStoryPress(): void {
    if (!this.activeStoryGroup || this.currentStory?.type === 'video') return;
    this.storyPointerStartedAt = Date.now();
    this.toggleStoryPause(true);
  }

  endStoryPress(): void {
    if (!this.storyPointerStartedAt) return;
    this.suppressStoryTap = Date.now() - this.storyPointerStartedAt > 250;
    this.storyPointerStartedAt = 0;
    this.toggleStoryPause(false);
  }

  handleStoryTap(direction: 'previous' | 'next'): void {
    if (this.suppressStoryTap) {
      this.suppressStoryTap = false;
      return;
    }
    if (direction === 'previous') this.previousStory();
    else this.nextStory();
  }

  deleteCurrentStory(): void {
    const story = this.currentStory;
    const group = this.activeStoryGroup;
    if (!story || !group?.is_mine || this.deletingStory) return;

    this.deletingStory = true;
    this.storyActionError = '';
    this.storiesService.deleteStory(story.id).subscribe({
      next: () => {
        const updatedStories = group.stories.filter(item => item.id !== story.id);
        this.storyGroups = this.storyGroups.map(item => item.user.id === group.user.id
          ? { ...item, stories: updatedStories, has_unseen: updatedStories.length > 0 }
          : item);
        this.deletingStory = false;
        if (!updatedStories.length) {
          this.closeStory();
          return;
        }
        this.activeStoryGroup = { ...group, stories: updatedStories };
        this.activeStoryIndex = Math.min(this.activeStoryIndex, updatedStories.length - 1);
        this.startStoryTimer();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingStory = false;
        this.storyActionError = error.status === 403
          ? 'You can only delete your own stories.'
          : 'Could not delete this story. Please try again.';
      }
    });
  }

  get currentStory(): StoryItem | null {
    return this.activeStoryGroup?.stories[this.activeStoryIndex] ?? null;
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
    this.closeStory();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  updateVideoProgress(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      this.storyProgress = Math.min(100, (video.currentTime / video.duration) * 100);
    }
  }

  private markStoryViewed(story: StoryItem): void {
    const group = this.activeStoryGroup;
    if (!group || group.is_mine || story.is_viewed) return;

    this.storiesService.markViewed(story.id).subscribe({
      next: () => {
        story.is_viewed = true;
        this.storyGroups = this.storyGroups.map(item => item.user.id === group.user.id
          ? {
              ...item,
              stories: item.stories.map(entry => entry.id === story.id ? { ...entry, is_viewed: true } : entry),
              has_unseen: item.stories.some(entry => entry.id !== story.id && !entry.is_viewed)
            }
          : item);
      }
    });
  }

  private startStoryTimer(): void {
    this.stopStoryTimer();
    this.storyProgress = 0;
    this.storyElapsedBeforePause = 0;
    this.storyPaused = false;
    this.storyActionError = '';
    const story = this.currentStory;
    if (!story) return;
    this.markStoryViewed(story);
    if (story.type === 'video') return;
    this.storyDuration = story.type === 'text' ? 6000 : 7000;
    this.runStoryTimer();
  }

  private runStoryTimer(): void {
    this.stopStoryTimer();
    this.storyStartedAt = Date.now();
    this.storyTimer = setInterval(() => {
      if (this.storyPaused || !this.activeStoryGroup) return;
      const elapsed = this.storyElapsedBeforePause + (Date.now() - this.storyStartedAt);
      this.storyProgress = Math.min(100, (elapsed / this.storyDuration) * 100);
      if (elapsed >= this.storyDuration) this.nextStory();
    }, 50);
  }

  private stopStoryTimer(): void {
    if (this.storyTimer) {
      clearInterval(this.storyTimer);
      this.storyTimer = null;
    }
  }
}