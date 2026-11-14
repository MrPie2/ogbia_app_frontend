import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import {
  AuthService, FamilyMatchCandidate, FamilyTreeEdge,
  FamilyTreePerson, FamilyTreeResponse
} from '../services/auth.service';

type RelationshipType =
  | 'father' | 'mother' | 'child' | 'brother' | 'sister' | 'sibling'
  | 'grandfather' | 'grandmother' | 'grandparent' | 'grandson'
  | 'granddaughter' | 'grandchild' | 'uncle' | 'aunt' | 'nephew'
  | 'niece' | 'cousin' | 'spouse' | 'partner';

@Component({
  selector: 'app-family-tree',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, CommonModule, FormsModule],
  templateUrl: './family-tree.page.html',
  styleUrl: './family-tree.page.scss',
})
export class FamilyTreePage implements OnInit {
  loading = true;
  error = '';
  rootId: number | null = null;
  people: FamilyTreePerson[] = [];
  relationships: FamilyTreeEdge[] = [];
  selectedPerson: FamilyTreePerson | null = null;

  addOpen = false;
  saving = false;
  searching = false;
  formError = '';
  relationship: RelationshipType = 'grandfather';
  name = '';
  dateOfBirth = '';
  gender = '';
  hometown = '';
  privacy: 'private' | 'family' | 'public' = 'family';
  matches: FamilyMatchCandidate[] = [];
  selectedMatch: FamilyMatchCandidate | null = null;

  readonly relationshipOptions: { value: RelationshipType; label: string }[] = [
    { value: 'father', label: 'Father' }, { value: 'mother', label: 'Mother' },
    { value: 'child', label: 'Child' }, { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' }, { value: 'sibling', label: 'Sibling' },
    { value: 'grandfather', label: 'Grandfather' }, { value: 'grandmother', label: 'Grandmother' },
    { value: 'grandparent', label: 'Grandparent' }, { value: 'grandson', label: 'Grandson' },
    { value: 'granddaughter', label: 'Granddaughter' }, { value: 'grandchild', label: 'Grandchild' },
    { value: 'uncle', label: 'Uncle' }, { value: 'aunt', label: 'Aunt' },
    { value: 'nephew', label: 'Nephew' }, { value: 'niece', label: 'Niece' },
    { value: 'cousin', label: 'Cousin' }, { value: 'spouse', label: 'Spouse' },
    { value: 'partner', label: 'Partner' },
  ];

  constructor(private readonly auth: AuthService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadTree(); }

  loadTree(): void {
    this.loading = true;
    this.error = '';
    this.auth.getFamilyTree().subscribe({
      next: (response: FamilyTreeResponse) => {
        this.rootId = response.data.root_id;
        this.people = response.data.people || [];
        this.relationships = response.data.relationships || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.error = error?.error?.message || 'Your family tree could not be loaded.';
        this.cdr.markForCheck();
      },
    });
  }

  get relatives(): FamilyTreePerson[] {
    return this.people.filter(person => person.id !== this.rootId);
  }

  relationshipLabel(personId: number): string {
    const edge = this.relationships.find(item =>
      (item.person_id === this.rootId && item.related_person_id === personId)
      || (item.related_person_id === this.rootId && item.person_id === personId)
    );
    if (!edge) return 'Extended family';
    return this.titleCase(edge.person_id === this.rootId ? edge.relationship : edge.viewer_relationship);
  }

  titleCase(value: string): string {
    return (value || 'relative').replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }

  initials(name: string | null | undefined): string {
    return (name || 'Family member').trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(part => part[0]).join('').toUpperCase();
  }

  openAdd(): void {
    this.formError = '';
    this.addOpen = true;
  }

  closeAdd(): void {
    this.addOpen = false;
    this.matches = [];
    this.selectedMatch = null;
  }

  searchMatches(): void {
    if (this.name.trim().length < 2) {
      this.formError = 'Enter the full name before searching.';
      return;
    }
    this.searching = true;
    this.formError = '';
    this.matches = [];
    this.selectedMatch = null;
    this.auth.searchFamilyMatches({
      name: this.name.trim(),
      ...(this.dateOfBirth ? { date_of_birth: this.dateOfBirth } : {}),
      ...(this.gender ? { gender: this.gender } : {}),
      ...(this.hometown.trim() ? { hometown: this.hometown.trim() } : {}),
    }).subscribe({
      next: response => {
        this.matches = response.data || [];
        this.searching = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.searching = false;
        this.formError = error?.error?.message || 'Could not search possible matches.';
        this.cdr.markForCheck();
      },
    });
  }

  chooseMatch(match: FamilyMatchCandidate): void {
    this.selectedMatch = this.selectedMatch?.match_reference === match.match_reference ? null : match;
  }

  saveRelationship(): void {
    if (!this.selectedMatch && this.name.trim().length < 2) {
      this.formError = 'Enter a name or select a possible match.';
      return;
    }

    this.saving = true;
    this.formError = '';
    this.auth.addFamilyRelationship({
      relationship: this.relationship,
      ...(!this.selectedMatch ? {
        name: this.name.trim(),
        ...(this.dateOfBirth ? { date_of_birth: this.dateOfBirth } : {}),
        ...(this.gender ? { gender: this.gender } : {}),
        ...(this.hometown.trim() ? { hometown: this.hometown.trim() } : {}),
        privacy: this.privacy,
      } : { match_reference: this.selectedMatch.match_reference }),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.closeAdd();
        this.loadTree();
        this.cdr.markForCheck();
      },
      error: error => {
        this.saving = false;
        this.formError = error?.error?.errors?.match_reference?.[0]
          || error?.error?.errors?.relationship?.[0]
          || error?.error?.message
          || 'Could not add this family relationship.';
        this.cdr.markForCheck();
      },
    });
  }

  openPerson(person: FamilyTreePerson): void {
    this.selectedPerson = person;
    this.auth.getFamilyTreePerson(person.id).subscribe({
      next: response => {
        this.selectedPerson = response.data;
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  closePerson(): void { this.selectedPerson = null; }
}
