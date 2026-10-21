import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { PostsService } from '../services/posts.service';

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
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly posts: PostsService, private readonly router: Router) {
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
    if (!this.content.trim() && !this.selectedFile) {
      this.errorMessage = 'Write something or add a photo/video before posting.';
      return;
    }

    this.submitting = true;
    this.posts.createPost(this.content, this.selectedFile).subscribe({
      next: () => {
        this.submitting = false;
        this.content = '';
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
        this.errorMessage = validation
          ? Object.values(validation).flat().join(' ')
          : (error.error?.message || 'We could not publish your post. Please try again.');
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
