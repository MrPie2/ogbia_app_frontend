import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import {
  Subject, debounceTime, distinctUntilChanged, filter, takeUntil,
  switchMap, forkJoin, of, catchError, finalize, timer, merge
} from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { PostsService, CommunityPost } from '../../services/posts.service';
import { FriendsService, FriendUser } from '../../services/friends.service';
import { MessagingService } from '../../services/messaging.service';

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
  unreadMessagesCount = 0;
  private readonly conversationUnreadCounts: Record<number, number> = {};
  private readonly locallyReadConversations = new Set<number>();

  private readonly destroy$ = new Subject<void>();
  private readonly searchTerms$ = new Subject<string>();

  constructor(
    private readonly router: Router,
    public readonly notifications: NotificationService,
    private readonly postsService: PostsService,
    private readonly friendsService: FriendsService,
    private readonly messaging: MessagingService
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

    this.messaging.conversationOpened$.pipe(takeUntil(this.destroy$)).subscribe(conversationId => {
      this.locallyReadConversations.add(conversationId);
      this.conversationUnreadCounts[conversationId] = 0;
      this.recalculateUnreadMessages();
    });

    this.messaging.conversationOpened$.pipe(takeUntil(this.destroy$)).subscribe(conversationId => {
      this.locallyReadConversations.add(conversationId);
      this.conversationUnreadCounts[conversationId] = 0;
      this.recalculateUnreadMessages();
    });

    merge(
      timer(0, 15000),
      this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    ).pipe(
      switchMap(() => this.messaging.getConversations().pipe(catchError(() => of({ data: [] })))),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      (response.data || []).forEach(conversation => {
        const count = Math.max(0, Number(conversation.unread_count) || 0);
        if (count === 0) this.locallyReadConversations.delete(conversation.id);
        this.conversationUnreadCounts[conversation.id] = this.locallyReadConversations.has(conversation.id) ? 0 : count;
      });
      this.recalculateUnreadMessages();
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

  private recalculateUnreadMessages(): void {
    this.unreadMessagesCount = Object.values(this.conversationUnreadCounts).reduce((total, count) => total + count, 0);
  }

  private recalculateUnreadMessages(): void {
    this.unreadMessagesCount = Object.values(this.conversationUnreadCounts).reduce((total, count) => total + count, 0);
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
      .split(/\s+/)
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

  openPostResult(post: CommunityPost): void {
    this.closeSearch();
    this.router.navigate(['/home'], { queryParams: { post: post.id } });
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
