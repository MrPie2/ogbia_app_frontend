import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  standalone: true,
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  login(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Enter your email and password to continue.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Unable to log in. Please try again.';
      }
    });
  }
}
