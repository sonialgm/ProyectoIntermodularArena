import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent {

  cart = inject(CartService);
  router = inject(Router);
  auth = inject(AuthService);
  theme = inject(ThemeService);

  showLogoutConfirm = signal(false);
  isLoggingOut = signal(false);

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  user = this.auth.user;

  timerFormatted(): string {
    const s = this.cart.secondsLeft();
    if (s <= 0) return '00:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  timerUrgente(): boolean {
    return this.cart.secondsLeft() <= 60 && this.cart.secondsLeft() > 0;
  }

  logout() {
    if (this.cart.hasActiveCart()) {
      this.showLogoutConfirm.set(true);
    } else {
      this.doLogout();
    }
  }

  cancelLogout() {
    this.showLogoutConfirm.set(false);
  }

  async confirmLogout() {
    this.isLoggingOut.set(true);
    try {
      await this.cart.clearFromBackendAndReset();
    } catch {
      // Si falla la API igualmente hacemos logout
    } finally {
      this.isLoggingOut.set(false);
      this.showLogoutConfirm.set(false);
      this.doLogout();
    }
  }

  private doLogout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  isLightMode(): boolean {
    return document.body.classList.contains('light');
  }

  constructor() {
    console.log('NAVBAR USER:', this.auth.user());
  }
}