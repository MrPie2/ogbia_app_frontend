import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService, UserMemory } from '../services/auth.service';

@Component({
  selector: 'app-memories',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  template: `
    <ion-content [fullscreen]="true">
      <main class="memories-page">
        <a class="memories-back" routerLink="/profile" aria-label="Back to profile"><ion-icon name="arrow-back-outline"></ion-icon></a>
        <header class="memories-header">
          <span class="memories-eyebrow">MY OGBIA</span>
          <h1>My Memories</h1>
          <p>Your photos and videos, kept together in one place.</p>
          <div class="memories-total"><ion-icon name="images-outline"></ion-icon><strong>{{ memories.length }}</strong><span>{{ memories.length === 1 ? 'saved memory' : 'saved memories' }}</span></div>
        </header>

        <div class="memories-loading" *ngIf="loading"><ion-icon name="images-outline"></ion-icon><span>Opening your collection…</span></div>
        <div class="memories-error" *ngIf="!loading && errorMessage" role="alert">
          <ion-icon name="alert-circle-outline"></ion-icon><p>{{ errorMessage }}</p><button type="button" (click)="loadMemories()">Try again</button>
        </div>
        <section class="memories-grid" *ngIf="!loading && !errorMessage && memories.length">
          <article class="memory-tile" *ngFor="let memory of memories">
            <img *ngIf="memory.media_type === 'image'" [src]="memory.url" [alt]="memory.caption || 'Saved memory'" loading="lazy">
            <video *ngIf="memory.media_type === 'video'" [src]="memory.url" controls playsinline preload="metadata"></video>
            <div class="memory-tile-caption">
              <p *ngIf="memory.caption">{{ memory.caption }}</p>
              <small>{{ memory.created_at ? (memory.created_at | date:'mediumDate') : '' }}</small>
            </div>
          </article>
        </section>
        <div class="memories-empty" *ngIf="!loading && !errorMessage && !memories.length">
          <span class="empty-folder"><ion-icon name="images-outline"></ion-icon></span>
          <strong>Your memories start here</strong>
          <p>Photos and videos you upload will be collected here.</p>
          <a routerLink="/profile">Go to profile to add a memory</a>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    :host{--brand:#393185;--ink:#302b4c;--muted:#837d96;display:block}
    .memories-page{min-height:100%;max-width:760px;margin:0 auto;padding:22px 18px calc(100px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#f0edff 0,#fbfaff 260px,#fbfaff 100%);color:var(--ink)}
    .memories-back{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid #e7e2f4;border-radius:13px;background:#fff;color:var(--brand);font-size:20px;text-decoration:none}
    .memories-header{padding:22px 2px 20px}.memories-eyebrow{color:#766bb5;font-size:10px;font-weight:850;letter-spacing:1.8px}
    h1{margin:7px 0;color:#292442;font-size:clamp(27px,6vw,34px);font-weight:850;letter-spacing:-.8px}
    .memories-header>p{margin:0;color:var(--muted);font-size:12px;line-height:1.6}
    .memories-total{display:inline-flex;align-items:center;gap:8px;margin-top:15px;padding:8px 12px;border:1px solid #e9e5f4;border-radius:999px;background:#fff;color:var(--brand);font-size:11px}
    .memories-total ion-icon{font-size:17px}.memories-total strong{font-size:13px}
    .memories-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .memory-tile{min-width:0;overflow:hidden;border:1px solid #e9e5f2;border-radius:16px;background:#fff;box-shadow:0 7px 20px #332b640b}
    .memory-tile>img,.memory-tile>video{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#e8e5f1}
    .memory-tile>video{object-fit:contain}
    .memory-tile-caption{padding:9px 10px 10px}.memory-tile-caption p{margin:0 0 5px;color:#49435e;font-size:11px;line-height:1.4;overflow-wrap:anywhere}
    .memory-tile-caption small{color:#89839a;font-size:9px}
    .memories-loading,.memories-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:45px 18px;text-align:center;color:var(--muted);font-size:12px}
    .memories-loading ion-icon{font-size:30px;color:#7569a8}
    .empty-folder{display:grid;width:68px;height:68px;place-items:center;border-radius:20px;background:#eeebfa;color:var(--brand);font-size:34px}
    .memories-empty strong{color:#49435e;font-size:14px}.memories-empty p{max-width:270px;margin:0;font-size:11px;line-height:1.6}
    .memories-empty a{margin-top:5px;color:var(--brand);font-size:11px;font-weight:800;text-decoration:none}
    .memories-error{display:flex;flex-direction:column;align-items:center;gap:8px;padding:35px 16px;border:1px solid #f2dadd;border-radius:16px;background:#fff7f8;color:#a23e55;text-align:center;font-size:12px}
    .memories-error ion-icon{font-size:25px}.memories-error p{margin:0}.memories-error button{padding:9px 14px;border:0;border-radius:10px;background:var(--brand);color:#fff;font-size:11px;font-weight:750}
    @media(max-width:360px){.memories-grid{gap:8px}.memory-tile{border-radius:12px}}
  `]
})
export class MemoriesPage implements OnInit {
  memories: UserMemory[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly auth: AuthService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadMemories();
  }

  loadMemories(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auth.getMyMemories().subscribe({
      next: response => {
        this.memories = response.data ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Your memories could not be loaded. Please check your connection and try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
