import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { KnowledgeBaseService, KnowledgeCommunity, KnowledgeWard, KnowledgeRepresentative, KnowledgeTraditionalInstitution } from '../services/knowledge-base.service';

type DirectoryTab = 'senatorial' | 'federal' | 'state' | 'wards' | 'communities';
type PoliticalTab = 'senators' | 'house_reps' | 'assembly' | 'councilors' | 'community_leaders';

@Component({ selector: 'app-constituency', standalone: true, imports: [CommonModule, IonContent, IonIcon, RouterLink], templateUrl: './constituency.page.html', styleUrl: './constituency.page.scss' })
export class ConstituencyPage implements OnInit {
  searchTerm = '';
  selectedCommunity: KnowledgeCommunity | null = null;
  activeTab: DirectoryTab = 'senatorial';
  selectedSenatorialDistrict: string | null = null;
  selectedFederalConstituency: string | null = null;
  selectedStateConstituency: string | null = null;
  selectedWard: KnowledgeWard | null = null;
  readonly defaultSenatorialDistrict = 'Bayelsa East Senatorial District';
  readonly defaultFederalConstituency = 'Ogbia Federal Constituency';
  readonly stateConstituencies = ['Ogbia I', 'Ogbia II', 'Ogbia III'];
  communities: KnowledgeCommunity[] = [];
  wards: KnowledgeWard[] = [];
  loading = false; detailLoading = false; errorMessage = ''; detailError = '';
  politicalTab: PoliticalTab = 'senators';
  politicalRepresentatives: KnowledgeRepresentative[] = [];
  pastPoliticalRepresentatives: KnowledgeRepresentative[] = [];
  pastRepresentativeCount = 0;
  showingPastRepresentatives = false;
  pastRepresentativesLoading = false;
  pastRepresentativesError = '';
  traditionalInstitutions: KnowledgeTraditionalInstitution[] = [];
  traditionalInstitutionsLoading = false;
  traditionalInstitutionsError = '';
  politicalLoading = false; politicalError = '';
  private politicalScope: Record<string, string | number> = {};

