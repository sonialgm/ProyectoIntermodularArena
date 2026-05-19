<?php

namespace App\Console\Commands;

use App\Services\LiberarReservasService;
use Illuminate\Console\Command;

class LiberarReservasExpiradas extends Command
{
    protected $signature = 'reservas:liberar';
    protected $description = 'Liberar reservas expiradas automáticamente';

    public function handle(LiberarReservasService $service)
    {
        $count = $service->liberarExpiradas();
        
        $this->info("Se liberaron {$count} reservas expiradas");
        
        return 0;
    }
}