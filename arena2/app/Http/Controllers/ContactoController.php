<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ContactoController extends Controller
{
    public function enviar(Request $request)
    {
        $request->validate([
            'nombre'  => 'required|string|max:100',
            'email'   => 'required|email|max:150',
            'asunto'  => 'required|string|max:200',
            'mensaje' => 'required|string|max:1000',
        ]);

        // Leer consultas actuales de la sesión
        $consultas = session('consultas', []);

        // Añadir la nueva consulta
        $consultas[] = [
            'nombre'  => $request->nombre,
            'email'   => $request->email,
            'asunto'  => $request->asunto,
            'mensaje' => $request->mensaje,
            'fecha'   => now()->format('d/m/Y H:i'),
        ];

        // Guardar en sesión
        session(['consultas' => $consultas]);

        return response()->json([
            'ok'      => true,
            'mensaje' => 'Consulta enviada correctamente',
            'total'   => count($consultas),
        ]);
    }

    public function misConsultas()
    {
        $consultas = session('consultas', []);

        return response()->json([
            'ok'       => true,
            'consultas' => array_reverse($consultas), // más recientes primero
            'total'    => count($consultas),
        ]);
    }

    public function limpiar()
    {
        session()->forget('consultas');

        return response()->json([
            'ok'      => true,
            'mensaje' => 'Consultas eliminadas',
        ]);
    }
}