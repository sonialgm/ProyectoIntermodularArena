import { Component, inject, signal, OnInit, OnDestroy, effect, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { EventService } from '../../../core/services/event.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ArenaMap } from '../components/arena-map/arena-map';
import { ToastrService } from 'ngx-toastr';

/**
 * Componente de detalle de evento.
 * Muestra información completa del evento seleccionado y permite la selección de asientos.
 */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ArenaMap],
  templateUrl: './event-detail.html',
})
export class EventDetail implements OnInit, OnDestroy {

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(EventService);
  cart            = inject(CartService);
  private auth    = inject(AuthService);
  private toastr  = inject(ToastrService);

  // Referencia al componente del mapa para llamar métodos directamente
  arenaMap = viewChild(ArenaMap);

  evento              = signal<any>(null);
  sectores            = signal<any[]>([]);
  selectedSector      = signal<any | null>(null);
  asientosPorFila     = signal<Record<string, any[]>>({});
  filasOrdenadas      = signal<any[]>([]);
  selectedSeats       = signal<any[]>([]);
  adding              = signal(false);
  showActiveCartToast = signal(false);
  showConfirmAdd      = signal(false);
  loading             = signal(true);

  private interval: any = null;
  private currentSector: any = null;
  private isFirstLoad = false;

  constructor() {
    effect(() => {
      if (this.cart.cartExpired()) {
        this.selectedSeats.set([]);
        this.toastr.warning('Los asientos han sido liberados', 'Tu reserva ha expirado');
      }
    });
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      const evento = await this.service.getEventoById(id);
      if (!evento) return;

      this.evento.set(evento);

      const sectores = (evento.precios ?? []).map((p: any) => ({
        id: p.sector.id,
        nombre: p.sector.nombre,
        precio: Number(String(p.precio).replace(',', '.').replace('€', '').trim()),
        disponible: p.disponible
      }));

      this.sectores.set(sectores);

    } finally {
      this.loading.set(false);
    }
  }

  selectedSeatIds(): number[] {
    return this.selectedSeats().map(s => s.id);
  }

  totalSeleccion(): number {
    return this.selectedSeats().reduce((sum, seat) => sum + (seat._precio ?? 0), 0);
  }

  // =========================
  // SECTOR
  // =========================
  async onSelectSector(sector: any) {
    if (!sector?.disponible) return;

    this.selectedSector.set(sector);
    this.currentSector = sector;
    this.isFirstLoad = true;

    await this.loadSeats();

    this.arenaMap()?.loadingSeats.set(false);
    this.isFirstLoad = false;

    this.startPolling();
  }

  // =========================
  // LOAD SEATS
  // =========================
  private async loadSeats() {
    if (!this.currentSector) return;

    const eventoId = Number(this.route.snapshot.paramMap.get('id'));
    const res = await this.service.getAsientosBySector(eventoId, this.currentSector.id);
    const data = res.asientos ?? [];

    const grouped: Record<string, any[]> = {};
    const filas: any[] = [];

    for (const seat of data) {
      const fila = seat.fila;
      if (!grouped[fila]) {
        grouped[fila] = [];
        filas.push(fila);
      }
      grouped[fila].push({
        ...seat,
        estado: seat.estado ?? (seat.disponible ? 'libre' : 'bloqueado')
      });
    }

    this.asientosPorFila.set(grouped);
    this.filasOrdenadas.set(filas);
  }

  // =========================
  // POLLING
  // =========================
  private startPolling() {
    this.stopPolling();
    this.interval = setInterval(async () => {
      await this.loadSeats();
    }, 5000);
  }

  private stopPolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // =========================
  // SELECCIÓN ASIENTO
  // =========================
  selectSeat(seat: any) {
    if (!seat) return;

    if (this.cart.hasActiveCart()) {
      this.showActiveCartToast.set(true);
      return;
    }

    if (seat.estado === 'vendido' || seat.estado === 'bloqueado') return;

    const current = this.selectedSeats();
    const exists = current.find(s => s.id === seat.id);

    if (exists) {
      this.selectedSeats.set(current.filter(s => s.id !== seat.id));
      return;
    }

    if (current.length >= 6) {
      this.toastr.warning('Máximo 6 entradas por evento', 'Límite alcanzado');
      return;
    }

    this.selectedSeats.set([
      ...current,
      {
        ...seat,
        _precio:   this.selectedSector()?.precio ?? 0,
        _sector:   this.selectedSector()?.nombre ?? '',
        _sectorId: this.selectedSector()?.id
      }
    ]);
  }

  removeSeatFromMap(seat: any) {
    this.selectedSeats.set(this.selectedSeats().filter(s => s.id !== seat.id));
  }

  dismissActiveCartToast() { this.showActiveCartToast.set(false); }

  goToCart() {
    this.showActiveCartToast.set(false);
    this.router.navigate(['/cart']);
  }

  handleAddToCart() {
    const token = this.auth.getToken();
    if (!token || !this.auth.user()) {
      this.toastr.info('Debes iniciar sesión para añadir entradas al carrito', 'Acceso requerido');
      return;
    }
    this.openConfirmAdd();
  }

  openConfirmAdd()  { this.showConfirmAdd.set(true); }
  closeConfirmAdd() { this.showConfirmAdd.set(false); }

  confirmAddToCart() {
    this.showConfirmAdd.set(false);
    this.addToCart();
  }

  async addToCart() {
    const seats  = this.selectedSeats();
    const evento = this.evento();
    const token  = this.auth.getToken();

    if (!token || !this.auth.user()) {
      this.toastr.info('Debes iniciar sesión', 'Acceso requerido');
      return;
    }

    if (!seats.length || !evento) return;
    if (this.adding()) return;

    if (this.cart.hasActiveCart()) {
      this.showActiveCartToast.set(true);
      return;
    }

    this.adding.set(true);

    try {
      for (const seat of seats) {
        const res = await fetch('http://localhost/api/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ evento_id: evento.id, asiento_id: seat.id })
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('❌ Backend rechazó la reserva:', data);
          this.toastr.error(data.error ?? 'Error al reservar', 'Error');
          continue;
        }

        const reservaId = data?.data?.id;
        const expiresAt = data?.data?.reservado_hasta
          ? new Date(String(data.data.reservado_hasta).replace(' ', 'T'))
          : undefined;

        this.cart.addSeat(
          evento,
          { id: seat.id, fila: seat.fila, numero: seat.numero, sector: seat._sector, precio: Number(seat._precio), reservaId },
          expiresAt
        );
      }

      await this.loadSeats();
      this.selectedSeats.set([]);

    } finally {
      this.adding.set(false);
    }
  }

  timerFormatted(): string {
    const s = this.cart.secondsLeft();
    if (s <= 0) return '00:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  getPoster(evento: any): string {
    try {
      const url = new URL(evento.poster);

      let text = url.searchParams.get('text');

      if (!text) return 'assets/posters/default.jpg';

      const fileName = decodeURIComponent(text)
        .toLowerCase()
        .replaceAll('+', ' ')
        .replaceAll(' ', '-');

      return `posters/${fileName}.jpg`;

    } catch {
      return 'assets/posters/default.jpg';
    }
  }

  ngOnDestroy() { this.stopPolling(); }
}