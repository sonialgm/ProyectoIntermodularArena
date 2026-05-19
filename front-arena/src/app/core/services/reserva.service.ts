import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Gestiona creación y cancelación de reservas en backend
@Injectable({
  providedIn: 'root'
})
export class ReservaService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost/api';

  async reservar(
    eventoId: number,
    asientoId: number
  ) {

    return await firstValueFrom(

      this.http.post<any>(
        `${this.apiUrl}/reservas`,
        {
          evento_id: eventoId,
          asiento_id: asientoId
        },
        {
          withCredentials: true
        }
      )

    );
  }

  async cancelar(
    reservaId: number
  ) {

    return await firstValueFrom(

      this.http.delete<any>(
        `${this.apiUrl}/reservas/${reservaId}`,
        {
          withCredentials: true
        }
      )

    );
  }
}