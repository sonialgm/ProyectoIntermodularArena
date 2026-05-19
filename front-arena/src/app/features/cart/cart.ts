import { Component, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { CartService, GroupedCart } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html'
})
export class Cart implements OnInit {

  cart = inject(CartService);

  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toastr = inject(ToastrService);

  showExpiredToast = false;
  showConfirmPurchase = false;
  showConfirmClear = false;

  constructor() {

    // Observa cambios en el estado de expiración del carrito y muestra un aviso temporal cuando las reservas expiran
    effect(() => {

      if (this.cart.cartExpired()) {

        this.showExpiredToast = true;

        setTimeout(() => {
          this.showExpiredToast = false;
        }, 5000);
      }
    });
  }

  // Comprueba si el usuario está autenticado antes de acceder al carrito
  // Si no hay usuario, redirige a login
  ngOnInit() {

    console.log('TOKEN:', this.auth.getToken());
    console.log('USER:', this.auth.user());

    if (!this.auth.user()) {

      this.toastr.info(
        'Debes iniciar sesión para acceder al carrito'
      );

      this.router.navigate(['/login']);
    }
  }

  groupedItems(): GroupedCart[] {
    return this.cart.groupedByEvent();
  }

  total(): number {
    return this.cart.getTotal();
  }

  timerFormatted(): string {

    const s = this.cart.secondsLeft();

    const m = Math.floor(s / 60);
    const sec = s % 60;

    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  timerUrgente(): boolean {
    return this.cart.secondsLeft() <= 60;
  }

  nombreAsiento(seat: any): string {

    return seat.fila != null
      ? `🎫 Fila ${seat.fila} · Asiento ${seat.numero}`
      : `🎫 Asiento ${seat.numero}`;
  }

  remove(eid: number, sid: number, rid: number) {
    this.cart.removeSeatFromBackend(rid, sid, eid);
  }

  clear() {
    this.cart.clearFromBackend();
  }

  openConfirm() {
    this.showConfirmPurchase = true;
  }

  closeConfirm() {
    this.showConfirmPurchase = false;
  }

  confirmBuy() {
    this.showConfirmPurchase = false;
    this.comprar();
  }

  // Confirma la compra enviando las reservas al backend
  // El backend convierte las reservas en entradas definitivas
  comprar() {

    const reservas = this.cart.items()
      .map(i => i.seat.reservaId)
      .filter(Boolean);

    const token = this.auth.getToken();

    if (!reservas.length || !token) return;

    this.cart.isPurchasing.set(true);

    this.http.post<any>(
      'http://localhost/api/compras',
      { reservas },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({

      next: (res) => {

        this.cart.isPurchasing.set(false);

        this.toastr.success(
          'Compra realizada',
          'OK'
        );

        this.router.navigate(['/tickets'], {
          state: { entradas: res.data }
        });

        this.cart.reset();
      },

      error: () => {

        this.cart.isPurchasing.set(false);

        this.toastr.error('Error en compra');
      }
    });
  }

  openConfirmClear() {
    this.showConfirmClear = true;
  }

  closeConfirmClear() {
    this.showConfirmClear = false;
  }

  confirmClear() {
    this.showConfirmClear = false;
    this.clear();
  }
}