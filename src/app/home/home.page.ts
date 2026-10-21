import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';

@Component({
    selector:'app-home',standalone:true,
    imports:[IonContent,IonIcon,RouterLink],
    templateUrl:'./home.page.html',styleUrl:'./home.page.scss'})
export class HomePage {}
