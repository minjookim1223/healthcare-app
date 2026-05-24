import { Component, ElementRef, ViewChild, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const BASE_URL = `http://${window.location.hostname}:8001`;

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  typing?: boolean;
  agent?: string;
}

const AGENT_LABELS: Record<string, string> = {
  Diagnoser:  'Diagnoser',
  Explainer:  'Explainer',
  Prescriber: 'Prescriber',
};

const AGENT_COLORS: Record<string, string> = {
  Diagnoser:  '#ef4444',
  Explainer:  '#f97316',
  Prescriber: '#22c55e',
};

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="chat-page">
      <div class="chat-header">
        <div class="header-icon">🩺</div>
        <div>
          <h1 class="chat-title">Medical Assistant</h1>
          <p class="chat-sub">For informational purposes only — not a substitute for medical advice.</p>
        </div>
      </div>

      <div class="messages-area" #messagesArea>
        @if (messages().length === 0) {
          <div class="empty-state">
            <p>Ask a health question to get started.</p>
          </div>
        }

        @for (msg of messages(); track msg.id) {
          <div class="msg-row" [class.user-row]="msg.role === 'user'" [class.bot-row]="msg.role === 'bot'">
            <div class="msg-bubble" [class.user-bubble]="msg.role === 'user'" [class.bot-bubble]="msg.role === 'bot'">
              @if (msg.agent) {
                <span class="agent-label" [style.color]="agentColor(msg.agent)">{{ agentLabel(msg.agent) }}</span>
              }
              @if (msg.typing) {
                <span class="typing-dots"><span></span><span></span><span></span></span>
              } @else {
                <p class="msg-text">{{ msg.content }}</p>
              }
              <span class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</span>
            </div>
          </div>
        }
      </div>

      <div class="input-area">
        @if (errorMsg) {
          <p class="error-banner">⚠ {{ errorMsg }}</p>
        }
        <div class="input-wrap" [class.focused]="inputFocused">
          <textarea
            #inputBox
            class="chat-input"
            [(ngModel)]="userInput"
            [disabled]="isTyping()"
            placeholder="Describe your symptoms or ask a health question…"
            rows="1"
            (keydown.enter)="onEnter($any($event))"
            (focus)="inputFocused = true"
            (blur)="inputFocused = false"
            (input)="autoResize()"
          ></textarea>
          <button
            class="send-btn"
            [disabled]="!userInput.trim() || isTyping()"
            (click)="sendMessage()"
            aria-label="Send"
          >
            @if (isTyping()) {
              <span class="send-spinner"></span>
            } @else {
              <svg viewBox="0 0 20 20" fill="none" width="17" height="17">
                <path d="M3 10l14-7-5 7 5 7-14-7z" fill="currentColor"/>
              </svg>
            }
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .chat-page {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 57px);
      font-family: 'DM Sans', sans-serif;
      background: var(--bg-base);
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1.5rem;
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .header-icon { font-size: 1.5rem; }

    .chat-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .chat-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
    }

    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty-state {
      margin: auto;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .msg-row {
      display: flex;
      max-width: 72%;
      animation: fadeUp 0.18s ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .user-row { align-self: flex-end; }
    .bot-row  { align-self: flex-start; }

    .msg-bubble {
      padding: 0.6rem 0.875rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .user-bubble {
      background: var(--accent);
      border-radius: 12px 12px 2px 12px;
    }

    .bot-bubble {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 2px 12px 12px 12px;
    }

    .agent-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .msg-text {
      font-size: 0.875rem;
      line-height: 1.55;
      margin: 0;
      white-space: pre-wrap;
    }

    .user-bubble .msg-text { color: #fff; }
    .bot-bubble  .msg-text { color: var(--text-secondary); }

    .msg-time {
      font-size: 0.67rem;
      opacity: 0.5;
      align-self: flex-end;
      font-family: 'DM Mono', monospace;
    }

    .typing-dots {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 2px;

      span {
        width: 6px;
        height: 6px;
        background: var(--text-muted);
        border-radius: 50%;
        animation: bounce 1.1s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.15s; }
        &:nth-child(3) { animation-delay: 0.3s; }
      }
    }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    .input-area {
      padding: 0.85rem 1.5rem 1rem;
      border-top: 1px solid var(--border);
      background: var(--surface-1);
      flex-shrink: 0;
    }

    .error-banner {
      font-size: 0.78rem;
      color: #ef4444;
      margin: 0 0 0.5rem;
    }

    .input-wrap {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      background: var(--surface-2);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.5rem 0.5rem 0.85rem;
      transition: border-color 0.15s, box-shadow 0.15s;

      &.focused {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
      }
    }

    .chat-input {
      flex: 1;
      border: none;
      background: transparent;
      resize: none;
      font-size: 0.9rem;
      color: var(--text-primary);
      outline: none;
      line-height: 1.55;
      max-height: 120px;
      overflow-y: auto;
      font-family: inherit;

      &::placeholder { color: var(--text-placeholder); }
      &:disabled { opacity: 0.5; }
    }

    .send-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: none;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s, opacity 0.15s;

      &:hover:not(:disabled) { background: var(--accent-dark); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .send-spinner {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesArea') messagesArea!: ElementRef<HTMLDivElement>;
  @ViewChild('inputBox') inputBox!: ElementRef<HTMLTextAreaElement>;

  messages = signal<ChatMessage[]>([]);
  isTyping = signal(false);
  userInput = '';
  inputFocused = false;
  errorMsg = '';
  private nextId = 1;
  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      const el = this.messagesArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  agentLabel(agent: string): string { return AGENT_LABELS[agent] ?? agent; }
  agentColor(agent: string): string { return AGENT_COLORS[agent] ?? 'var(--text-muted)'; }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  autoResize(): void {
    const el = this.inputBox?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isTyping()) return;

    this.errorMsg = '';
    this.pushMessage({ role: 'user', content: text });
    this.userInput = '';
    setTimeout(() => {
      const el = this.inputBox?.nativeElement;
      if (el) el.style.height = 'auto';
    });

    this.isTyping.set(true);

    // Backend now expects POST with JSON body { input_task: string }
    fetch(`${BASE_URL}/medical_chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_task: text }),
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) { this.isTyping.set(false); return; }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const parsed = JSON.parse(trimmed);
                const msg = parsed?.messages;
                if (!msg) continue;

                const agent: string = msg.agent ?? '';
                if (agent === 'user') continue;
                const content: string = (msg.content ?? '').replace(/\s*TERMINATE\s*$/, '').trim();
                if (!content) continue;

                this.pushMessage({ role: 'bot', content, agent });
              } catch { /* partial line */ }
            }

            this.shouldScroll = true;
            return pump();
          });

        return pump();
      })
      .catch(() => {
        this.isTyping.set(false);
        this.errorMsg = 'Could not reach the backend. Please check your connection.';
      });
  }

  private pushMessage(partial: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    const id = this.nextId++;
    this.messages.update(msgs => [...msgs, { ...partial, id, timestamp: new Date() }]);
    this.shouldScroll = true;
  }
}