  constructor(private readonly knowledgeBase: KnowledgeBaseService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {}
  ngOnInit(): void { this.loadCommunities(); this.loadWards(); this.loadPoliticalRepresentatives(); this.loadTraditionalInstitutions(); }

  get filteredCommunities(): KnowledgeCommunity[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return term ? this.communities.filter(item => item.name.toLocaleLowerCase().includes(term)) : this.communities;
  }
  private uniqueValues(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.map(v => (v || '').trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  }
  get senatorialDistricts(): string[] {
    const values = this.uniqueValues([...this.communities.map(c=>c.senatorial_district), ...this.wards.map(w=>w.senatorial_district)]);
    return values.length ? values : [this.defaultSenatorialDistrict];
  }
  get federalConstituencies(): string[] {
    const values = this.uniqueValues([...this.communities.map(c=>c.federal_constituency), ...this.wards.map(w=>w.federal_constituency)]);
    return values.length ? values : [this.defaultFederalConstituency];
  }
  get stateConstituencyNames(): string[] {
    const values = this.uniqueValues([...this.communities.map(c=>c.state_constituency), ...this.wards.map(w=>w.state_constituency)]);
    return values.length ? values : this.stateConstituencies;
  }

  loadCommunities(): void {
    this.loading=true; this.errorMessage=''; this.changeDetector.markForCheck();
    this.knowledgeBase.getCommunities().subscribe({
      next:r=>{this.communities=r.data??[];this.loading=false;this.changeDetector.markForCheck();},
      error:(e:HttpErrorResponse)=>{this.loading=false;this.errorMessage=e.status===0?'Could not connect to the knowledge base. Check your internet connection and try again.':'The community directory could not be loaded. Please try again later.';this.changeDetector.markForCheck();}
    });
  }
  loadWards(): void {
    this.knowledgeBase.getWards().subscribe({next:r=>{this.wards=r.data??[];this.changeDetector.markForCheck();},error:()=>{this.wards=[];this.changeDetector.markForCheck();}});
  }
  selectTab(tab: DirectoryTab): void {
    this.activeTab=tab; this.selectedCommunity=null; this.selectedSenatorialDistrict=null; this.selectedFederalConstituency=null; this.selectedStateConstituency=null; this.selectedWard=null;
    const map:Record<DirectoryTab,PoliticalTab>={senatorial:'senators',federal:'house_reps',state:'assembly',wards:'councilors',communities:'community_leaders'};
    this.setPoliticalTab(map[tab]);
  }
  selectSenatorialDistrict(name:string):void { this.selectedSenatorialDistrict=name;this.selectedFederalConstituency=null;this.setPoliticalTab('senators',{senatorial_district:name}); }
  clearSenatorialDistrict():void { this.selectedSenatorialDistrict=null;this.setPoliticalTab('senators'); }
  selectFederalConstituency(name:string):void { this.activeTab='federal'; this.selectedFederalConstituency=name;this.selectedStateConstituency=null;this.setPoliticalTab('house_reps',{federal_constituency:name}); }
  clearFederalConstituency():void { this.selectedFederalConstituency=null;this.setPoliticalTab('house_reps'); }
  selectStateConstituency(name:string):void { this.activeTab='state'; this.selectedStateConstituency=name;this.selectedWard=null;this.setPoliticalTab('assembly',{state_constituency:name}); }
  clearStateConstituency():void { this.selectedStateConstituency=null;this.setPoliticalTab('assembly'); }
  selectWard(ward:KnowledgeWard):void { this.activeTab='wards'; this.selectedWard=ward;this.setPoliticalTab('councilors',{ward_id:ward.id}); }
  clearWard():void { this.selectedWard=null;this.setPoliticalTab('councilors'); }
  selectPoliticalTab(tab:PoliticalTab):void { this.setPoliticalTab(tab); }
  private setPoliticalTab(tab:PoliticalTab,scope:Record<string,string|number>={}):void {
    this.politicalTab=tab;
    this.politicalScope=scope;
    this.pastPoliticalRepresentatives=[];
    this.pastRepresentativeCount=0;
    this.showingPastRepresentatives=false;
    this.pastRepresentativesLoading=false;
    this.pastRepresentativesError='';
    this.loadPoliticalRepresentatives();
  }
  loadPoliticalRepresentatives():void {
    this.politicalLoading=true;this.politicalError='';this.changeDetector.markForCheck();
    this.knowledgeBase.getPoliticalRepresentatives(this.politicalTab,this.politicalScope).subscribe({
      next:r=>{this.politicalRepresentatives=r.data??[];this.pastRepresentativeCount=r.past_count??0;this.politicalLoading=false;this.changeDetector.markForCheck();},
      error:()=>{this.politicalRepresentatives=[];this.politicalLoading=false;this.politicalError='Political representatives could not be loaded. Please try again.';this.changeDetector.markForCheck();}
    });
  }

  togglePastRepresentatives():void {
    if (this.showingPastRepresentatives) {
      this.showingPastRepresentatives=false;
      return;
    }
    if (this.pastPoliticalRepresentatives.length) {
      this.showingPastRepresentatives=true;
      return;
    }
    this.pastRepresentativesLoading=true;
    this.knowledgeBase.getPoliticalRepresentatives(this.politicalTab,this.politicalScope,true).subscribe({
      next:r=>{this.pastPoliticalRepresentatives=r.data??[];this.pastRepresentativesLoading=false;this.showingPastRepresentatives=true;this.changeDetector.markForCheck();},
      error:()=>{this.pastRepresentativesLoading=false;this.pastRepresentativesError='Past representatives could not be loaded. Please try again.';this.changeDetector.markForCheck();}
    });
  }
  get pastRepresentativeLinkLabel():string {
    const labels:Record<PoliticalTab,string>={
      senators:'See past Senators',
      house_reps:'See past House of Representatives members',
      assembly:'See past House of Assembly members',
      councilors:'See past Councillors',
      community_leaders:'See past community leaders'
    };
    return labels[this.politicalTab];
  }
  servicePeriod(person:KnowledgeRepresentative):string {
    const start=person.term_start?new Date(person.term_start).toLocaleDateString(undefined,{year:'numeric',month:'short'}):'Start date not recorded';
    const end=person.term_end?new Date(person.term_end).toLocaleDateString(undefined,{year:'numeric',month:'short'}):'Present';
    return start+' – '+end;
  }
  loadTraditionalInstitutions():void {
    this.traditionalInstitutionsLoading=true;
    this.traditionalInstitutionsError='';
    this.knowledgeBase.getTraditionalInstitutions().subscribe({
      next:r=>{this.traditionalInstitutions=r.data??[];this.traditionalInstitutionsLoading=false;this.changeDetector.markForCheck();},
      error:()=>{this.traditionalInstitutions=[];this.traditionalInstitutionsLoading=false;this.traditionalInstitutionsError='Traditional institutions could not be loaded. Please try again.';this.changeDetector.markForCheck();}
    });
  }
  private norm(v:string|null|undefined):string{return (v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  getConstituencyCommunities(name:string):KnowledgeCommunity[]{const n=this.norm(name).replace(/state constituency|constituency/g,'').trim();return this.communities.filter(c=>this.norm(c.state_constituency).replace(/state constituency|constituency/g,'').trim()===n);}
  getFederalCommunities(name:string):KnowledgeCommunity[]{return this.communities.filter(c=>this.norm(c.federal_constituency)===this.norm(name));}
  getDistrictCommunities(name:string):KnowledgeCommunity[]{return this.communities.filter(c=>this.norm(c.senatorial_district)===this.norm(name));}
  getDistrictFederalConstituencies(name:string):string[]{const values=this.uniqueValues([...this.communities.filter(c=>this.norm(c.senatorial_district)===this.norm(name)).map(c=>c.federal_constituency),...this.wards.filter(w=>this.norm(w.senatorial_district)===this.norm(name)).map(w=>w.federal_constituency)]);return values.length?values:this.federalConstituencies;}
  getFederalStateConstituencies(name:string):string[]{const values=this.uniqueValues([...this.communities.filter(c=>this.norm(c.federal_constituency)===this.norm(name)).map(c=>c.state_constituency),...this.wards.filter(w=>this.norm(w.federal_constituency)===this.norm(name)).map(w=>w.state_constituency)]);return values.length?values:this.stateConstituencyNames;}
  getStateWards(name:string):KnowledgeWard[]{return this.wards.filter(w=>this.norm(w.state_constituency)===this.norm(name)||(w.communities||[]).some(c=>this.norm(c.state_constituency)===this.norm(name)));}
  getWardCommunities(ward:KnowledgeWard):KnowledgeCommunity[]{const ids=new Set((ward.communities||[]).map(c=>c.id));return this.communities.filter(c=>ids.has(c.id));}
  representativeLocation(p:KnowledgeRepresentative):string{return [p.senatorial_district,p.federal_constituency,p.state_constituency,p.constituency,p.ward?.name,p.community?.name].filter((v):v is string=>!!v?.trim()).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')||'Ogbia representation';}
  openCommunity(c:KnowledgeCommunity):void {
    this.setPoliticalTab('community_leaders',{community_id:c.id});
    void this.router.navigate(['/community', c.slug]);
  }
  closeCommunity():void{this.selectedCommunity=null;this.detailError='';this.setPoliticalTab('councilors');}
  roleIcon(role:string):string{const v=role.toLowerCase();if(v.includes('clan')||v.includes('traditional'))return'ribbon-outline';if(v.includes('senate')||v.includes('senator'))return'podium-outline';if(v.includes('assembly'))return'business-outline';if(v.includes('representative')||v.includes('house of reps'))return'people-circle-outline';if(v.includes('ward')||v.includes('councillor')||v.includes('councilor'))return'people-outline';return'home-outline';}
  roleSubtitle(role:string):string{const v=role.toLowerCase();if(v.includes('clan')||v.includes('traditional'))return'Traditional leadership';if(v.includes('senate')||v.includes('senator'))return'Bayelsa East Senatorial District';if(v.includes('assembly'))return'Bayelsa State legislature';if(v.includes('representative')||v.includes('house of reps'))return'Federal constituency';if(v.includes('ward')||v.includes('councillor')||v.includes('councilor'))return'Ward-level representation';return'Community leadership';}
  representativeLabel(p:KnowledgeRepresentative):string{return p.full_name?.trim()||'Representative not yet listed';}
}
