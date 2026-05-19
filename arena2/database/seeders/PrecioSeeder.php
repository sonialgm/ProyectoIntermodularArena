<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\Sector;
use App\Models\Precio;
use Illuminate\Database\Seeder;

class PrecioSeeder extends Seeder
{
    public function run(): void
    {
        $eventos = Evento::all();
        $sectores = Sector::all();

        $precios = [];
        $totalPrecios = 0;
        $now = now();

        foreach ($eventos as $evento) {
            foreach ($sectores as $sector) {

                $precio = $this->calcularPrecio($evento, $sector);

                $precios[] = [
                    'evento_id' => $evento->id,
                    'sector_id' => $sector->id,
                    'precio' => $precio,
                    'disponible' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $totalPrecios++;
            }
        }

        Precio::insert($precios);

        $this->command->info("✅ Precios creados: {$totalPrecios}");
    }

    private function calcularPrecio(Evento $evento, Sector $sector): float
    {
        $precioBase = match(true) {
            str_starts_with($sector->nombre, 'Palco') => 150.00,
            $sector->nombre === 'FRONT STAGE' => 120.00,
            $sector->nombre === 'CLUB' => 100.00,
            $sector->nombre === 'JOHNNIE WALKER' => 90.00,
            $sector->nombre === 'PISTA' => 80.00,
            str_starts_with($sector->nombre, 'Sector 10') => 50.00,
            str_starts_with($sector->nombre, 'Sector 30') => 40.00,
            default => 50.00,
        };

        $multiplicador = match($evento->nombre) {
            'Final Copa del Rey' => 1.5,
            'Concierto Rock 2026' => 1.3,
            'Festival Electrónica' => 1.2,
            default => 1.0,
        };

        return round($precioBase * $multiplicador, 2);
    }
}