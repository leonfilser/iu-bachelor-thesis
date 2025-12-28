# REST Schnittstellen
## Authentifizierung
- `POST /auth/register`: Registriert einen neuen Benutzer. (email, password, displayName)
- `POST /auth/login`: Authentifiziert einen Benutzer und gibt ein JWT zurück. (email, password)
- `POST /auth/refresh`: Erneuert das JWT, wenn ein gültiges Refresh Token vorliegt.
- `POST /auth/logout`: Meldet den Benutzer ab und invalidiert das Refresh Token.
- `GET /auth/me`: Holt die eigenen Benutzerdaten.
- `PATCH /auth/me`: Aktualisiert die eigenen Benutzerdaten. (email, password, displayName)
- `DELETE /auth/me`: Löscht den eigenen Benutzer.
- `GET /auth/link-code`: Generiert einen Kurzcode für die Kontoverknüpfung.
- `POST /auth/quickcode`: Authentifiziert einen Benutzer mit einem Kurzcode.
