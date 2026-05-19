import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { CommonModule } from '@angular/common';

/**
 * Componente encargado de mostrar el listado de eventos disponibles.
 * Permite al usuario visualizar, explorar y seleccionar eventos para comprar entradas.
 * Es el Home de la aplicación 
*/
@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.html',
})
export class EventList implements OnInit {

  eventos = signal<any[]>([]);
  loading = signal(true);

  private eventService = inject(EventService);
  private router = inject(Router);

  searchText = signal('');
  searchDate = signal('');  

  async ngOnInit() {

    this.loading.set(true);

    try {
      const data = await this.eventService.getEventos();
      this.eventos.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  verDetalle(id: number) {
    this.router.navigate(['/eventos', id]);
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

  get eventosFiltrados() {
    return this.eventos().filter(evento => {

      const matchNombre =
        !this.searchText() ||
        evento.nombre.toLowerCase().includes(this.searchText().toLowerCase());

      const matchFecha =
        !this.searchDate() ||
        this.formatDate(evento.fecha) === this.searchDate();

      return matchNombre && matchFecha;
    });
  }

  formatDate(fecha: string): string {
    // si ya viene en formato yyyy-mm-dd no hace falta esto
    const [day, month, year] = fecha.split('/');
    return `${year}-${month}-${day}`;
  }

  clearFilters() {
    this.searchText.set('');
    this.searchDate.set('');
  }

  
}