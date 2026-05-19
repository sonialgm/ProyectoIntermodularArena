import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar';
import { CartService } from './core/services/cart.service';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { FooterComponent } from './shared/footer/footer';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

  protected readonly title = signal('front-arena');

  private cart = inject(CartService);
  private auth = inject(AuthService);
  private theme = inject(ThemeService);

  // Inicialización de la app
  ngOnInit() {
    // Comproba si existe token guardado 
    const token = this.auth.getToken();

    this.theme.initTheme();

    if (token) {
      this.auth.me().subscribe({
        next: (res: any) => {

          console.log('ME RESPONSE:', res);

          const user =
            res.user?.data ??
            res.user ??
            res.data ??
            res;

          this.auth.user.set(user);
        
          this.cart.loadFromBackend();
        },
        error: () => {
          this.auth.logout();
        }
      });
    }
  }
}