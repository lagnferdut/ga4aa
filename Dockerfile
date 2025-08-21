# --- ETAP 1: Budowanie aplikacji ---
FROM node:20-slim AS builder

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package.json i instalacja wszystkich zależności
COPY package*.json ./
RUN npm install

# Kopiowanie reszty kodu aplikacji
COPY . .

# Uruchomienie skryptu budującego, który tworzy folder /dist
RUN npm run build


# --- ETAP 2: Serwowanie zbudowanych plików ---
FROM nginx:stable-alpine

# Kopiowanie zoptymalizowanych plików z etapu budowania do folderu serwera Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Informacja, że serwer będzie działał na porcie 80
EXPOSE 80

# Komenda uruchamiająca serwer Nginx
CMD ["nginx", "-g", "daemon off;"]