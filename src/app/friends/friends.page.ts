import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { Subscription, debounceTime, distinctUntilChanged, Subject, timeout } from 'rxjs';
import { FriendUser, FriendsService } from '../services/friends.service';
import { AuthService } from '../services/auth.service';
import { PresenceService } from '../services/presence.service';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
  templateUrl: './friends.page.html',
  styleUrl: './friends.page.scss'
})
export class FriendsPage implements OnInit, OnDestroy {
  friends: FriendUser[] = [];
  candidates: FriendUser[] = [];
  incomingRequests: Array<{ request_id: number; id: number; name: string; email: string }> = [];
  loadingFriends = true;
  loadingUsers = false;
  findMode = false;
  search = '';
  errorMessage = '';
  successMessage = '';
  private readonly searchInput = new Subject<string>();
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly friendsService: FriendsService,
    private readonly auth: AuthService,
    private readonly presence: PresenceService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }

    this.presence.heartbeat();
    this.loadFriends();
    this.loadRequests();
    this.subscriptions.add(
      this.searchInput.pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(value => this.loadCandidates(value))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get onlineFriends(): FriendUser[] {
    return this.friends.filter(friend => friend.is_online);
  }

  loadFriends(): void {
    this.loadingFriends = true;
    this.friendsService.getFriends().pipe(timeout(15000)).subscribe({
      next: response => {
        this.friends = response.data || [];
        this.loadingFriends = false;
      },
      error: error => {
        this.loadingFriends = false;
        this.handleError(error, error?.name === 'TimeoutError'
          ? 'The friends request timed out. Check the API server/network and retry.'
          : 'Could not load your friends. Please try again.');
      }
    });
  }

  loadRequests(): void {
    this.friendsService.getRequests().pipe(timeout(15000)).subscribe({
      next: response => this.incomingRequests = response.incoming || [],
      error: () => { this.errorMessage = 'Friend requests could not be loaded. Check the API server/network.'; }
    });
  }

  openFindFriends(): void {
    this.findMode = true;
    this.search = '';
    this.loadCandidates('');
  }

  closeFindFriends(): void {
    this.findMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSearchChange(value: string): void {
    this.searchInput.next(value);
  }

  private loadCandidates(search: string): void {
    this.loadingUsers = true;
    this.friendsService.findUsers(search).pipe(timeout(15000)).subscribe({
      next: response => {
        this.candidates = response.data || [];
        this.loadingUsers = false;
      },
      error: error => {
        this.loadingUsers = false;
        this.handleError(error, error?.name === 'TimeoutError'
          ? 'Finding friends timed out. Check the API server/network and retry.'
          : 'Could not find users right now.');
      }
    });
  }

  sendRequest(user: FriendUser): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.friendsService.sendRequest(user.id).subscribe({
      next: response => {
        user.friendship_status = 'pending';
        user.request_sent_by_me = true;
        this.successMessage = response.message || 'Friend request sent.';
      },
      error: error => {
        if (error.status === 409) {
          user.friendship_status = error.error?.friendship_status || 'pending';
          user.request_sent_by_me = true;
          this.errorMessage = error.error?.message || 'A request already exists.';
          return;
        }
        this.handleError(error, 'Unable to send friend request.');
      }
    });
  }

  acceptRequest(request: { request_id: number; id: number; name: string; email: string }): void {
    this.friendsService.acceptRequest(request.request_id).subscribe({
      next: response => {
        this.incomingRequests = this.incomingRequests.filter(item => item.request_id !== request.request_id);
        this.successMessage = response.message || 'Friend request accepted.';
        this.loadFriends();
        this.loadCandidates(this.search);
      },
      error: error => this.handleError(error, 'Unable to accept friend request.')
    });
  }

  relationshipLabel(user: FriendUser): string {
    if (user.friendship_status === 'accepted') return 'Friends';
    if (user.friendship_status === 'pending') return user.request_sent_by_me ? 'Request sent' : 'Respond to request';
    return 'Add friend';
  }

  handleCandidateAction(user: FriendUser): void {
    if (user.friendship_status === 'pending' && !user.request_sent_by_me) {
      const request = this.incomingRequests.find(item => item.id === user.id);
      if (request) this.acceptRequest(request);
      else this.loadRequests();
      return;
    }
    if (!user.friendship_status) this.sendRequest(user);
  }

  private handleError(error: any, fallback: string): void {
    if (error?.status === 401 || error?.status === 419) {
      this.auth.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.errorMessage = error?.error?.message || fallback;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.presence.stop();
    this.router.navigate(['/login']);
  }
}
