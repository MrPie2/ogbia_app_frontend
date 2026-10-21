import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { StoriesService } from '../services/stories.service';

@Component({
  selector: 'app-create-story',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterLink],
  templateUrl: './create-story.page.html',
  styleUrl: './create-story.page.scss'
})
export class CreateStoryPage implements OnDestroy {
  type: 'text' | 'image' | 'video' = 'text';
  content = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  submitting = false;
  errorMessage = '';
  textBackground = 0;
  readonly backgrounds = ['#183d68', '#56306e', '#17634f', '#873c42', '#292d3c'];

  constructor(private readonly stories: StoriesService, private readonly router: Router) {
    if (!localStorage.getItem('token')) this.router.navigate(['/login']);
  }

  chooseType(type: 'text' | 'image' | 'video'): void {
    this.type = type;
    this.errorMessage = '';
    if (type === 'text') this.clearMedia();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    const valid = this.type === 'image'
      ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      : ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type);
    if (!valid) {
      this.errorMessage = this.type === 'image'
        ? 'Choose a JPG, PNG or WebP image.'
        : 'Choose an MP4, MOV or WebM video.';
      input.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.errorMessage = 'Your file must be 50 MB or smaller.';
      input.value = '';
      return;
    }
    this.clearMedia();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  removeMedia(): void { this.clearMedia(); }

  publish(): void {
    this.errorMessage = '';
    if (this.type === 'text' && !this.content.trim()) {
      this.errorMessage = 'Write something for your story first.';
      return;
    }
    if (this.type !== 'text' && !this.selectedFile) {
      this.errorMessage = `Choose a ${this.type} for your story.`;
      return;
    }
    this.submitting = true;
    this.stories.createStory(this.type, this.content, this.selectedFile).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/home'], { state: { refreshStories: true } });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }
        const validation = error.error?.errors;
        this.errorMessage = validation ? Object.values(validation).flat().join(' ') : (error.error?.message || 'Could not publish your story. Try again.');
      }
    });
  }

  ngOnDestroy(): void { this.clearMedia(); }

  private clearMedia(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.selectedFile = null;
  }
}
