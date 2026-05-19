import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  // Permite acceso solo si el usuario es administrador
  canActivate(): boolean {

    const user = this.auth.user();

    if (user?.is_admin) {
      return true;
    }

    this.toastr.error('No tienes permisos de administrador');
    this.router.navigate(['/']);

    return false;
  }
}