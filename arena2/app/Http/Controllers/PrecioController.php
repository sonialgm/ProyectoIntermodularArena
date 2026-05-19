<?php

namespace App\Http\Controllers;

use App\Models\Precio;
use Illuminate\Http\Request;

class PrecioController extends Controller
{
    public function update(Request $request, $id)
    {
        $precio = Precio::with('sector')->findOrFail($id);

        if (!$precio->sector) {
            return response()->json(['error' => 'El sector asociado no existe'], 404);
        }

        if (!$precio->sector->activo) {
            return response()->json(['error' => 'No se puede modificar un precio de un sector desactivado'], 403);
        }

            $data = $request->validate([
                'precio'     => 'nullable|numeric|min:0', 
                'precio_raw' => 'nullable|numeric|min:0',
                'disponible' => 'nullable',
            ]);

            $cambioPrecio    = isset($data['precio']) || isset($data['precio_raw']);
            $cambioDisponible = isset($data['disponible']);

            if ($cambioPrecio) {
                $precio->precio = (float) ($data['precio'] ?? $data['precio_raw']);
            }

        if ($cambioDisponible) {
            $precio->disponible = filter_var($data['disponible'], FILTER_VALIDATE_BOOLEAN);
        }

        $precio->save();
        $precio->refresh();
        $precio->load('sector');

        // Mensaje dinámico
        if ($cambioPrecio && $cambioDisponible) {
            $mensaje = 'Precio y disponibilidad actualizados';
        } elseif ($cambioPrecio) {
            $mensaje = 'Precio actualizado correctamente';
        } else {
            $mensaje = 'Disponibilidad actualizada correctamente';
        }

        return response()->json([
            'data'    => $precio,
            'message' => $mensaje,
        ]);
    }
}