import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, AuthUser } from '../services/auth.service';
import { CommunityPost, PostsService } from '../services/posts.service';

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

  constructor(
    private readonly auth: AuthService,
    private readonly postsService: PostsService,
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
      next: (user) => {
        this.user = user;
        this.loadingUser = false;
      },
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

  get displayName(): string {
    return this.user?.name?.trim() || 'Ogbia user';
  }

  get initials(): string {
    return this.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  postInitials(post: CommunityPost): string {
    return (post.author?.name || 'Ogbia member').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
