import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { PostsService, PostPrivacy } from '../services/posts.service';
import { TimeoutError, timeout } from 'rxjs';

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
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  privacy: PostPrivacy = 'public';
  postType: 'standard' | 'event' = 'standard';
  eventTitle = '';
  eventStartsAt = '';
  eventEndsAt = '';
  eventLocation = '';
  submitting = false;
  uploadProgress: number | null = null;
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

  get mediaKind(): 'video' | null {
    return this.selectedFile ? 'video' : null;
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.errorMessage = '';
    this.successMessage = '';
    if (!files.length) return;
    this.clearVideoPreview();
    this.selectedFile = null;

    const remaining = 10 - this.selectedImages.length;
    if (files.length > remaining) this.errorMessage = 'You can add up to 10 images to one post.';

    for (const file of files.slice(0, Math.max(0, remaining))) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.errorMessage = 'Choose JPG, PNG or WebP images only.';
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'Each image must be 10 MB or smaller.';
        continue;
      }
      const currentTotal = this.selectedImages.reduce((total, selected) => total + selected.size, 0);
      if (currentTotal + file.size > 50 * 1024 * 1024) {
        this.errorMessage = 'The combined image upload must be 50 MB or smaller.';
        continue;
      }
      this.selectedImages.push(file);
      this.imagePreviewUrls.push(URL.createObjectURL(file));
    }
    input.value = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage = '';
    this.successMessage = '';
    if (!file) return;

    const isVideo = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
    if (!isVideo) {
      this.errorMessage = 'Choose an MP4, MOV or WebM video.';
      input.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.errorMessage = 'Your video must be 50 MB or smaller.';
      input.value = '';
      return;
    }

    this.clearImagePreviews();
    this.selectedImages = [];
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    input.value = '';
  }

  removeImage(index: number): void {
    const preview = this.imagePreviewUrls[index];
    if (preview) URL.revokeObjectURL(preview);
    this.imagePreviewUrls.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  removeMedia(): void {
    this.clearVideoPreview();
    this.selectedFile = null;
  }

  publish(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.submitting) return;

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
    } else if (!this.content.trim() && !this.selectedFile && !this.selectedImages.length) {
      this.errorMessage = 'Write something or add a photo/video before posting.';
      return;
    }

    this.submitting = true;
    this.uploadProgress = 0;
    const eventDetails = this.postType === 'event' ? {
      title: this.eventTitle.trim(),
      startsAt: this.eventStartsAt,
      endsAt: this.eventEndsAt || null,
      location: this.eventLocation.trim()
    } : undefined;
    const media = this.selectedImages.length ? this.selectedImages : this.selectedFile;
    this.posts.createPost(this.content, media, this.privacy, eventDetails).pipe(timeout({ first: 180000, each: 180000 })).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = event.total ? Math.round((event.loaded / event.total) * 100) : null;
          return;
        }
        if (event.type !== HttpEventType.Response) return;
        this.submitting = false;
        this.uploadProgress = null;
        this.content = '';
        this.eventTitle = '';
        this.eventStartsAt = '';
        this.eventEndsAt = '';
        this.eventLocation = '';
        this.postType = 'standard';
        this.clearVideoPreview();
        this.clearImagePreviews();
        this.selectedFile = null;
        this.selectedImages = [];
        this.router.navigate(['/home']);
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.uploadProgress = null;

        if (error instanceof TimeoutError) {
          this.errorMessage = 'The upload is taking longer than expected. Check your feed before retrying so you do not publish the same post twice.';
          return;
        }

        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          const validation = error.error?.errors;
          if (error.status === 0) {
            this.errorMessage = 'Could not reach the Ogbia server. Check your internet connection and try again.';
          } else {
            this.errorMessage = validation
              ? Object.values(validation).flat().join(' ')
              : (error.error?.message || ('We could not publish your post (HTTP ' + error.status + '). Please try again.'));
          }
          return;
        }

        this.errorMessage = 'An unexpected error occurred while publishing your post. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    this.clearVideoPreview();
    this.clearImagePreviews();
  }

  private clearVideoPreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  private clearImagePreviews(): void {
    this.imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    this.imagePreviewUrls = [];
  }
}
