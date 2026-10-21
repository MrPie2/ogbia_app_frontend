import { Component } from '@angular/core'; 
import { IonContent, IonIcon } from '@ionic/angular'; 
import { RouterLink } from '@angular/router';

@Component({selector:'app-cdc',
standalone:true,
imports:[IonContent,IonIcon,RouterLink],
templateUrl:'./cdc.page.html',
styleUrl:'./cdc.page.scss'}) 
export class CdcPage {}
