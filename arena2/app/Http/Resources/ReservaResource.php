<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'evento' => [
                'id' => $this->evento->id,
                'nombre' => $this->evento->nombre,
                'fecha' => $this->evento->fecha->format('d/m/Y'),
                'hora' => $this->evento->hora
                    ? $this->evento->hora->format('H:i')
                    : null,
            ],

            'asiento' => [
                'id' => $this->asiento->id,

                'fila' => $this->asiento->fila,
                'numero' => $this->asiento->numero,

                'sector' => $this->asiento->sector->nombre,
            ],

            'precio' => $this->evento
                ->precioDelSector($this->asiento->sector_id)?->precio ?? 0,

            'estado' => $this->estado,

            'tiempo_restante_minutos' => $this->tiempoRestante(),

            'expira_en' => $this->reservado_hasta
                ? $this->reservado_hasta->format('d/m/Y H:i:s')
                : null,

            'expirado' => $this->haExpirado(),
        ];
    }
}