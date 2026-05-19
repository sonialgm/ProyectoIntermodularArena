import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

// Panel de administración del sistema.
// Permite gestionar eventos, sectores y usuarios, incluyendo creación, edición, eliminación y control de disponibilidad en la plataforma.
@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html'
})
export class AdminPanel implements OnInit {

  private http   = inject(HttpClient);
  private auth   = inject(AuthService);
  private toastr = inject(ToastrService);

  eventos  = signal<any[]>([]);
  sectores = signal<any[]>([]);
  usuarios = signal<any[]>([]);
  loading  = signal(true);

  activeTab        = signal<'eventos' | 'estadio' | 'usuarios'>('eventos');
  editingId        = signal<number | null>(null);
  expandedEventoId = signal<number | null>(null);
  deleteModal      = signal(false);
  eventoAEliminar  = signal<any | null>(null);
  loadingSectorId  = signal<number | null>(null);
  loadingPrecioId  = signal<number | null>(null);

  creatingEvento = signal(false);

  selectedUsuario  = signal<any | null>(null);
  editingUsuarioId = signal<number | null>(null);
  loadingUsuarios  = signal(false);

  userErrors    = signal<string[]>([]);
  eventoErrors  = signal<string[]>([]);
  createErrors  = signal<string[]>([]);

  savingEvento   = signal(false);
  creatingEv     = signal(false);
  deletingEvento = signal(false);
  savingUsuario  = signal(false);

  savingPrecioId = signal<number | null>(null);
  savingDisponibilidadId = signal<number | null>(null);
  togglingSectorId = signal<number | null>(null);

  currentPage = signal(1);
  pageSize = signal(5); // usuarios por página

  userForm = {
    nombre: '',
    apellido: '',
    email: ''
  };

  form = {
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    poster_url: '',
    fecha: '',
    hora: ''
  };

  ngOnInit() {
    this.loadEventos();
    this.loadSectores();
  }

