# 08.12.2025
- `docker-compose.yml` erstellt
- Projektordner erstellt: `mkdir backend frontend`
- NestJS-Projekt als Backend initialisiert: `docker run -it --rm -w /app -v ./backend:/app node:24.11 npx @nestjs/cli new .`
    - Installation mit Standardeinstellungen
- Next.JS-Projekt aös Frontend initialisiert: `docker run -it --rm -w /app -v ${PWD}/frontend:/app node:24.11 npx create-next-app@latest .`
    - Installation mit Standardeinstellungen
- Dateirechte auf meinen Nutzer übertragen: `sudo chown -R leonf:leonf backend frontend`
- Den Standard .git Ordner aus dem NestJS-Backend-Ordner gelöscht: `rm -r backend/.git`
- Docker-Container gestartet: `docker compose up -d`
- Neues Git-Repo im Projektroot initialisert:
    ```
    git init
    git add .
    git commit -m "initial commit"
    ```
- Auf Probleme bei der Prisma-Integration in NestJS gestoßen, da es kürzlich einen neuen Major-Release in Prisma gab (v7)

# 09.12.2025
- Prisma gefixt und Standardconfig in NestJS implementiert
    - `docker exec -it iu-bachelor-thesis-backend npm install prisma --save-dev`
    - `docker exec -it iu-bachelor-thesis-backend npm install @prisma/client @prisma/adapter-mariadb`
    - `docker exec -it iu-bachelor-thesis-backend npx prisma init`
    - `.env` und `schema.prisma` konfiguriert
    - `docker exec -it iu-bachelor-thesis-backend npx prisma migrate dev --name init`
    - `docker exec -it iu-bachelor-thesis-backend npx prisma generate`
- Prisma Service und Module generiert:
    - `docker exec -it iu-bachelor-thesis-backend npx nest g module prisma`
    - `docker exec -it iu-bachelor-thesis-backend npx nest g service prisma`
- 
# 10.12.2025
- Auth Resource generiert: `docker exec -it iu-bachelor-thesis-backend npx nest g resource auth`
    - `> REST API`
    - `> CRUD generation? yes`
- Installed config module `docker exec -it iu-bachelor-thesis-backend npm install @nestjs/config` to enable .env file support
- app.module.ts angepasst, um ConfigModule zu importieren und zu initialisieren
- Installieren von `docker exec -it iu-bachelor-thesis-backend npm install class-validator class-transformer`
Um DTOs zu validieren, wurden die entsprechenden Pipes in main.ts hinzugefügt.

- Installieren von argon2 für Umgebungsvariablen-Validierung: `docker exec -it iu-bachelor-thesis-backend npm install argon2`
- Installieren von jwt `docker exec -it iu-bachelor-thesis-backend npm install @nestjs/jwt passport @nestjs/passport passport-jwt`
- `docker exec -it iu-bachelor-thesis-backend npm install @types/passport-jwt --save-dev`

Schutz vor Brute-Force-Angriffen durch Ratenbegrenzung mit
docker exec -it iu-bachelor-thesis-backend npm install @nestjs/throttler


Frontend
docker exec -it iu-bachelor-thesis-frontend npm install @heroicons/react
docker exec -it iu-bachelor-thesis-frontend npm install react-qr-code
