import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const BASE_URL = `http://${window.location.hostname}:8001`;
const USER_KEY  = 'md_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router) {}

  get username(): string | null { return localStorage.getItem(USER_KEY); }
  get isLoggedIn(): boolean { return !!localStorage.getItem(USER_KEY); }

  async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Invalid credentials');
    }
    const data = await res.json();
    localStorage.setItem(USER_KEY, data.username);
  }

  async register(username: string, password: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Registration failed');
    }
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }
}
