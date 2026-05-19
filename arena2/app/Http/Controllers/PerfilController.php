<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\UserResource;

class PerfilController extends Controller
{
    /**
     * Ver perfil del usuario autenticado
     */
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'entradas.evento',
            'reservas' => function ($q) {
                $q->where('estado', 'bloqueado')
                  ->where('reservado_hasta', '>', now())
                  ->with(['evento', 'asiento.sector']);
            }
        ]);

        return response()->json([
            'data' => [
                'id'        => $user->id,
                'nombre'    => $user->nombre,
                'apellido'  => $user->apellido,
                'email'     => $user->email,
                'is_admin'  => $user->is_admin,
                'entradas'  => $user->entradas->map(fn($e) => [
                    'id'          => $e->id,
                    'evento'      => [
                        'id'     => $e->evento->id,
                        'nombre' => $e->evento->nombre,
                        'fecha' => $e->evento->fecha?->format('d/m/Y'),
                        'hora'   => $e->evento->hora,
                    ],
                    'created_at'  => $e->created_at?->format('d/m/Y'),
                ]),
                'reservas_activas' => $user->reservas->map(fn($r) => [
                    'id'             => $r->id,
                    'evento'         => [
                        'id'     => $r->evento->id,
                        'nombre' => $r->evento->nombre,
                        'fecha'  => $r->evento->fecha,
                    ],
                    'asiento'        => [
                        'fila'    => $r->asiento->fila,
                        'numero'  => $r->asiento->numero,
                        'sector'  => $r->asiento->sector->nombre ?? '',
                    ],
                    'reservado_hasta' => $r->reservado_hasta?->format('H:i'),
                ]),
            ]
        ]);
    }

    /**
     * Editar datos del perfil
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nombre'   => 'sometimes|string|max:255',
            'apellido' => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($data);

        return response()->json([
            'data'    => new UserResource($user),
            'message' => 'Perfil actualizado correctamente',
        ]);
    }

    /**
     * Cambiar contraseña
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'password_actual' => 'required',
            'password'        => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password_actual, $user->password)) {
            return response()->json([
                'error' => 'La contraseña actual no es correcta',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente',
        ]);
    }
}