import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
    imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],

  standalone: true,
})
export class SignupPage  {
  phoneNumber: string = '';
  referralId: string = '';

  register() {
    if (!this.phoneNumber) {
      alert('Please enter your phone number');
      return;
    }

    const registrationData = {
      phone: this.phoneNumber,
      referral_id: this.referralId
    };

    console.log(registrationData);

    // API request will be added here later
  }
}
