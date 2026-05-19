import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost/api';

  user = signal<any>(null);

  constructor(private http: HttpClient) {
    this.restoreUser();
  }

  // =========================
  // LOGIN
  // =========================
  login(data: any) {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  // =========================
  // REGISTER
  // =========================
  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // =========================
  // SESSION
  // =========================
  // Guarda usuario y token tras login y actualiza el estado global (signal)
  setSession(user: any, token: string) {

    console.log('SET SESSION USER:', user);
    console.log('SET SESSION TOKEN:', token);

    this.user.set(user);

    localStorage.setItem('token', token);

    // 🔥 guardar usuario también
    localStorage.setItem('user', JSON.stringify(user));
  }

  // =========================
  // RESTORE USER
  // =========================
  // Restaura la sesión del usuario desde localStorage al recargar la app
  restoreUser() {

    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    console.log('RESTORE TOKEN:', token);
    console.log('RESTORE USER:', savedUser);

    if (savedUser && token) {

      try {

        const parsedUser = JSON.parse(savedUser);

        this.user.set(parsedUser);

        console.log('USUARIO RESTAURADO:', parsedUser);

      } catch (e) {

        console.error('ERROR RESTORING USER:', e);

        this.clearSession();
      }
    }
  }

  // =========================
  // TOKEN
  // =========================
  getToken() {
    return localStorage.getItem('token');
  }

  // =========================
  // GET AUTH USER
  // =========================
  me() {
    return this.http.get(`${this.apiUrl}/user`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  // =========================
  // LOGOUT
  // =========================
  // Cierra sesión en backend y limpia localStorage + estado del usuario
  logout() {

    const token = this.getToken();

    console.log('ANTES LOGOUT TOKEN:', token);

    // logout backend
    if (token) {

      this.http.post(
        `${this.apiUrl}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).subscribe({
        next: () => {
          console.log('LOGOUT BACKEND OK');
        },
        error: (err) => {
          console.error('LOGOUT BACKEND ERROR:', err);
        }
      });
    }

    // Limpiar frontend
    this.clearSession();

    console.log('DESPUÉS LOGOUT TOKEN:', this.getToken());
    console.log('USER:', this.user());
  }

  // =========================
  // CLEAR SESSION
  // =========================
  clearSession() {

    this.user.set(null);

    localStorage.removeItem('token');

    localStorage.removeItem('user');
  }

  // =========================
  // AUTH CHECK
  // =========================
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getProfile() {
    return this.http.get(`${this.apiUrl}/user`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  getEntradas() {
    return this.http.get(`${this.apiUrl}/entradas`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }
}