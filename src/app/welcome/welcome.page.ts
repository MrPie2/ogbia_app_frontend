import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss'
})
export class WelcomePage {
  constructor(private readonly auth: AuthService, private readonly router: Router) {
    if (localStorage.getItem('token')) {
      const user = this.auth.getCachedUser();
      const destination = user?.name && user.name !== 'Ogbia Member' && user.email ? '/home' : '/complete-profile';
      void this.router.navigateByUrl(destination, { replaceUrl: true });
    }
  }
}
