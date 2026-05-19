import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  // Protege rutas que requieren login, redirige a login si no hay token
  canActivate(route: ActivatedRouteSnapshot): boolean {

    const token = this.auth.getToken();

    if (token) return true;

    // Mensaje según la ruta
    const path = route.routeConfig?.path;

    let message = 'Inicia sesión para continuar';

    if (path === 'cart') {
      message = 'Inicia sesión para acceder al carrito';
    }

    if (path === 'perfil') {
      message = 'Inicia sesión para ver tu perfil';
    }

    this.toastr.warning(message);
    this.router.navigate(['/login']);

    return false;
  }
}