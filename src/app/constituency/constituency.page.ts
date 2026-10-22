import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';

interface Community {
  name: string;
  note?: string;
}

interface OfficialRole {
  title: string;
  subtitle: string;
  icon: string;
}

@Component({
  selector: 'app-constituency',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './constituency.page.html',
  styleUrl: './constituency.page.scss'
})
export class ConstituencyPage {
  searchTerm = '';
  selectedCommunity: Community | null = null;
  activeTab: 'communities' | 'wards' = 'communities';

  // Initial directory compiled from public town/community listings.
  // Ward-to-community assignments and office holders should be confirmed
  // against official records before being marked as verified.
  readonly communities: Community[] = [
    { name: 'Abobiri' }, { name: 'Abulabiri' }, { name: 'Agbura' },
    { name: 'Agudama' }, { name: 'Akalabagi' }, { name: 'Akipelai' },
    { name: 'Akolomani' }, { name: 'Alagbafama' }, { name: 'Amadugama' },
    { name: 'Amakalakala' }, { name: 'Amerokeni' }, { name: 'Anyama' },
    { name: 'Awiakalakala' }, { name: 'Ayakoro' }, { name: 'Ebelebiri' },
    { name: 'Egbedama' }, { name: 'Egeleama' }, { name: 'Elebele' },
    { name: 'Elogiama' }, { name: 'Emadike' }, { name: 'Emeyal I' },
    { name: 'Emeyal II' }, { name: 'Epebu' }, { name: 'Ewoama' },
    { name: 'Ewoi' }, { name: 'Ibobio' }, { name: 'Idema' },
    { name: 'Imiringi' }, { name: 'Iyalakiri' }, { name: 'Kolo I' },
    { name: 'Kolo II' }, { name: 'Kolo III' }, { name: 'Obeduma' },
    { name: 'Odobio' }, { name: 'Ogbia Town' }, { name: 'Ogbomama' },
    { name: 'Ogireyankiri' }, { name: 'Okiki' }, { name: 'Okodi' },
    { name: 'Okodogu' }, { name: 'Okpiniama' }, { name: 'Ologanga' },
    { name: 'Ologi' }, { name: 'Ologohe' }, { name: 'Oloibiri' },
    { name: 'Onuebum' }, { name: 'Opume' }, { name: 'Oruma' },
    { name: 'Otabagi' }, { name: 'Otakeme' }, { name: 'Otuaba' },
    { name: 'Otuabula I' }, { name: 'Otuabula II' }, { name: 'Otuaka' },
    { name: 'Otuakanagu' }, { name: 'Otuasega' }, { name: 'Otuedu' },
    { name: 'Otuegila' }, { name: 'Otuegwe' }, { name: 'Otuekpein' },
    { name: 'Otuogidi' }, { name: 'Otuogori' }, { name: 'Otuoke' },
    { name: 'Otuokpoti' }, { name: 'Otuobhi' }, { name: 'Otuagbagi' },
    { name: 'Outar' }, { name: 'Sangabama' }, { name: 'Uruama' },
    { name: 'Waribugoama' }, { name: 'Oruema' }, { name: 'Ewoma' }
  ];

  readonly wards = Array.from({ length: 13 }, (_, index) => ({
    number: index + 1,
    name: `Ward ${index + 1}`,
    note: 'Official ward name and community mapping to be confirmed'
  }));

  readonly leadershipRoles: OfficialRole[] = [
    { title: 'Ward Leader / Councillor', subtitle: 'Ward-level representation', icon: 'people-outline' },
    { title: 'Clan Head', subtitle: 'Traditional clan leadership', icon: 'ribbon-outline' },
    { title: 'Community Representative', subtitle: 'Community-level leadership', icon: 'home-outline' },
    { title: 'House of Assembly', subtitle: 'Bayelsa State constituency', icon: 'business-outline' },
    { title: 'House of Representatives', subtitle: 'Federal constituency', icon: 'people-circle-outline' },
    { title: 'Senate', subtitle: 'Bayelsa East Senatorial District', icon: 'podium-outline' }
  ];

  get filteredCommunities(): Community[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    if (!term) return this.communities;
    return this.communities.filter(community => community.name.toLocaleLowerCase().includes(term));
  }

  openCommunity(community: Community): void {
    this.selectedCommunity = community;
  }

  closeCommunity(): void {
    this.selectedCommunity = null;
  }

  selectTab(tab: 'communities' | 'wards'): void {
    this.activeTab = tab;
    this.selectedCommunity = null;
  }
}
