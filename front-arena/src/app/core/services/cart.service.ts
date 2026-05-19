import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { forkJoin } from 'rxjs';

export interface Event {
  id: number;
  nombre: string;
  fecha: string;
  hora?: string;
}

export interface Seat {
  id: number;
  fila?: number;
  numero?: number;
  sector: string;
  precio: number;
  reservaId?: number;
}

export interface CartItem {
  event: Event;
  seat: Seat;
}

export interface GroupedCart {
  event: Event;
  seats: Seat[];
}

// Gestiona el carrito de reservas del usuario autenticado.
// Permite añadir, eliminar y confirmar asientos, sincronizando datos con el backend y controlando el tiempo de expiración de las reservas.
@Injectable({
  providedIn: 'root'
})
export class CartService {

  private _items = signal<CartItem[]>([]);
  private _activeEventId = signal<number | null>(null);
  private _checkoutExpiresAt = signal<Date | null>(null);
  private _expired = signal(false);

  private _timer: any = null;
  private _polling: any = null;

  isLoading = signal(false);
  isProcessing = signal(false);
  isPurchasing = signal(false);
  secondsLeft = signal(0);

  items = this._items.asReadonly();
  activeEventId = this._activeEventId.asReadonly();
  checkoutExpiresAt = this._checkoutExpiresAt.asReadonly();
  cartExpired = this._expired.asReadonly();

  hasActiveCart = computed(() => this._items().length > 0);

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.restoreExpiracion();
  }

  private getHeaders() {
    return {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    };
  }

  private toNumber(value: any): number {
    if (!value) return 0;
    return Number(String(value).replace('€', '').replace(',', '.').trim()) || 0;
  }

  // ======================
  // LOAD
  // ======================
  // Carga las reservas del usuario y las convierte en items del carrito
  loadFromBackend() {

    if (!this.auth.getToken()) return;

    this.isLoading.set(true);

    this.http.get<any>('http://localhost/api/reservas', this.getHeaders())
      .subscribe({
        next: (res) => {

          const reservas = res.data ?? [];

          if (!reservas.length) {
            this.reset();
            this.isLoading.set(false);
            return;
          }

          const mapped: CartItem[] = reservas.map((r: any) => ({
            event: r.evento,
            seat: {
              ...r.asiento,
              precio: this.toNumber(r.precio),
              reservaId: r.id
            }
          }));

          this._items.set(mapped);
          this._activeEventId.set(mapped[0]?.event.id ?? null);

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
  }

  // ======================
  // ADD
  // ======================
  // Añade un asiento al carrito y activa el temporizador de expiración si es el primero
  addSeat(event: Event, seat: Seat, expiresAt?: Date) {

    if (this.isLoading() || this.isPurchasing() || this.isProcessing()) return;

    const isFirst = this._items().length === 0;

    this._items.set([...this._items(), { event, seat }]);

    if (isFirst) {
      const exp = expiresAt ?? new Date(Date.now() + 15 * 60 * 1000);
      this._checkoutExpiresAt.set(exp);
      this.saveExpiracion(exp);
      this.startTimer();
    }
  }

  // ======================
  // REMOVE (UX LOCK)
  // ======================
  removeSeatFromBackend(reservaId: number, seatId: number, eventId: number) {

    if (this.isProcessing() || this.isPurchasing()) return;

    this.isProcessing.set(true);

    this.http.delete(
      `http://localhost/api/reservas/${reservaId}`,
      this.getHeaders()
    ).subscribe({
      next: () => {
        this.removeSeat(seatId, eventId);
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isProcessing.set(false);
      }
    });
  }

  removeSeat(seatId: number, eventId: number) {
    this._items.set(
      this._items().filter(i =>
        !(i.seat.id === seatId && i.event.id === eventId)
      )
    );

    if (!this._items().length) this.reset();
  }

  // ======================
  // CLEAR (UX LOCK)
  // ======================
  clearFromBackend() {

    if (this.isProcessing() || this.isPurchasing()) return;

    this.isProcessing.set(true);

    const items = this._items().filter(i => i.seat?.reservaId);

    if (!items.length) {
      this.reset();
      this.isProcessing.set(false);
      return;
    }

    forkJoin(
      items.map(i =>
        this.http.delete(
          `http://localhost/api/reservas/${i.seat.reservaId}`,
          this.getHeaders()
        )
      )
    ).subscribe({
      next: () => {
        this.reset();
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isProcessing.set(false);
      }
    });
  }

  // ======================
  // CLEAR AND RESET (para logout)
  // ======================
  // Limpia carrito y estado de reserva
  clearFromBackendAndReset(): Promise<void> {
    return new Promise((resolve, reject) => {

      const items = this._items().filter(i => i.seat?.reservaId);

      if (!items.length) {
        this.reset();
        resolve();
        return;
      }

      forkJoin(
        items.map(i =>
          this.http.delete(
            `http://localhost/api/reservas/${i.seat.reservaId}`,
            this.getHeaders()
          )
        )
      ).subscribe({
        next: () => {
          this.reset();
          resolve();
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  // ======================
  // RESET
  // ======================
  reset() {
    this._items.set([]);
    this._activeEventId.set(null);
    this._checkoutExpiresAt.set(null);
    this.secondsLeft.set(0);

    this.stopTimer();
    this.saveExpiracion(null);
  }

  // ======================
  // TOTAL
  // ======================
  getTotal(): number {
    return this._items().reduce((s, i) => s + i.seat.precio, 0);
  }

  groupedByEvent(): GroupedCart[] {
    const g: Record<number, GroupedCart> = {};

    this._items().forEach(i => {
      if (!g[i.event.id]) {
        g[i.event.id] = { event: i.event, seats: [] };
      }
      g[i.event.id].seats.push(i.seat);
    });

    return Object.values(g);
  }

  // ======================
  // TIMER
  // ======================
  // Controla la cuenta atrás de la reserva (15 minutos) y vacía el carrito si expira
  private startTimer() {

    this.stopTimer();

    this._timer = setInterval(() => {

      const exp = this._checkoutExpiresAt();
      if (!exp) return;

      const diff = Math.floor((exp.getTime() - Date.now()) / 1000);

      this.secondsLeft.set(Math.max(0, diff));

      if (diff <= 0) this.onExpired();

    }, 1000);
  }

  private stopTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  private onExpired() {
    if (this.isPurchasing()) return;

    this.reset();

    this._expired.set(true);
    setTimeout(() => this._expired.set(false), 4000);
  }

  private saveExpiracion(date: Date | null) {
    if (date) localStorage.setItem('cart_expires_at', date.toISOString());
    else localStorage.removeItem('cart_expires_at');
  }

  private restoreExpiracion() {

    const saved = localStorage.getItem('cart_expires_at');
    if (!saved) return;

    const date = new Date(saved);
    if (isNaN(date.getTime())) return;

    if (date.getTime() <= Date.now()) return;

    this._checkoutExpiresAt.set(date);
    this.startTimer();
  }
}