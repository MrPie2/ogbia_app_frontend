import { Component } from '@angular/core'; 
import { IonContent, IonIcon } from '@ionic/angular'; 
import { RouterLink } from '@angular/router';
@Component({selector:'app-constituency',
    standalone:true,
    imports:[IonContent,IonIcon,RouterLink],
    templateUrl:'./constituency.page.html',
    styleUrl:'./constituency.page.scss'}) 
    export class ConstituencyPage {}
