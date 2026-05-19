import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';

// // Encargado de registrar un usuario nuevo, validar datos en frontend y crear sesión tras el registro
@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, RouterLink],
  templateUrl: './register.html'
})
export class Register {

  nombre = signal('');
  apellido = signal('');
  email = signal('');
  password = signal('');
  password2 = signal('');

  loading = signal(false);

  // Lista de errores (devueltos por backend) para mostrar en HTML
  errors = signal<string[]>([]);

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  register() {

    this.errors.set([]);

    // Validación FRONT UX
    if (
      !this.nombre().trim() ||
      !this.email().trim() ||
      !this.password().trim() ||
      !this.password2().trim()
    ) {
      this.toastr.warning('Rellena todos los campos');
      return;
    }

    if (this.password() !== this.password2()) {
      this.errors.set(['Las contraseñas no coinciden']);
      this.toastr.error('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);

    this.http.post('http://localhost/api/register', {
      nombre: this.nombre(),
      apellido: this.apellido(),
      email: this.email(),
      password: this.password(),
      password_confirmation: this.password2()
    }).subscribe({

      // OK: registro + login
      next: (res: any) => {

        this.auth.setSession(res.user, res.token);
        this.cart.loadFromBackend();

        this.toastr.success('Cuenta creada correctamente');

        this.router.navigate(['/eventos']);
      },

      error: (err) => {

        const backendErrors = err?.error?.errors;

        if (backendErrors) {
          const list = Object.values(backendErrors)
            .flat()
            .map((e: any) => String(e));

          this.errors.set(list);
        } else {
          this.errors.set(['Error al registrarse']);
        }

        this.toastr.error('No se pudo crear la cuenta');

        this.loading.set(false);
      },

      complete: () => {
        this.loading.set(false);
      }
    });
  }
}