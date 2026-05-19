import { Injectable } from '@angular/core';

// Controla el modo oscuro/claro y lo guarda en localStorage
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private key = 'theme';

  initTheme() {
    const theme = localStorage.getItem(this.key);

    if (theme === 'light') {
      document.body.classList.add('light');
    }
  }

  toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem(this.key, isLight ? 'light' : 'dark');
  }

  isLight(): boolean {
    return document.body.classList.contains('light');
  }
}