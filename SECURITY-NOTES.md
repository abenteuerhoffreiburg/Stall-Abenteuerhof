# Security Notes · Stall Abenteuerhof v1.23.0

## Implementiert

- Personenspezifische Team-Berechtigungen
- Persönliche Ehrenamt-Zugänge für begrenzte Ponygruppenrechte
- Serverseitige Read-/Write-Prüfung
- Least Privilege für neu angelegte Teamkonten
- Unabhängige, zeitlich begrenzbare Ponygruppen-Grants
- Stabile Access-Profile-IDs
- Audit-Log für Zugriffsänderungen
- Script-Lock bei Access-Profiländerungen
- Rate-Limit für wiederholte Login-Fehlversuche
- Keine neue öffentliche Drive-Linkfreigabe bei Uploads
- Authentifizierte Medienauslieferung
- Account-/Berechtigungsgebundener Offline-Cache
- Entfernung externer Google Fonts
- Nicht-destruktive Permission-Selbsttests

## Vor Produktivfreigabe prüfen

1. `testAccessControlV123` im Apps-Script-Editor ausführen (8/8 erwartet).
2. Web-App neu deployen.
3. Bestehende Anhänge über die Admin-Funktion härten.
4. Testaccount ohne Rechte: keine sensiblen Daten sichtbar/abrufbar/schreibbar.
5. Testaccount mit nur einem Aktivitätskontext: fremde Kontexte nicht les-/schreibbar.
6. Ponygruppen-Grant außerhalb des Zeitraums: Server verweigert Zugriff.
7. Persönliches Ehrenamt: keine Roster-/Schedule-/Leitungsänderung möglich.
8. Offline-Änderung nach Rechteentzug: Backend muss Sync verweigern.
9. Alte öffentliche Medienlinks prüfen und ggf. manuell bereinigen, falls die automatische Härtung Fehler meldet.

## Noch zu auditieren

Die ursprüngliche Auth-/Token-Datei war nicht Bestandteil der gelieferten Quellbasis. Deshalb noch separat prüfen:

- PIN-Hashing und Salt
- Token-Entropie
- serverseitige Token-Ablaufzeit
- sofortige Invalidierung nach Accountentzug/PIN-Änderung
- Rate-Limit/Lockout-Zusammenspiel der alten Login-Funktionen
- keine PINs/Token in Logs oder Tabellen
