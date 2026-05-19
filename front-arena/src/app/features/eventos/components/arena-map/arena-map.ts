import { Component, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatGrid } from '../seat-grid/seat-grid';

const CX = 430, CY = 385;
const SX = 1.32, SY = 1.0;

const RINGS = {
  o300: 340, i300: 290,
  oPal: 270, iPal: 235,
  o100: 220, i100: 175,
};

const GAP_DEG = 0.4;

interface SectorLayout {
  id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
  shortName: string;
  path: string;
  labelX: number;
  labelY: number;
  labelRotate: number;
}

@Component({
  selector: 'app-arena-map',
  standalone: true,
  imports: [CommonModule, SeatGrid],
  templateUrl: './arena-map.html',
  styleUrl: './arena-map.css',
})
export class ArenaMap implements OnChanges {

  sectores        = input<any[]>([]);
  asientosPorFila = input<Record<string, any[]>>({});
  filasOrdenadas  = input<any[]>([]);
  selectedSeats   = input<any[]>([]);
  selectedSeatIds = input<number[]>([]);
  loadingInitial  = input<boolean>(false);

  sectorSelected = output<any>();
  seatSelected   = output<any>();
  seatRemoved    = output<any>();

  selectedSector = signal<any | null>(null);

  // Estado interno de loading — solo true en primera carga del sector
  loadingSeats = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    // Sincronizar loadingSeats con el input loadingInitial
    // Solo cuando cambia y el panel está abierto
    if (changes['loadingInitial'] && this.selectedSector()) {
      this.loadingSeats.set(this.loadingInitial());
    }
  }

  private ox(r: number, a: number): number { return CX + r * SX * Math.cos(a); }
  private oy(r: number, a: number): number { return CY + r * SY * Math.sin(a); }
  private toRad(d: number): number { return d * Math.PI / 180; }

  private arcPath(ir: number, or_: number, a1deg: number, a2deg: number): string {
    const a1 = this.toRad(a1deg + GAP_DEG / 2);
    const a2 = this.toRad(a2deg - GAP_DEG / 2);
    const lg = (a2deg - a1deg) > 180 ? 1 : 0;

    const xi1 = this.ox(ir, a1), yi1 = this.oy(ir, a1);
    const xo1 = this.ox(or_, a1), yo1 = this.oy(or_, a1);
    const xo2 = this.ox(or_, a2), yo2 = this.oy(or_, a2);
    const xi2 = this.ox(ir, a2), yi2 = this.oy(ir, a2);

    return [
      `M ${xi1} ${yi1}`,
      `L ${xo1} ${yo1}`,
      `A ${or_ * SX} ${or_ * SY} 0 ${lg} 1 ${xo2} ${yo2}`,
      `L ${xi2} ${yi2}`,
      `A ${ir * SX} ${ir * SY} 0 ${lg} 0 ${xi1} ${yi1}`,
      'Z'
    ].join(' ');
  }

  private buildRing(sectors: any[], ir: number, or_: number, startDeg = -90): SectorLayout[] {
    const n = sectors.length;
    const span = 360 / n;

    return sectors.map((s, i) => {
      const a1  = startDeg + i * span;
      const a2  = a1 + span;
      const mid = (a1 + a2) / 2;
      const mRad = this.toRad(mid);
      const mR   = (ir + or_) / 2;

      const labelX = this.ox(mR, mRad);
      const labelY = this.oy(mR, mRad);

      let labelRotate = mid + 90;
      if (labelRotate > 90 && labelRotate < 270) labelRotate += 180;

      const shortName = s.nombre
        .replace('Sector ', '')
        .replace('Palco ', 'P');

      return {
        ...s,
        shortName,
        path: this.arcPath(ir, or_, a1, a2),
        labelX,
        labelY,
        labelRotate,
      };
    });
  }

  sectores301(): SectorLayout[] {
    return this.buildRing(
      this.sectores().filter(s => /^Sector 3\d{2}$/.test(s.nombre)),
      RINGS.i300, RINGS.o300
    );
  }

  sectoresPalcos(): SectorLayout[] {
    return this.buildRing(
      this.sectores().filter(s => s.nombre.startsWith('Palco')),
      RINGS.iPal, RINGS.oPal
    );
  }

  sectores101(): SectorLayout[] {
    return this.buildRing(
      this.sectores().filter(s => /^Sector 1\d{2}$/.test(s.nombre)),
      RINGS.i100, RINGS.o100
    );
  }

  getSectorEspecial(nombre: string): any | null {
    return this.sectores().find(s => s.nombre === nombre) ?? null;
  }

  getSectorFill(sector: any, ring: string): string {
    if (!sector.disponible) return '#1e1e2e';
    if (this.selectedSector()?.id === sector.id) return 'rgba(255,255,255,0.18)';

    switch (ring) {
      case '300':   return '#3b5880';
      case 'palco': return '#7a6232';
      case '100':   return '#2a6060';
      case 'especial': switch (sector.nombre) {
        case 'PISTA':          return '#2a3d5c';
        case 'FRONT STAGE':    return '#506c81';
        case 'CLUB':           return '#a49971';
        case 'JOHNNIE WALKER': return '#745e3e';
        default:               return '#2a4040';
      }
    }
    return '#333';
  }

  onSectorClick(sector: any) {
    if (!sector.disponible) return;
    // Activar loading antes de emitir
    this.loadingSeats.set(true);
    this.selectedSector.set(sector);
    this.sectorSelected.emit(sector);
  }

  closeSectorPanel(event: Event) {
    event.stopPropagation();
    this.selectedSector.set(null);
    this.loadingSeats.set(false);
  }

  onSeatSelected(seat: any) { this.seatSelected.emit(seat); }
  removeSeat(seat: any)     { this.seatRemoved.emit(seat); }

  selectedSeatsCount(): number {
    if (!this.selectedSector()) return 0;
    return this.selectedSeats().filter(s => s._sectorId === this.selectedSector()!.id).length;
  }

  totalSeleccion(): number {
    return this.selectedSeats().reduce((sum, s) => sum + (s._precio ?? 0), 0);
  }
}