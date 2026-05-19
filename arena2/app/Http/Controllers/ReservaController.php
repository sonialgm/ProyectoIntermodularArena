<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservaResource;
use App\Services\ReservaService;
use Illuminate\Http\Request;
use App\Http\Resources\EntradaResource;
use App\Models\EstadoAsiento;

class ReservaController extends Controller
{
    /**
     * Reservar un asiento (añadir al carrito)
     */
    public function store(Request $request, ReservaService $service)
    {
        $request->validate([
            'evento_id' => 'required|exists:eventos,id',
            'asiento_id' => 'required|exists:asientos,id',
        ]);

        try {
            $reserva = $service->reservarAsiento(
                $request->evento_id,
                $request->asiento_id,
                auth()->id()
            );

            return response()->json([
                'data' => new ReservaResource($reserva),
                'message' => 'Asiento reservado por 15 minutos',
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Ver mis reservas activas
     */
    public function index(Request $request)
    {
        $reservas = EstadoAsiento::where('user_id', $request->user()->id)
            ->where('estado', 'bloqueado')
            ->where('reservado_hasta', '>', now())
            ->with(['evento', 'asiento.sector'])
            ->latest()
            ->get();

        return response()->json([
            'data' => ReservaResource::collection($reservas)
        ]);
    }

    
    /**
     * Cancelar una reserva
     */
    public function destroy($id, ReservaService $service)
    {
        try {
            $service->cancelarReserva($id, auth()->id());

            return response()->json([
                'message' => 'Reserva cancelada correctamente',
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}