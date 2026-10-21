import { Component } from '@angular/core'; 
import { IonContent, IonIcon } from '@ionic/angular'; 
import { RouterLink } from '@angular/router';
@Component({
    selector:'app-reps',
    standalone:true,imports:[IonContent,IonIcon,RouterLink],
    templateUrl:'./reps.page.html',
    styleUrl:'./reps.page.scss'}) 
    export class RepsPage {}
