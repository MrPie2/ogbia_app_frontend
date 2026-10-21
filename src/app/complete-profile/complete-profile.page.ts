import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule],
  templateUrl: './complete-profile.page.html',
  styleUrls: ['./complete-profile.page.scss'],
})
export class CompleteProfilePage {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  submitting = false;
  errorMessage = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {
    const user = this.auth.getCachedUser();
    if (user?.name && user.name !== 'Ogbia Member') this.fullName = user.name;
    if (user?.email) this.email = user.email;
  }

  completeProfile(): void {
    this.errorMessage = '';
    if (this.submitting) return;
    if (this.fullName.trim().length < 2) {
      this.errorMessage = 'Enter your full name to continue.';
      return;
    }
    if (!this.email.trim()) {
      this.errorMessage = 'Enter your email address.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'Choose a password with at least 8 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Your passwords do not match.';
      return;
    }

    this.submitting = true;
    this.auth.completeProfile(this.fullName, this.email, this.password, this.confirmPassword).subscribe({
      next: async () => {
        this.submitting = false;
        await this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        const errors = error.error?.errors as Record<string, string[]> | undefined;
        this.errorMessage = errors?.['name']?.[0] || errors?.['email']?.[0] ||
          errors?.['password']?.[0] || error.error?.message ||
          'We could not save your profile. Check your details and try again.';
      },
    });
  }
}
