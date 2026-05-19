FROM node:20-alpine

RUN npm install -g @angular/cli

WORKDIR /app

# Copiar dependencias primero (mejor caché)
COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 4200

# --host 0.0.0.0 es obligatorio para que sea accesible desde fuera del contenedor
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]
