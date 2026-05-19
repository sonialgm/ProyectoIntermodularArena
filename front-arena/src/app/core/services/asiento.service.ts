import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Obtiene los asientos disponibles de un evento y sector
@Injectable({ providedIn: 'root' })
export class AsientoService {

  constructor(private http: HttpClient) {}

  getAsientos(eventoId: number, sectorId: number) {
    return this.http.get<any>(
      `/api/eventos/${eventoId}/sectores/${sectorId}/asientos`
    );
  }
}