<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * Lista de usuarios
     */
    public function index()
    {
        $users = User::withCount([
            'entradas',
            'reservas as reservas_count' => function ($q) {
                $q->where('estado', 'bloqueado')
                ->where('reservado_hasta', '>', now());
            }
        ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($u) => [
                'id'              => $u->id,
                'nombre'          => $u->nombre,
                'apellido'        => $u->apellido,
                'email'           => $u->email,
                'is_admin'        => $u->is_admin,
                'entradas_count'  => $u->entradas_count,
                'reservas_count'  => $u->reservas_count,
                'created_at'      => $u->created_at?->format('d/m/Y'),
            ]);

        return response()->json(['data' => $users]);
    }

    /**
     * Detalle de un usuario
     */
    public function show($id)
    {
        $user = User::with([
            'entradas.evento',
            'reservas' => function ($q) {
                $q->where('estado', 'bloqueado')
                  ->where('reservado_hasta', '>', now())
                  ->with(['evento', 'asiento.sector']);
            }
        ])->findOrFail($id);

        return response()->json([
            'data' => [
                'id'       => $user->id,
                'nombre'   => $user->nombre,
                'apellido' => $user->apellido,
                'email'    => $user->email,
                'is_admin' => $user->is_admin,
                'created_at' => $user->created_at?->format('d/m/Y'),
                'entradas' => $user->entradas->map(fn($e) => [
                    'id'         => $e->id,
                    'evento'     => [
                        'id'     => $e->evento->id,
                        'nombre' => $e->evento->nombre,
                        'fecha' => $e->evento->fecha?->format('d/m/Y'),
                    ],
                    'created_at' => $e->created_at?->format('d/m/Y'),
                ]),
                'reservas_activas' => $user->reservas->map(fn($r) => [
                    'id'     => $r->id,
                    'evento' => [
                        'id'     => $r->evento->id,
                        'nombre' => $r->evento->nombre,
                        'fecha'  => $r->evento->fecha,
                    ],
                    'asiento' => [
                        'fila'   => $r->asiento->fila,
                        'numero' => $r->asiento->numero,
                        'sector' => $r->asiento->sector->nombre ?? '',
                    ],
                    'reservado_hasta' => $r->reservado_hasta?->format('H:i'),
                ]),
            ]
        ]);
    }

    /**
     * Editar datos de un usuario
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'nombre'   => 'sometimes|string|max:255',
            'apellido' => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($data);

        return response()->json([
            'data'    => $user,
            'message' => 'Usuario actualizado correctamente',
        ]);
    }
}