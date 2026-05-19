import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminPanel } from './features/admin/admin-panel/admin-panel';
import { AdminGuard } from './core/guards/admin.guard';
import { ContactoComponent } from './features/contacto/contacto';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'eventos',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.Register)
  },

  {
    path: 'eventos',
    loadComponent: () =>
      import('./features/eventos/event-list/event-list').then(m => m.EventList)
  },

  {
    path: 'eventos/:id',
    loadComponent: () =>
      import('./features/eventos/event-detail/event-detail').then(m => m.EventDetail)
  },

  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart').then(m => m.Cart),
    canActivate: [AuthGuard]
  },
    {

    path: 'tickets',
    loadComponent: () =>
    import('./features/tickets/tickets').then(m => m.Tickets)
  },

  {
    path: 'perfil',
    loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
    canActivate: [AuthGuard]
  },

  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-panel/admin-panel').then(m => m.AdminPanel),
    canActivate: [AdminGuard]
  },
  
  { path: 'contacto', component: ContactoComponent }


];