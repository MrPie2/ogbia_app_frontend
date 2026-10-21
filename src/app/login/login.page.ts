import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
    imports: [IonContent, IonIcon, CommonModule, FormsModule],
  standalone: true,
})
export class LoginPage {

  constructor(private http: HttpClient,private router: Router) {}
 email: string = '';
  password: string = '';
  loading = false;
  errorMessage = '';
  private apiUrl = 'https://api.parcellsend.com/api';


  login() {
    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${this.apiUrl}/login`, {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);

        this.loading = false;

        this.router.navigate(['/home']);
      },

      error: (error) => {
        this.loading = false;

        this.errorMessage =
          error.error?.message || 'Unable to log in. Please try again.';
      }
    });
  }
}