  // =========================
  // EVENTOS
  // =========================
  loadEventos() {
    this.http.get<any>('http://localhost/api/eventos').subscribe({
      next: (res) => {
        this.eventos.set(res.data ?? res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[ADMIN] Error eventos:', err);
        this.toastr.error('Error cargando eventos');
        this.loading.set(false);
      }
    });
  }

  // =========================
  // CREAR EVENTO
  // =========================
  openCreateEvento() {
    this.creatingEvento.set(true);
    this.editingId.set(null);
    this.createErrors.set([]);
    this.form = { nombre: '', descripcion_corta: '', descripcion_larga: '', poster_url: '', fecha: '', hora: '' };
  }

  cancelCreateEvento() {
    this.creatingEvento.set(false);
    this.createErrors.set([]);
  }

  createEvento() {
    this.createErrors.set([]);
    const validationErrors = this.validateCreateEvento();
    if (validationErrors.length > 0) {
      this.createErrors.set(validationErrors);
      this.toastr.warning('Revisa los campos del evento');
      return;
    }

    const token = this.auth.getToken();
    this.creatingEv.set(true);

    this.http.post('http://localhost/api/admin/eventos', this.form,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.toastr.success('Evento creado correctamente');
        this.creatingEvento.set(false);
        this.createErrors.set([]);
        this.form = { nombre: '', descripcion_corta: '', descripcion_larga: '', poster_url: '', fecha: '', hora: '' };
        this.loadEventos();
        this.creatingEv.set(false);
      },
      error: (err) => {
        const backendErrors = err?.error?.errors;
        if (backendErrors) {
          this.createErrors.set(Object.values(backendErrors).flat().map((e: any) => String(e)));
        } else {
          this.createErrors.set([err?.error?.message || 'Error al crear evento']);
        }
        this.toastr.error('No se pudo crear el evento');
        this.creatingEv.set(false);
      }
    });
  }

  edit(evento: any) {
    this.creatingEvento.set(false);
    this.editingId.set(evento.id);
    this.eventoErrors.set([]);
    this.form = {
      nombre: evento.nombre,
      descripcion_corta: evento.descripcion_corta,
      descripcion_larga: evento.descripcion_larga ?? '',
      poster_url: evento.poster,
      fecha: this.toInputDate(evento.fecha),
      hora: evento.hora
    };
  }

  cancelEdit() {
    this.editingId.set(null);
    this.eventoErrors.set([]);
  }

  save(eventoId: number) {
    this.eventoErrors.set([]);
    const validationErrors = this.validateEvento();
    if (validationErrors.length > 0) {
      this.eventoErrors.set(validationErrors);
      this.toastr.warning('Revisa los campos del evento');
      return;
    }

    const token = this.auth.getToken();
    this.savingEvento.set(true);

    this.http.put(`http://localhost/api/admin/eventos/${eventoId}`, this.form,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.toastr.success('Evento actualizado correctamente');
        this.editingId.set(null);
        this.eventoErrors.set([]);
        this.loadEventos();
        this.savingEvento.set(false);
      },
      error: (err) => {
        const backendErrors = err?.error?.errors;
        if (backendErrors) {
          this.eventoErrors.set(Object.values(backendErrors).flat().map((e: any) => String(e)));
        } else {
          this.eventoErrors.set([err?.error?.message || 'Error al actualizar evento']);
        }
        this.toastr.error('No se pudo actualizar el evento');
        this.savingEvento.set(false);
      }
    });
  }

  private validateEvento(): string[] {
    const errors: string[] = [];
    if (!this.form.nombre.trim()) errors.push('El nombre es obligatorio');
    if (!this.form.descripcion_corta.trim()) errors.push('La descripción corta es obligatoria');
    if (!this.form.descripcion_larga.trim()) errors.push('La descripción larga es obligatoria');
    if (!this.form.fecha) {
      errors.push('La fecha es obligatoria');
    } else {
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      if (new Date(this.form.fecha) < hoy) errors.push('La fecha no puede ser anterior a hoy');
    }
    if (!this.form.hora) errors.push('La hora es obligatoria');
    if (this.form.poster_url.trim()) {
      try { new URL(this.form.poster_url); } catch { errors.push('La URL del poster no es válida'); }
    }
    return errors;
  }

  private validateCreateEvento(): string[] {
    const errors: string[] = [];
    if (!this.form.nombre.trim()) errors.push('El nombre es obligatorio');
    if (!this.form.descripcion_corta.trim()) errors.push('La descripción corta es obligatoria');
    if (!this.form.descripcion_larga.trim()) errors.push('La descripción larga es obligatoria');
    if (!this.form.fecha) errors.push('La fecha es obligatoria');
    if (!this.form.hora) errors.push('La hora es obligatoria');
    if (this.form.poster_url?.trim() && !/^https?:\/\/.+/i.test(this.form.poster_url)) {
      errors.push('La URL del poster no es válida');
    }
    if (this.form.fecha) {
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      if (new Date(this.form.fecha) < hoy) errors.push('La fecha no puede ser anterior a hoy');
    }
    return errors;
  }

  // =========================
  // SECTORES GLOBALES
  // =========================
  loadSectores() {
    this.http.get<any>('http://localhost/api/sectores').subscribe({
      next: (res) => this.sectores.set(res.data ?? res),
      error: (err) => {
        console.error('[ADMIN] Error sectores:', err);
        this.toastr.error('Error cargando sectores');
      }
    });
  }

  toggleSectorGlobal(sector: any) {
    const token = this.auth.getToken();
    const newState = !sector.activo;
    this.togglingSectorId.set(sector.id);

    this.http.put(`http://localhost/api/admin/sectores/${sector.id}`,
      { activo: newState },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.sectores.set(this.sectores().map(s => s.id === sector.id ? { ...s, activo: newState } : s));
        this.toastr.success(newState ? 'Sector activado' : 'Sector desactivado');
        this.togglingSectorId.set(null);
        this.loadEventos();
      },
      error: (err) => {
        console.error('[ADMIN] Sector error:', err);
        this.toastr.error('Error actualizando sector');
        this.togglingSectorId.set(null);
      }
    });
  }

  // =========================
  // SECTORES EN EVENTO
  // =========================
  toggleSectores(eventoId: number) {
    this.expandedEventoId.set(this.expandedEventoId() === eventoId ? null : eventoId);
  }

  // =========================
  // PRECIOS
  // =========================
  savePrecioSolo(precio: any) {
    if (!precio.sector?.activo) return;
    const token = this.auth.getToken();
    this.savingPrecioId.set(precio.id);

    this.http.put(`http://localhost/api/admin/precios/${precio.id}`,
      { precio: Number(precio.precio_raw) },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res: any) => {
        this.toastr.success('Precio actualizado');
        this.actualizarPrecioLocal(precio.id, res.data);
        this.savingPrecioId.set(null);
      },
      error: (err) => {
        console.error('[ADMIN] error precio:', err.error);
        this.toastr.error(err.error?.error ?? 'Error guardando precio');
        this.savingPrecioId.set(null);
      }
    });
  }

  saveDisponibilidad(precio: any) {
    if (!precio.sector?.activo) return;
    const token = this.auth.getToken();
    const nuevoEstado = !precio.disponible;
    this.savingDisponibilidadId.set(precio.id);

    this.http.put(`http://localhost/api/admin/precios/${precio.id}`,
      { disponible: nuevoEstado },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res: any) => {
        this.toastr.success(nuevoEstado ? 'Sector habilitado en este evento' : 'Sector bloqueado en este evento');
        this.actualizarPrecioLocal(precio.id, res.data);
        this.savingDisponibilidadId.set(null);
      },
      error: (err) => {
        console.error('[ADMIN] error disponibilidad:', err.error);
        this.toastr.error(err.error?.error ?? 'Error actualizando disponibilidad');
        this.savingDisponibilidadId.set(null);
      }
    });
  }

  private actualizarPrecioLocal(precioId: number, data: any) {
    this.eventos.set(this.eventos().map(e => {
      if (!e.precios) return e;
      return { ...e, precios: e.precios.map((p: any) => p.id === precioId ? { ...p, precio_raw: data.precio, disponible: data.disponible } : p) };
    }));
  }

  // =========================
  // DELETE EVENTO
  // =========================
  openDeleteModal(evento: any) {
    this.eventoAEliminar.set(evento);
    this.deleteModal.set(true);
  }

  closeDeleteModal() {
    this.deleteModal.set(false);
    this.eventoAEliminar.set(null);
  }

  confirmDelete() {
    const evento = this.eventoAEliminar();
    if (!evento) return;
    const token = this.auth.getToken();
    this.deletingEvento.set(true);

    this.http.delete(`http://localhost/api/admin/eventos/${evento.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.toastr.success('Evento eliminado');
        this.closeDeleteModal();
        this.loadEventos();
        this.deletingEvento.set(false);
      },
      error: (err) => {
        console.error('[ADMIN] delete error:', err.error);
        this.toastr.error(err?.error?.error || err?.error?.message || 'Error eliminando evento');
        this.deletingEvento.set(false);
      }
    });
  }

  // =========================
  // USUARIOS
  // =========================
  loadUsuarios() {
    if (this.usuarios().length > 0) return;
    const token = this.auth.getToken();
    this.loadingUsuarios.set(true);

    this.http.get<any>('http://localhost/api/admin/usuarios',
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res) => {
        this.usuarios.set(res.data ?? []);
        this.loadingUsuarios.set(false);
      },
      error: (err) => {
        console.error('[ADMIN] Error usuarios:', err);
        this.toastr.error('Error cargando usuarios');
        this.loadingUsuarios.set(false);
      }
    });
  }

  selectUsuario(usuario: any) {
    if (this.selectedUsuario()?.id === usuario.id) {
      this.selectedUsuario.set(null);
      this.editingUsuarioId.set(null);
      return;
    }
    const token = this.auth.getToken();
    this.http.get<any>(`http://localhost/api/admin/usuarios/${usuario.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res) => this.selectedUsuario.set(res.data),
      error: (err) => {
        console.error('[ADMIN] Error detalle usuario:', err);
        this.toastr.error('Error cargando usuario');
      }
    });
  }

  editUsuario(usuario: any) {
    this.editingUsuarioId.set(usuario.id);
    this.userErrors.set([]);
    this.userForm = { nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email };
  }

  cancelEditUsuario() {
    this.editingUsuarioId.set(null);
    this.userErrors.set([]);
  }

  private validateUsuario(): string[] {
    const errors: string[] = [];
    if (!this.userForm.nombre.trim()) errors.push('El nombre es obligatorio');
    if (!this.userForm.apellido.trim()) errors.push('El apellido es obligatorio');
    if (!this.userForm.email.trim()) errors.push('El email es obligatorio');
    else if (!this.userForm.email.includes('@')) errors.push('El email no es válido');
    return errors;
  }

  saveUsuario(usuarioId: number) {
    this.userErrors.set([]);
    const validationErrors = this.validateUsuario();
    if (validationErrors.length > 0) {
      this.userErrors.set(validationErrors);
      this.toastr.warning('Revisa los campos del usuario');
      return;
    }

    const token = this.auth.getToken();
    this.savingUsuario.set(true);

    this.http.put(`http://localhost/api/admin/usuarios/${usuarioId}`, this.userForm,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => {
        this.toastr.success('Usuario actualizado correctamente');
        this.editingUsuarioId.set(null);
        this.userErrors.set([]);
        this.usuarios.set(this.usuarios().map(u => u.id === usuarioId ? { ...u, ...this.userForm } : u));
        if (this.selectedUsuario()?.id === usuarioId) {
          this.selectedUsuario.set({ ...this.selectedUsuario(), ...this.userForm });
        }
        this.savingUsuario.set(false);
      },
      error: (err) => {
        const backendErrors = err?.error?.errors;
        if (backendErrors) {
          this.userErrors.set(Object.values(backendErrors).flat().map((e: any) => String(e)));
        } else {
          this.userErrors.set([err?.error?.message || 'Error al actualizar usuario']);
        }
        this.toastr.error('No se pudo actualizar el usuario');
        this.savingUsuario.set(false);
      }
    });
  }

  onTabChange(tab: 'eventos' | 'estadio' | 'usuarios') {
    this.activeTab.set(tab);
    if (tab === 'usuarios') this.loadUsuarios();
  }

  toInputDate(fecha: string): string {
    const [day, month, year] = fecha.split('/');
    return `${year}-${month}-${day}`;
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
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

  zonaHoraria(hora: string): string {
    if (!hora) return '';

    const [h, m] = hora.split(':').map(Number);

    const fecha = new Date();
    fecha.setHours(h + 2, m);

    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  sectoresAgrupados = computed(() => {
    const sectores = this.sectores();
    return [
      {
        grupo: 'Grada inferior (101-122)',
        items: sectores.filter(s => s.nombre.match(/^Sector 1\d{2}$/))
      },
      {
        grupo: 'Grada superior (301-323)',
        items: sectores.filter(s => s.nombre.match(/^Sector 3\d{2}$/))
      },
      {
        grupo: 'Palcos VIP',
        items: sectores.filter(s => s.nombre.startsWith('Palco'))
      },
      {
        grupo: 'Zonas especiales',
        items: sectores.filter(s =>
          ['CLUB', 'JOHNNIE WALKER', 'PISTA', 'FRONT STAGE'].includes(s.nombre)
        )
      },
    ].filter(g => g.items.length > 0);
  });

  groupPrecios(precios: any[]) {
    return [
      {
        grupo: 'Grada inferior (101-122)',
        items: precios.filter(p => /^Sector 1\d{2}$/.test(p.sector.nombre))
      },
      {
        grupo: 'Grada superior (301-323)',
        items: precios.filter(p => /^Sector 3\d{2}$/.test(p.sector.nombre))
      },
      {
        grupo: 'Palcos VIP',
        items: precios.filter(p => p.sector.nombre.startsWith('Palco'))
      },
      {
        grupo: 'Zonas especiales',
        items: precios.filter(p =>
          ['CLUB', 'JOHNNIE WALKER', 'PISTA', 'FRONT STAGE']
            .includes(p.sector.nombre)
        )
      }
    ].filter(g => g.items.length > 0);
  }

  // Paginación
  usuariosPaginados = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.usuarios().slice(start, end);
  });

  totalPages = computed(() =>
    Math.ceil(this.usuarios().length / this.pageSize())
  );

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }
  
}