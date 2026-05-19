<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContactoController;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/contacto/enviar', [ContactoController::class, 'enviar']);
Route::get('/contacto/mis-consultas', [ContactoController::class, 'misConsultas']);
Route::post('/contacto/limpiar', [ContactoController::class, 'limpiar']);
