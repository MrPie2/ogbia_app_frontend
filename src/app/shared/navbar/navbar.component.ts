import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import {
  Subject, debounceTime, distinctUntilChanged, filter, takeUntil,
  switchMap, forkJoin, of, catchError, finalize
} from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { PostsService, CommunityPost } from '../../services/posts.service';
import { FriendsService, FriendUser } from '../../services/friends.service';

@Component({
  selector: 'app-shared-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IonIcon],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnDestroy {
  menuOpen = false;
  searchOpen = false;
  searchQuery = '';
  searchTab: 'all' | 'posts' | 'people' = 'all';
  searching = false;
  searchError = '';
  searchPosts: CommunityPost[] = [];
  searchUsers: FriendUser[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly searchTerms$ = new Subject<string>();

  constructor(
    private readonly router: Router,
    public readonly notifications: NotificationService,
    private readonly postsService: PostsService,
    private readonly friendsService: FriendsService
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeMenu();
        this.closeSearch();
      });

    this.searchTerms$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 2) {
            this.searchPosts = [];
            this.searchUsers = [];
            this.searchError = '';
            this.searching = false;
            return of(null);
          }

          this.searching = true;
          this.searchError = '';
          return forkJoin({
            posts: this.postsService.getPosts(1, term).pipe(catchError(() => of(null))),
            users: this.friendsService.findUsers(term).pipe(catchError(() => of(null)))
          }).pipe(finalize(() => { this.searching = false; }));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        if (!results) return;
        this.searchPosts = results.posts?.data ?? [];
        this.searchUsers = results.users?.data ?? [];
        if (!results.posts && !results.users) {
          this.searchError = 'Search is temporarily unavailable. Please try again.';
        }
      });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openSearch(): void {
    this.menuOpen = false;
    this.searchOpen = true;
    this.searchQuery = '';
    this.searchTab = 'all';
    this.searchPosts = [];
    this.searchUsers = [];
    this.searchError = '';
    this.searchTerms$.next('');
  }

  closeSearch(): void {
    this.searchOpen = false;
    this.searchQuery = '';
    this.searchPosts = [];
    this.searchUsers = [];
    this.searchError = '';
    this.searchTerms$.next('');
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.searchTerms$.next(this.searchQuery.trim());
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchTerms$.next('');
  }

  setSearchTab(tab: 'all' | 'posts' | 'people'): void {
    this.searchTab = tab;
  }

  searchInitials(name: string | null | undefined): string {
    return (name || 'Ogbia member')
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  openMemberResult(user: FriendUser): void {
    this.closeSearch();
    this.router.navigate(['/members', user.id]);
  }

  refreshNotifications(): void {
    this.notifications.refreshUnreadCount();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.searchOpen) this.closeSearch();
    else this.closeMenu();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
