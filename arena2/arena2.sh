#!/bin/bash

# Configuración de colores para mejor legibilidad (Verbose mode)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Iniciando proceso de reinicio del entorno Arena...${NC}\n"

# 1. Acceder al directorio del proyecto
# Usamos -e para que el script se detenga si hay errores
cd arena2 || { echo "Error: No se pudo encontrar la carpeta 'arena2'"; exit 1; }

# 2. Detener y limpiar contenedores (down)
# El flag -v elimina los volúmenes (limpia la base de datos por completo)
echo -e "${YELLOW}[1/5] Deteniendo contenedores y limpiando volúmenes...${NC}"
./vendor/bin/sail down -v
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Contenedores detenidos y eliminados correctamente.${NC}\n"
else
    echo "Error al detener contenedores"; exit 1
fi

# 3. Iniciar contenedores en segundo plano (up -d)
echo -e "${YELLOW}[2/5] Levantando servicios en modo detach...${NC}"
./vendor/bin/sail up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Servicios iniciados.${NC}\n"
else
    echo "Error al iniciar Sail"; exit 1
fi

# 4. Esperar a que MySQL esté listo
# Es crucial esperar antes de migrar, ya que el contenedor sube pero el motor DB tarda unos segundos
echo -e "${YELLOW}[3/5] Esperando a que MySQL esté completamente listo...${NC}"
echo -n "Esperando"
for i in {1..30}; do
    echo -n "."
    sleep 1
done
echo ""
./vendor/bin/sail ps
echo -e "${GREEN}✔ Estado de los contenedores verificado.${NC}\n"

# 5. Ejecutar migraciones y seeders
# --fresh borra tablas existentes y --seed puebla los datos (Sectores, Asientos, etc.)
echo -e "${YELLOW}[4/5] Ejecutando migraciones y poblando base de datos...${NC}"
./vendor/bin/sail artisan migrate:fresh --seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Base de datos lista y poblada.${NC}\n"
else
    echo "Error en las migraciones"; exit 1
fi

# 6. Ejecutar tests de PHPUnit
# Verificamos que todo el sistema (Auth, Reservas, Compras) funcione tras el reset
echo -e "${YELLOW}[5/5] Ejecutando batería de tests...${NC}"
./vendor/bin/sail artisan test
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🚀 TODO CORRECTO: Entorno reiniciado, poblado y testeado con éxito.${NC}"
else
    echo -e "\n${YELLOW}⚠ Los servicios están arriba pero algunos tests han fallado.${NC}"
    exit 1
fi
