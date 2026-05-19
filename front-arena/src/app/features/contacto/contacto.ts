import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

interface Consulta {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  fecha: string;
}

// Este componente usa SESIÓN PHP (Laravel session)
// Los datos NO se guardan en frontend ni JWT
// Se guardan en el servidor usando session()

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
})
export class ContactoComponent implements OnInit {

  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  consultas = signal<Consulta[]>([]);
  enviando = signal(false);
  cargando = signal(false);

  form = {
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  };

  ngOnInit() {
    this.cargarConsultas();
  }

  cargarConsultas() {
    this.cargando.set(true);
    this.http.get<any>('http://localhost/contacto/mis-consultas', {
      withCredentials: true
    }).subscribe({
      next: (res) => {
        this.consultas.set(res.consultas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  enviar() {
    if (!this.form.nombre || !this.form.email || !this.form.asunto || !this.form.mensaje) {
      this.toastr.warning('Rellena todos los campos');
      return;
    }

    this.enviando.set(true);

    this.http.post<any>('http://localhost/contacto/enviar', this.form, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.toastr.success('Consulta enviada correctamente');
        this.form = { nombre: '', email: '', asunto: '', mensaje: '' };
        this.enviando.set(false);
        this.cargarConsultas();
      },
      error: () => {
        this.toastr.error('Error al enviar la consulta');
        this.enviando.set(false);
      }
    });
  }

  limpiar() {
    this.http.post<any>('http://localhost/contacto/limpiar', {}, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.consultas.set([]);
        this.toastr.info('Consultas eliminadas');
      }
    });
  }
}