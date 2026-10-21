import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular';


@Component({
selector: 'app-root',
templateUrl: 'app.component.html',
styleUrls: ['app.component.scss'],
standalone: true,
imports: [FormsModule, CommonModule, IonRouterOutlet, IonApp],
})

export class AppComponent {
constructor() {}
}