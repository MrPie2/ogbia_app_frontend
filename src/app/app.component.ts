import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular';
import { PresenceService } from './services/presence.service';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, IonRouterOutlet, IonApp, NavbarComponent],
})
export class AppComponent {
  constructor(private readonly presence: PresenceService) {
    this.presence.start();
  }
}
