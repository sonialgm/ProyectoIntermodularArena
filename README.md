# 🎟️ Sistema de Venta de Entradas — Roig Arena

Aplicación web completa para la gestión y venta de entradas de eventos celebrados en el **Roig Arena** (Valencia). Desarrollada como proyecto intermodular del ciclo formativo de **Desarrollo de Aplicaciones Web (2º DAW)**.

---

## 📋 Descripción

La plataforma permite a los usuarios consultar eventos, seleccionar asientos de forma interactiva, gestionar reservas temporales y comprar entradas con código QR. Los administradores disponen de un panel completo para gestionar eventos, sectores, precios y usuarios.

---

## 🛠️ Tecnologías

### Backend
- **PHP + Laravel** — API REST
- **Laravel Sanctum** — Autenticación con tokens Bearer
- **Laravel Sail** — Entorno de desarrollo con Docker
- **MySQL** — Base de datos relacional
- **PHPUnit** — Tests unitarios y funcionales

### Frontend
- **Angular + TypeScript** — Arquitectura basada en componentes
- **Tailwind CSS** — Diseño responsive
- **ngx-toastr** — Notificaciones dinámicas
- **angularx-qrcode** — Generación de códigos QR

### Infraestructura
- **Docker + Docker Compose** — Contenedorización completa
- **AWS EC2** — Base de datos remota
- **Git** — Control de versiones

---

## 🏗️ Arquitectura

```
proyecto-raiz/
├── front-arena/     → Aplicación Angular
├── arena2/          → API Laravel
├── nginx/           → Configuración del proxy inverso
├── compose.yaml     → Orquestación de contenedores
├── arena2.sh        → Script de automatización
└── .env             → Variables de entorno
```

La aplicación sigue una arquitectura **cliente-servidor** con separación total entre frontend y backend. La comunicación se realiza mediante peticiones HTTP en formato JSON.

El backend sigue el patrón **MVC orientado a API**, con la siguiente estructura interna:

```
app/
├── Http/
│   ├── Controllers/     → Reciben peticiones y coordinan respuestas
│   ├── Middleware/       → Autenticación y control de roles
│   └── Resources/        → Formateo de respuestas JSON
├── Models/               → Entidades Eloquent
└── Services/             → Lógica de negocio compleja
```

---

## 🗄️ Modelo de datos

El sistema se compone de **7 tablas** organizadas en tres bloques:

| Bloque | Tablas |
|---|---|
| Infraestructura física | `sectores`, `asientos` |
| Lógica de eventos | `eventos`, `precios`, `estado_asientos` |
| Ventas definitivas | `entradas` |

Relaciones principales:
- `sectores` → `asientos`: **1:M**
- `eventos` ↔ `sectores`: **N:M** (via `precios`)
- `eventos` / `asientos` / `users` → `estado_asientos`: **1:M**
- `estado_asientos` → `entradas`: **1:1**

---

## 🚀 Instalación y puesta en marcha

### Requisitos previos
- Docker Desktop instalado y en ejecución
- Git

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyecto-raiz
```

### 2. Configurar el backend

```bash
cd arena2
composer install
cp .env.example .env
php artisan key:generate
```

Edita el archivo `.env` con los datos de tu base de datos.

### 3. Levantar el entorno completo

```bash
docker compose up --build
```

Esto levanta automáticamente los contenedores de **Angular**, **Laravel** y **Nginx**.

### 4. Ejecutar migraciones y seeders

```bash
php artisan migrate --seed
```

La aplicación estará disponible en `http://localhost`.

### 5. (Opcional) Script de automatización completo

```bash
./arena2.sh
```

Este script reinicia el entorno, ejecuta migraciones, puebla la base de datos y lanza la batería de tests automáticamente.

---

## 🌐 Endpoints principales de la API

### Públicos
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/register` | Registro de usuario |
| POST | `/api/login` | Inicio de sesión |
| GET | `/api/eventos` | Listado de eventos |
| GET | `/api/eventos/{id}` | Detalle de evento |
| GET | `/api/sectores` | Listado de sectores |
| GET | `/api/eventos/{id}/asientos` | Asientos por evento |

### Protegidos (auth:sanctum)
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/logout` | Cierre de sesión |
| GET | `/api/reservas` | Ver reservas activas |
| POST | `/api/reservas` | Crear reserva |
| DELETE | `/api/reservas/{id}` | Cancelar reserva |
| POST | `/api/compras` | Confirmar compra |
| GET | `/api/entradas` | Ver mis entradas |
| GET/PUT | `/api/perfil` | Ver y editar perfil |

### Administración
| Método | Endpoint | Descripción |
|---|---|---|
| POST/PUT/DELETE | `/api/admin/eventos/{id}` | Gestión de eventos |
| POST/PUT/DELETE | `/api/admin/sectores/{id}` | Gestión de sectores |
| PUT | `/api/admin/precios/{id}` | Actualizar precios |
| GET | `/api/admin/usuarios` | Gestión de usuarios |

---

## ✅ Tests

El proyecto incluye **45 tests** (76 assertions) divididos en:

- **Feature Tests** — Flujos completos: autenticación, reservas, compras, eventos.
- **Unit Tests** — Lógica interna: servicios, modelos, middleware.

Los tests se ejecutan sobre **SQLite en memoria** para mayor velocidad e independencia de la base de datos principal.

```bash
php artisan test
```

---

## ✨ Funcionalidades destacadas

- 🗺️ **Mapa interactivo SVG** del recinto para selección visual de asientos
- ⏱️ **Reservas temporales** con temporizador sincronizado entre frontend y backend
- 🔒 **Control de concurrencia** mediante transacciones para evitar doble reserva
- 📱 **Diseño responsive** con modo claro/oscuro
- 🎫 **Generación automática de códigos QR** por entrada
- 🛡️ **Control de roles** (usuario/administrador) validado siempre en el backend
- ☁️ **Base de datos remota en AWS EC2**

---

## 👩‍💻 Autora

**Sonia Luján García-Muñoz** — 2º DAW
