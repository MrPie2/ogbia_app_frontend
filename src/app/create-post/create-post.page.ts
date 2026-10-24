import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { PostsService, PostPrivacy } from '../services/posts.service';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterLink],
  templateUrl: './create-post.page.html',
  styleUrl: './create-post.page.scss'
})
export class CreatePostPage implements OnDestroy {
  content = '';
  displayName = 'Your profile';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  privacy: PostPrivacy = 'public';
  postType: 'standard' | 'event' = 'standard';
  eventTitle = '';
  eventStartsAt = '';
  eventEndsAt = '';
  eventLocation = '';
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly posts: PostsService, private readonly router: Router, private readonly route: ActivatedRoute) {
    this.postType = this.route.snapshot.queryParamMap.get('type') === 'event' ? 'event' : 'standard';
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      this.displayName = user.name || 'Your profile';
    } catch {
      this.displayName = 'Your profile';
    }
  }

  get initials(): string {
    return this.displayName.trim().charAt(0).toUpperCase() || 'O';
  }

  get mediaKind(): 'image' | 'video' | null {
    if (!this.selectedFile) return null;
    return this.selectedFile.type.startsWith('video/') ? 'video' : 'image';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage = '';
    this.successMessage = '';
    if (!file) return;

    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const isVideo = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
    if (!isImage && !isVideo) {
      this.errorMessage = 'Choose a JPG, PNG or WebP image, or an MP4, MOV or WebM video.';
      input.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.errorMessage = 'Your file must be 50 MB or smaller.';
      input.value = '';
      return;
    }

    this.clearPreview();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  removeMedia(): void {
    this.clearPreview();
    this.selectedFile = null;
  }

  publish(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.postType === 'event') {
      if (!this.eventTitle.trim() || !this.eventStartsAt || !this.eventLocation.trim()) {
        this.errorMessage = 'Add an event title, start date and time, and location.';
        return;
      }
      if (new Date(this.eventStartsAt).getTime() <= Date.now()) {
        this.errorMessage = 'Choose a future date and time for your event.';
        return;
      }
      if (this.eventEndsAt && new Date(this.eventEndsAt).getTime() <= new Date(this.eventStartsAt).getTime()) {
        this.errorMessage = 'The event end time must be after its start time.';
        return;
      }
    } else if (!this.content.trim() && !this.selectedFile) {
      this.errorMessage = 'Write something or add a photo/video before posting.';
      return;
    }

    this.submitting = true;
    const eventDetails = this.postType === 'event' ? {
      title: this.eventTitle.trim(),
      startsAt: this.eventStartsAt,
      endsAt: this.eventEndsAt || null,
      location: this.eventLocation.trim()
    } : undefined;
    this.posts.createPost(this.content, this.selectedFile, this.privacy, eventDetails).pipe(timeout(45000)).subscribe({
      next: () => {
        this.submitting = false;
        this.content = '';
        this.eventTitle = '';
        this.eventStartsAt = '';
        this.eventEndsAt = '';
        this.eventLocation = '';
        this.postType = 'standard';
        this.clearPreview();
        this.selectedFile = null;
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }
        const validation = error.error?.errors;
        if (error.error === 'TimeoutError') {
          this.errorMessage = 'The server took too long to respond. Your post may not have been saved. Please check your feed before trying again.';
        } else if (error.status === 0) {
          this.errorMessage = 'Could not reach the Ogbia server. Check your internet connection and try again.';
        } else {
          this.errorMessage = validation
            ? Object.values(validation).flat().join(' ')
            : (error.error?.message || `We could not publish your post (HTTP ${error.status}). Please try again.`);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  private clearPreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }
}
