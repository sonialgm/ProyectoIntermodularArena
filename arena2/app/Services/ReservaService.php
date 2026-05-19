<?php

namespace App\Services;

use App\Models\EstadoAsiento;
use App\Models\Asiento;
use App\Models\Evento;
use Illuminate\Support\Facades\DB;

class ReservaService
{
    /**
     * Reservar un asiento para un evento
     */
    public function reservarAsiento($eventoId, $asientoId, $userId)
    {
        DB::beginTransaction();
        try {
            // Limpiar reservas caducadas antes de intentar insertar una nueva
            EstadoAsiento::where('evento_id', $eventoId)
                ->where('asiento_id', $asientoId)
                ->where('reservado_hasta', '<', now())
                ->delete();

            // Bloqueo pesimista: evita race condition
            $existeReserva = EstadoAsiento::where('evento_id', $eventoId)
                ->where('asiento_id', $asientoId)
                ->where('estado', 'bloqueado')
                ->where('reservado_hasta', '>', now())
                ->lockForUpdate()
                ->first();

            if ($existeReserva) {
                throw new \Exception('El asiento no está disponible');
            }

            // VALIDACIÓN 1: máximo 6 asientos por evento y usuario
            $reservasActivas = EstadoAsiento::where('user_id', $userId)
                ->where('evento_id', $eventoId)
                ->where('estado', 'bloqueado')
                ->where('reservado_hasta', '>', now())
                ->count();

            if ($reservasActivas >= 6) {
                throw new \Exception('No puedes reservar más de 6 asientos por evento');
            }

            // 🔥 VALIDACIÓN 2: no mezclar eventos (si ya hay reservas activas de otro evento)
            $reservasOtroEvento = EstadoAsiento::where('user_id', $userId)
                ->where('evento_id', '!=', $eventoId)
                ->where('estado', 'bloqueado')
                ->where('reservado_hasta', '>', now())
                ->count();

            if ($reservasOtroEvento > 0) {
                throw new \Exception('Ya tienes una reserva activa para otro evento');
            }

            $asiento = Asiento::findOrFail($asientoId);
            $evento  = Evento::findOrFail($eventoId);

            $this->verificarSectorDisponible($evento, $asiento->sector_id);

            $reserva = EstadoAsiento::create([
                'evento_id'      => $eventoId,
                'asiento_id'     => $asientoId,
                'user_id'        => $userId,
                'estado'         => 'bloqueado',
                'reservado_hasta' => now()->addMinutes(15),
            ]);

            DB::commit();

            return $reserva->load(['evento', 'asiento.sector']);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    /**
     * Cancelar una reserva
     */
    public function cancelarReserva($reservaId, $userId)
    {
        $reserva = EstadoAsiento::where('id', $reservaId)
            ->where('user_id', $userId)
            ->where('estado', 'bloqueado')
            ->first();
        
            if (!$reserva) {
                throw new \Exception('Reserva no encontrada o no cancelable');
            }
            
        $reserva->delete();
        
        return true;
    }

    /**
     * Obtener reservas activas de un usuario
     */
    public function obtenerReservasUsuario($userId)
    {
        return EstadoAsiento::where('user_id', $userId)
            ->where('estado', 'bloqueado')
            ->where('reservado_hasta', '>', now())
            ->with(['evento', 'asiento.sector'])
            ->get();
    }

    /**
     * Verificar que el sector esté disponible para el evento
     */
    private function verificarSectorDisponible($evento, $sectorId)
    {
        if (!$evento->sectorEstaDisponible($sectorId)) {
            throw new \Exception('El sector no está disponible para este evento');
        }
    }
}