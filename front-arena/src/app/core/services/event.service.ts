import { Injectable } from '@angular/core';

// Servicio para obtener eventos, sectores y asientos desde la API
@Injectable({ providedIn: 'root' })
export class EventService {

  private apiUrl = 'http://localhost/api';

  async getEventos() {
    const res = await fetch(`${this.apiUrl}/eventos`);
    const data = await res.json();
    return data?.data ?? [];
  }

  async getEventoById(id: number) {
    const res = await fetch(`${this.apiUrl}/eventos/${id}`);
    const json = await res.json();

    console.log('RESPUESTA EVENTO:', json);

    return json?.data ?? null;
  }

  async getSectores() {
    const res = await fetch(`${this.apiUrl}/sectores`);
    const data = await res.json();
    return data?.data ?? [];
  }

  async getAsientosBySector(eventoId: number, sectorId: number) {

    const res = await fetch(
      `${this.apiUrl}/eventos/${eventoId}/sectores/${sectorId}/asientos`
    );

    const json = await res.json();

    return {
      asientos: json?.data?.asientos ?? [],
      precio: json?.data?.precio ?? 0,
      sector: json?.data?.sector ?? null
    };
  }

  async getEstadoAsientos(eventoId: number, sectorId: number) {

    const res = await fetch(
      `${this.apiUrl}/eventos/${eventoId}/sectores/${sectorId}/asientos`
    );

    const json = await res.json();

    return json?.data ?? [];
  }

  // 🔥 NUEVO
  async getReservas() {

    const token = localStorage.getItem('token');

    if (!token) return [];

    const res = await fetch(`${this.apiUrl}/reservas`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const json = await res.json();

    return json?.data ?? [];
  }
}