import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-shell">
      <div class="login-left">
        <div class="brand-lockup">
          <span class="brand-hex">⬡</span>
          <span class="brand-wordmark">MedDash</span>
        </div>
        <div class="hero-copy">
          <h1 class="hero-headline">Clinical intelligence,<br><em>at your fingertips.</em></h1>
          <p class="hero-sub">AI-assisted screening for diabetes, heart disease, cancer, and more — designed for modern clinical workflows.</p>
        </div>
        <div class="trust-pills">
          <span class="trust-pill"><span class="pill-dot green"></span>HIPAA-aware architecture</span>
          <span class="trust-pill"><span class="pill-dot blue"></span>Model confidence scoring</span>
          <span class="trust-pill"><span class="pill-dot purple"></span>Preliminary screening only</span>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h2 class="card-title">{{ isSignup ? 'Create account' : 'Sign in' }}</h2>
            <p class="card-sub">{{ isSignup ? 'Choose a username and password to get started.' : 'Welcome back. Enter your credentials to continue.' }}</p>
          </div>

          <div class="login-form">
            <div class="field-group">
              <label class="field-label" for="username">Username</label>
              <div class="input-wrap" [class.focused]="userFocused" [class.error]="usernameError()">
                <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <input id="username" type="text" class="field-input" [(ngModel)]="username" name="username"
                  placeholder="your_username" autocomplete="username"
                  (focus)="userFocused = true" (blur)="userFocused = false; validateUsername()" />
              </div>
              @if (usernameError()) {
                <p class="field-error">{{ isSignup ? 'Username must be 5–25 characters.' : 'Username is required.' }}</p>
              }
            </div>

            <div class="field-group">
              <label class="field-label" for="password">Password</label>
              <div class="input-wrap" [class.focused]="pwFocused" [class.error]="pwError()">
                <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="9" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M6.5 9V6a3.5 3.5 0 017 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="10" cy="13.5" r="1" fill="currentColor"/>
                </svg>
                <input id="password" [type]="showPassword ? 'text' : 'password'" class="field-input"
                  [(ngModel)]="password" name="password" placeholder="••••••••••••" autocomplete="current-password"
                  (focus)="pwFocused = true" (blur)="pwFocused = false; validatePassword()" />
                <button type="button" class="show-pw-btn" (click)="showPassword = !showPassword">
                  @if (!showPassword) {
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path d="M3 3l14 14M8.5 8.7A2.5 2.5 0 0011.3 11.5M5.3 5.5C3.7 6.7 2.6 8.3 2 10c1.3 3.6 4.6 6 8 6a9.3 9.3 0 004.7-1.3M9 4.1A9 9 0 0118 10c-.4 1.1-1 2.2-1.8 3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  }
                </button>
              </div>
              @if (pwError()) {
                <p class="field-error">{{ isSignup ? 'Password must be 6–64 characters.' : 'Password is required.' }}</p>
              }
            </div>

            @if (serverError()) {
              <div class="alert-error">
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 6v4M10 13h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                {{ serverError() }}
              </div>
            }

            @if (successMsg()) {
              <div class="alert-success">
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ successMsg() }}
              </div>
            }

            <button type="button" class="submit-btn" [class.loading]="isLoading()" (click)="onSubmit()">
              @if (isLoading()) {
                <span class="btn-spinner"></span>
                <span>{{ isSignup ? 'Creating account…' : 'Signing in…' }}</span>
              } @else {
                {{ isSignup ? 'Create account' : 'Sign in' }}
              }
            </button>

            <p class="register-prompt">
              {{ isSignup ? 'Already have an account?' : "Don't have an account?" }}
              <button type="button" class="register-link" (click)="toggleMode()">
                {{ isSignup ? 'Sign in' : 'Sign up' }}
              </button>
            </p>
          </div>
        </div>

        <p class="legal-note">
          For clinical screening and research purposes only. Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      font-family: 'DM Sans', sans-serif;
    }

    .login-left {
      background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #0c2461 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2.5rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(37,99,235,0.25) 0%, transparent 70%),
          radial-gradient(ellipse 40% 60% at 10% 80%, rgba(99,102,241,0.2) 0%, transparent 70%);
        pointer-events: none;
      }

      &::after {
        content: '⬡';
        position: absolute;
        right: -4rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 28rem;
        opacity: 0.03;
        line-height: 1;
        pointer-events: none;
        color: #fff;
      }
    }

    .brand-lockup { display: flex; align-items: center; gap: 0.6rem; color: #fff; z-index: 1; }
    .brand-hex { font-size: 1.5rem; color: #60a5fa; }
    .brand-wordmark { font-family: 'DM Mono', monospace; font-size: 1.1rem; font-weight: 500; letter-spacing: 0.05em; }
    .hero-copy { z-index: 1; }
    .hero-headline { font-size: 2.6rem; font-weight: 600; color: #fff; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 1rem; em { font-style: normal; color: #93c5fd; } }
    .hero-sub { font-size: 1rem; color: #94a3b8; line-height: 1.65; max-width: 360px; }
    .trust-pills { display: flex; flex-direction: column; gap: 0.5rem; z-index: 1; }
    .trust-pill { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 0.35rem 0.85rem; font-size: 0.8rem; color: #cbd5e1; width: fit-content; }
    .pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; &.green { background: #34d399; } &.blue { background: #60a5fa; } &.purple { background: #a78bfa; } }

    .login-right { background: var(--bg-base, #f4f6f9); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; gap: 1.25rem; }

    .login-card { background: var(--surface-1, #fff); border: 1px solid var(--border, #e2e8f0); border-radius: var(--radius-lg, 14px); box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 2.25rem 2rem; width: 100%; max-width: 400px; }
    .card-header { margin-bottom: 1.75rem; }
    .card-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary, #0f172a); margin-bottom: 0.35rem; letter-spacing: -0.02em; }
    .card-sub { font-size: 0.875rem; color: var(--text-muted, #64748b); }

    .login-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary, #334155); letter-spacing: 0.02em; text-transform: uppercase; }

    .input-wrap { display: flex; align-items: center; background: var(--surface-2, #f8f9fb); border: 1.5px solid var(--border, #e2e8f0); border-radius: var(--radius-sm, 6px); transition: border-color 0.15s, box-shadow 0.15s; overflow: hidden;
      &.focused { border-color: var(--accent, #2563eb); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      &.error { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    }
    .input-icon { flex-shrink: 0; width: 16px; height: 16px; color: var(--text-muted, #64748b); margin-left: 0.75rem; }
    .field-input { flex: 1; border: none; background: transparent; padding: 0.65rem 0.75rem; font-size: 0.9rem; color: var(--text-primary, #0f172a); outline: none; min-width: 0; &::placeholder { color: var(--text-placeholder, #94a3b8); } }
    .show-pw-btn { background: none; border: none; padding: 0 0.75rem; cursor: pointer; color: var(--text-muted, #64748b); display: flex; align-items: center; height: 100%; transition: color 0.15s; &:hover { color: var(--text-secondary, #334155); } }
    .field-error { font-size: 0.77rem; color: #ef4444; margin-top: 0.1rem; }

    .alert-error { display: flex; align-items: center; gap: 0.5rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-sm, 6px); padding: 0.6rem 0.85rem; font-size: 0.83rem; color: #dc2626; }
    .alert-success { display: flex; align-items: center; gap: 0.5rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm, 6px); padding: 0.6rem 0.85rem; font-size: 0.83rem; color: #16a34a; }

    .submit-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: var(--accent, #2563eb); color: #fff; border: none; border-radius: var(--radius-md, 10px); font-size: 0.925rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, transform 0.1s; margin-top: 0.25rem;
      &:hover { background: var(--accent-dark, #1d4ed8); }
      &:active { transform: scale(0.985); }
      &.loading { opacity: 0.8; cursor: not-allowed; }
    }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .register-prompt { text-align: center; font-size: 0.83rem; color: var(--text-muted, #64748b); margin-top: 0.25rem; }
    .register-link { background: none; border: none; padding: 0; cursor: pointer; color: var(--accent, #2563eb); font-size: 0.83rem; font-weight: 500; font-family: inherit; &:hover { text-decoration: underline; } }
    .legal-note { font-size: 0.73rem; color: var(--text-placeholder, #94a3b8); text-align: center; max-width: 340px; line-height: 1.5; }

    @media (max-width: 720px) {
      .login-shell { grid-template-columns: 1fr; }
      .login-left { display: none; }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  userFocused = false;
  pwFocused = false;
  isSignup = false;

  usernameError = signal(false);
  pwError = signal(false);
  serverError = signal('');
  successMsg = signal('');
  isLoading = signal(false);

  constructor(private router: Router, private auth: AuthService) {}

  toggleMode(): void {
    this.isSignup = !this.isSignup;
    this.usernameError.set(false);
    this.pwError.set(false);
    this.serverError.set('');
    this.successMsg.set('');
  }

  validateUsername(): void {
    this.usernameError.set(
      this.isSignup
        ? this.username.length > 0 && (this.username.length < 5 || this.username.length > 25)
        : this.username.length === 0
    );
  }

  validatePassword(): void {
    this.pwError.set(
      this.isSignup
        ? this.password.length > 0 && (this.password.length < 6 || this.password.length > 64)
        : this.password.length === 0
    );
  }

  async onSubmit(): Promise<void> {
    this.validateUsername();
    this.validatePassword();
    if (this.usernameError() || this.pwError() || !this.username || !this.password) return;

    this.isLoading.set(true);
    this.serverError.set('');
    this.successMsg.set('');

    try {
      if (this.isSignup) {
        await this.auth.register(this.username, this.password);
        this.successMsg.set('Account created! Signing you in…');
        await this.auth.login(this.username, this.password);
      } else {
        await this.auth.login(this.username, this.password);
      }
      this.router.navigate(['/profile']);
    } catch (err: any) {
      this.serverError.set(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
