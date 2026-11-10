import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import { ChatConversation, ChatMessage, MessagingService } from '../services/messaging.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
  templateUrl: './messages.page.html',
  styleUrl: './messages.page.scss'
})
export class MessagesPage implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];
  conversationId: number | null = null;
  friend: { id: number; name: string; profile_photo_url?: string | null } | null = null;
  draft = '';
  loading = true;
  sending = false;
  errorMessage = '';
  private readonly subscriptions = new Subscription();
  private activeLoad?: Subscription;

  constructor(
    private readonly messaging: MessagingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }

    this.subscriptions.add(this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.conversationId = Number.isInteger(id) && id > 0 ? id : null;
      this.activeLoad?.unsubscribe();
      if (this.conversationId) {
        this.loadThread();
        this.activeLoad = timer(5000, 5000).subscribe(() => this.loadThread(true));
      } else {
        this.loadList();
        this.activeLoad = timer(12000, 12000).subscribe(() => this.loadList(true));
      }
    }));
  }

  ngOnDestroy(): void {
    this.activeLoad?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  loadList(silent = false): void {
    if (!silent) this.loading = true;
    this.messaging.getConversations().subscribe({
      next: response => {
        this.conversations = response.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => this.handleError(error, 'Could not load your messages.')
    });
  }

  loadThread(silent = false): void {
    if (!this.conversationId) return;
    if (!silent) this.loading = true;
    this.messaging.getConversation(this.conversationId).subscribe({
      next: response => {
        this.friend = response.conversation?.friend || null;
        this.messages = response.messages?.data || [];
        this.loading = false;
        this.messaging.markRead(this.conversationId!).subscribe({ error: () => undefined });
        this.cdr.markForCheck();
      },
      error: error => this.handleError(error, 'Could not load this conversation.')
    });
  }

  onComposerEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const body = this.draft.trim();
    if (!body || !this.conversationId || this.sending) return;
    this.sending = true;
    this.messaging.sendMessage(this.conversationId, body).subscribe({
      next: response => {
        this.messages = [...this.messages, response.data];
        this.draft = '';
        this.sending = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.sending = false;
        this.handleError(error, 'Your message could not be sent. Please try again.');
      }
    });
  }

  goToList(): void {
    this.router.navigate(['/messages']);
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement | null)?.remove();
  }

  openConversation(conversation: ChatConversation): void {
    this.router.navigate(['/messages', conversation.id]);
  }

  initials(name: string | null | undefined): string {
    return (name || 'Ogbia Member').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  private handleError(error: any, fallback: string): void {
    this.loading = false;
    if (error?.status === 401 || error?.status === 419) {
      this.auth.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.errorMessage = error?.error?.message || fallback;
    this.cdr.markForCheck();
  }
}
