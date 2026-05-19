import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule,  QRCodeComponent],
  templateUrl: './profile.html'
})
export class Profile implements OnInit {

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  user = signal<any>(null);
  loading = signal(true);

  entradasProximas = signal<any[]>([]);
  entradasPasadas = signal<any[]>([]);

  editing = signal(false);
  changingPassword = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);
  errors = signal<string[]>([]);

  form = {
    nombre: '',
    apellido: '',
    email: ''
  };

  passwordForm = {
    password_actual: '',
    password: '',
    password_confirmation: ''
  };

  ngOnInit() {

    this.auth.me().subscribe({
      next: (res: any) => {
        const user = res.data ?? res;
        this.user.set(user);
        this.loadEntradas();
      },
      error: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  loadEntradas() {

    const token = this.auth.getToken();

    this.http.get<any>('http://localhost/api/entradas', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.filtrarEntradas(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // =========================
  // EDIT PROFILE
  // =========================

  startEdit() {

    const u = this.user();

    this.form = {
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email
    };

    this.errors.set([]);
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
    this.errors.set([]);
  }

  private validateProfile(): string[] {

    const errors: string[] = [];

    if (!this.form.nombre.trim()) errors.push('El nombre es obligatorio');
    if (!this.form.apellido.trim()) errors.push('El apellido es obligatorio');

    if (!this.form.email.trim()) {
      errors.push('El email es obligatorio');
    } else if (!this.form.email.includes('@')) {
      errors.push('El email no es válido');
    }

    return errors;
  }

 saveProfile() {

  this.errors.set([]);

  const validationErrors = this.validateProfile();

  if (validationErrors.length > 0) {
    this.errors.set(validationErrors);
    this.toastr.warning('Revisa los campos del perfil');
    return;
  }

  this.savingProfile.set(true);

  const token = this.auth.getToken();

  this.http.put(
    'http://localhost/api/perfil',
    this.form,
    { headers: { Authorization: `Bearer ${token}` } }
  ).subscribe({

    next: (res: any) => {

      this.user.set(res.data);
      this.editing.set(false);

      this.toastr.success('Perfil actualizado correctamente');
    },

    error: (err) => {

      const msg =
        err?.error?.message ||
        'Error al actualizar perfil';

      this.toastr.error(msg);
    },

    complete: () => {
      this.savingProfile.set(false);
      this.savingPassword.set(false);
    }
  });
}

  // =========================
  // PASSWORD
  // =========================

  private validatePassword(): string[] {

    const errors: string[] = [];

    if (!this.passwordForm.password_actual.trim()) {
      errors.push('La contraseña actual es obligatoria');
    }

    if (!this.passwordForm.password.trim()) {
      errors.push('La nueva contraseña es obligatoria');
    } else if (this.passwordForm.password.length < 8) {
      errors.push('La nueva contraseña debe tener al menos 8 caracteres');
    }

    if (this.passwordForm.password !== this.passwordForm.password_confirmation) {
      errors.push('Las contraseñas no coinciden');
    }

    return errors;
  }

  changePassword() {

  this.errors.set([]);

  const validationErrors = this.validatePassword();

  if (validationErrors.length > 0) {
    this.errors.set(validationErrors);
    return;
  }

  this.savingPassword.set(true);

  const token = this.auth.getToken();

  this.http.put(
    'http://localhost/api/perfil/password',
    this.passwordForm,
    { headers: { Authorization: `Bearer ${token}` } }
  ).subscribe({

    next: () => {

      this.passwordForm = {
        password_actual: '',
        password: '',
        password_confirmation: ''
      };

      this.changingPassword.set(false);

      this.toastr.success('Contraseña actualizada correctamente');
    },

    error: (err) => {

      const msg =
        err?.error?.error ||
        err?.error?.message ||
        'Error al cambiar contraseña';

      this.toastr.error(msg);
    },

    complete: () => {
      this.savingPassword.set(false);
    }
  });
}

  // =========================
  // UTILIDADES
  // =========================

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES');
  }

  formatHora(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private filtrarEntradas(entradas: any[]) {

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximas: any[] = [];
    const pasadas: any[] = [];

    for (const e of entradas) {

      const fechaEvento = new Date(e.hora);

      const entrada = {
        ...e,
        asientoTexto: e.asiento?.sector
          ? `Sector ${e.asiento.sector} - Fila ${e.asiento.fila} - Asiento ${e.asiento.numero}`
          : e.asiento
      };

      if (fechaEvento >= hoy) proximas.push(entrada);
      else pasadas.push(entrada);
    }

    this.entradasProximas.set(proximas);
    this.entradasPasadas.set(pasadas);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}