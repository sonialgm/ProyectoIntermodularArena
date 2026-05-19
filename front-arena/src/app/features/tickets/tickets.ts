import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './tickets.html'
})
export class Tickets implements OnInit {

  private router = inject(Router);

  entradas = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {

    const state = history.state;

    if (state?.entradas?.length) {
      this.entradas.set(state.entradas);

      localStorage.setItem('last_tickets', JSON.stringify(state.entradas));

    } else {

      const saved = localStorage.getItem('last_tickets');

      if (saved) {
        this.entradas.set(JSON.parse(saved));
      }
    }

    this.loading.set(false);
  }

  goProfile() {
    this.router.navigate(['/perfil']);
  }

  goEvents() {
    this.router.navigate(['/eventos']);
  }
}