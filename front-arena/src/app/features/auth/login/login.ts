import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';

// Gestiona la autenticación del usuario.
// Permite iniciar sesión, valida credenciales y guarda la sesión (token + usuario)
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {

  email = signal('');
  password = signal('');

  loading = signal(false);

  auth = inject(AuthService);
  router = inject(Router);
  cart = inject(CartService);
  toastr = inject(ToastrService);

  // =========================
  // Enviar formulario login
  // =========================
  submit() {

    // Validación frontend (solo UX)
    if (!this.email().trim() || !this.password().trim()) {
      this.toastr.warning('El email y la contraseña son obligatorios');
      return;
    }

    this.loading.set(true);

    this.auth.login({
      email: this.email(),
      password: this.password()
    }).subscribe({

      next: (res: any) => {

        // Guardar sesión
        this.auth.setSession(res.user, res.token);

        this.toastr.success('Bienvenido/a');

        this.cart.loadFromBackend();

        // Redirigir
        this.router.navigate(['/eventos']);

        this.loading.set(false);
      },

      error: (err) => {

        const mensaje =
          err?.error?.message ||
          'Credenciales incorrectas';

        this.toastr.error(mensaje);

        this.loading.set(false); 
      }
    });
  }
}