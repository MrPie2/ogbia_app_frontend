import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';

@Component({
    selector:'app-profile',
    standalone:true,
    imports:[IonContent,IonIcon,RouterLink,CommonModule,FormsModule],
    templateUrl:'./profile.page.html',
    styleUrl:'./profile.page.scss'}) 
export class ProfilePage {}
