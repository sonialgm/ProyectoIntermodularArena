<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use App\Models\Sector;
use App\Models\Precio;
use App\Http\Resources\EventoResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventoController extends Controller
{
    public function index()
    {
        $eventos = Evento::futuros()->with('precios.sector')->get();
        return EventoResource::collection($eventos);
    }

    public function show($id)
    {
        $evento = Evento::with('precios.sector')->findOrFail($id);
        return new EventoResource($evento);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'            => 'required|string|max:255',
            'descripcion_corta' => 'required|string|max:255',
            'descripcion_larga' => 'required|string',
            'poster_url'        => 'nullable|url',
            'fecha'             => 'required|date|after_or_equal:today',
            'hora'              => 'required|date_format:H:i',
        ]);

        DB::beginTransaction();

        try {
            $evento = Evento::create($request->all());

            // Generar precios para todos los sectores activos
            $sectores = Sector::where('activo', true)->get();
            $precios  = [];
            $now      = now();

            foreach ($sectores as $sector) {
                $precios[] = [
                    'evento_id'  => $evento->id,
                    'sector_id'  => $sector->id,
                    'precio'     => $this->calcularPrecio($request->nombre, $sector),
                    'disponible' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            Precio::insert($precios);

            DB::commit();

            // Recargar con relaciones para devolverlo completo
            $evento->load('precios.sector');

            return response()->json([
                'data'    => new EventoResource($evento),
                'message' => 'Evento creado correctamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al crear el evento: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $evento = Evento::findOrFail($id);

        $request->validate([
            'nombre'            => 'sometimes|string|max:255',
            'descripcion_corta' => 'sometimes|string|max:255',
            'descripcion_larga' => 'sometimes|string',
            'poster_url'        => 'nullable|url',
            'fecha'             => 'sometimes|date|unique:eventos,fecha,' . $id,
            'hora'              => 'sometimes|date_format:H:i',
        ]);

        $evento->update($request->all());

        return response()->json([
            'data'    => $evento,
            'message' => 'Evento actualizado correctamente',
        ]);
    }

    public function destroy($id)
    {
        $evento = Evento::findOrFail($id);

        if ($evento->totalEntradasVendidas() > 0) {
            return response()->json([
                'error' => 'No se puede eliminar un evento con entradas vendidas',
            ], 400);
        }

        $evento->delete();

        return response()->json([
            'message' => 'Evento eliminado correctamente',
        ]);
    }

    // =========================
    // PRECIO BASE POR SECTOR
    // =========================
    private function calcularPrecio(string $nombreEvento, Sector $sector): float
    {
        $precioBase = match(true) {
            str_starts_with($sector->nombre, 'Palco')        => 150.00,
            $sector->nombre === 'FRONT STAGE'                => 120.00,
            $sector->nombre === 'CLUB'                       => 100.00,
            $sector->nombre === 'JOHNNIE WALKER'             => 90.00,
            $sector->nombre === 'PISTA'                      => 80.00,
            str_starts_with($sector->nombre, 'Sector 10')   => 50.00,
            str_starts_with($sector->nombre, 'Sector 30')   => 40.00,
            default                                          => 50.00,
        };

        $multiplicador = match($nombreEvento) {
            'Final Copa del Rey'    => 1.5,
            'Concierto Rock 2026'   => 1.3,
            'Festival Electrónica'  => 1.2,
            default                 => 1.0,
        };

        return round($precioBase * $multiplicador, 2);
    }
}