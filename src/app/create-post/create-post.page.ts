import { Component } from '@angular/core'; 
import { IonContent, IonIcon } from '@ionic/angular'; 
import { RouterLink } from '@angular/router';
@Component({selector:'app-create-post',
    standalone:true,imports:[IonContent,IonIcon,RouterLink],
    templateUrl:'./create-post.page.html',
    styleUrl:'./create-post.page.scss'}) 
    
    export class CreatePostPage {}
