<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    /**
     * Atributos que se pueden asignar en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'apellido',
        'email',
        'password',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Atributos que se debe hacer cast
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Verificar si el usuario es administrador
     */
    public function isAdmin(): bool
    {
        return $this->is_admin;
    }

        // ============================================
    // RELACIONES
    // ============================================

    /**
     * Un usuario tiene muchas reservas (estados de asientos)
     */
    public function reservas()
    {
        return $this->hasMany(EstadoAsiento::class);
    }

    /**
     * Un usuario tiene muchas entradas compradas
     */
    public function entradas()
    {
        return $this->hasMany(Entrada::class);
    }

    // ============================================
    // MÉTODOS ÚTILES
    // ============================================

    /**
     * Obtener reservas activas (no expiradas)
     */
    public function reservasActivas()
    {
        return $this->reservas()
            ->where('estado', 'bloqueado')
            ->where('reservado_hasta', '>', now())
            ->get();
    }

    /**
     * Obtener entradas válidas (eventos futuros)
     */
    public function entradasValidas()
    {
        return $this->entradas()
            ->whereHas('evento', function ($q) {
                $q->where('fecha', '>=', now()->toDateString());
            })
            ->get();
    }

    /**
     * Verificar si tiene una reserva para un evento específico
     */
    public function tieneReservaEnEvento($eventoId): bool
    {
        return $this->reservas()
            ->where('evento_id', $eventoId)
            ->exists();
    }

    /**
     * Verificar si tiene una entrada para un evento específico
     */
    public function tieneEntradaEnEvento($eventoId): bool
    {
        return $this->entradas()
            ->where('evento_id', $eventoId)
            ->exists();
    }

    public function getNameAttribute()
    {
        return $this->nombre . ' ' . $this->apellido;
    }

    protected $appends = ['name'];
}
