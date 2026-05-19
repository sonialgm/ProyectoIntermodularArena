import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SeatEstado = 'libre' | 'reservado' | 'vendido' | 'bloqueado';

export interface Asiento {
  id: number;
  numero: number;
  fila: string | number;
  estado: SeatEstado;
  [key: string]: any;
}

@Component({
  selector: 'seat-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-grid.html'
})
export class SeatGrid {

  asientosPorFila = input<Record<string, Asiento[]>>({});
  filas           = input<any[]>([]);
  selected        = input<number[]>([]);
  loading         = input<boolean>(false);

  seatSelected = output<Asiento>();

  filasOrdenadas = computed(() =>
    [...this.filas()].sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);

      if (!isNaN(na) && !isNaN(nb)) {
        return na - nb;
      }

      return String(a).localeCompare(String(b), undefined, {
        numeric: true
      });
    })
  );

  totalLibres = computed(() =>
    Object.values(this.asientosPorFila())
      .flat()
      .filter(a => a.estado === 'libre').length
  );

  totalSeleccionados = computed(() => this.selected().length);

  isSelected(seat: Asiento): boolean {
    return this.selected().includes(seat.id);
  }

  // Determina si el asiento es clickable
  canSelect(seat: Asiento): boolean {
    return seat.estado === 'libre' || this.isSelected(seat);
  }

  onSeatClick(seat: Asiento) {
    if (!this.canSelect(seat)) return;
    this.seatSelected.emit(seat);
  }

  filaLabel(fila: any): string {
    return String(fila);
  }


  // TAILWIND CLASSES (devuelve según el estado del asiento)
  getSeatClasses(seat: Asiento): string {

    const base =
      'relative flex items-center justify-center ' +
      'w-[22px] h-[22px] sm:w-[28px] sm:h-[28px] ' +
      'shrink-0 rounded-md border ' +
      'text-[6px] sm:text-[7.5px] font-bold ' +
      'select-none transition-all duration-100';

    // SELECCIONADO
    if (this.isSelected(seat)) {
      return (
        base +
        ' bg-[#E8581A] border-[#cf4d16] text-white ' +
        'shadow-md -translate-y-px ' +
        'hover:bg-[#cf4d16] hover:scale-110 hover:shadow-lg'
      );
    }

    switch (seat.estado) {

      // LIBRE
      case 'libre':
        return (
          base +
          ' bg-[#b8d4f0] border-[#7aaad8] text-[#1e3a58] cursor-pointer ' +
          'hover:-translate-y-0.5 hover:scale-110 ' +
          'hover:bg-[#96bde8] hover:shadow-md'
        );

      // RESERVADO / BLOQUEADO
      case 'reservado':
      case 'bloqueado':
        return (
          base +
          ' bg-amber-300 border-amber-500 text-amber-900 ' +
          'cursor-not-allowed opacity-90'
        );

      // VENDIDO
      case 'vendido':
      default:
        return (
          base +
          ' bg-[#b8bfcc] border-[#9aa0b0] text-[#555] ' +
          'cursor-not-allowed opacity-75'
        );
    }
  }

  // LOADING VISUAL
  skeletonRows(): number[] {
    return Array.from({ length: 8 }, (_, i) => i);
  }

  skeletonCols(): number[] {
    return Array.from({ length: 12 }, (_, i) => i);
  }

  loadingInitialSeats = input<boolean>(false);
  refreshingSeats = input<boolean>(false);

}