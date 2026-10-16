# Stall Abenteuerhof · v1.23.0

Diese Version ist die Sicherheits- und Berechtigungsrunde auf Basis von v1.22.2.

## Was v1.23.0 verbessert

- **Least Privilege:** Neue Team-Zugänge starten ohne sensible Bereiche. Ein Admin gibt anschließend nur die benötigten Rechte frei.
- **Mehrere Ponygruppen-Freigaben pro Person:** Jede Gruppe kann dauerhaft oder mit einem eigenen Zeitraum freigegeben werden. Dadurch ist z. B. „Mi 1 dauerhaft + Di 2 nur am 20.10.“ möglich.
- **Stabile Zugriffsprofile:** Berechtigungen erhalten interne IDs und hängen nicht ausschließlich am sichtbaren Namen.
- **Serverseitige Rechteprüfung:** Laden, Speichern und Löschen werden anhand des aktuellen Profils geprüft. UI-Ausblenden allein gilt nicht als Schutz.
- **Access-Audit:** Änderungen an Zugängen werden in `access_audit` protokolliert.
- **Sicherere parallele Änderungen:** Profiländerungen werden mit `LockService` serialisiert.
- **Login-Schutz:** Wiederholte Fehlversuche werden zeitweise begrenzt.
- **Private Anhänge:** Neue Dateien erhalten keine öffentliche Linkfreigabe mehr. Die App lädt Medien über einen authentifizierten Backend-Endpunkt.
- **Offline-Isolation:** Offline-Daten werden zusätzlich an die konkrete Person und den Berechtigungsstand gebunden.
- **Datenschutz:** Google Fonts wurden aus der App entfernt; es werden Systemschriften verwendet.
- **Selbsttests:** `AccessControlTests.gs` enthält nicht-destruktive Tests der wichtigsten Berechtigungsfälle.

## 1. GitHub Pages aktualisieren

Im bisherigen GitHub-Pages-Ordner diese Dateien hochladen bzw. ersetzen:

- `index.html`
- `access-v122.js`
- `access-v122.css`
- `sw.js`
- `version.json`

Der Dateiname `access-v122.*` bleibt absichtlich bestehen, damit bestehende Deployments/Links nicht unnötig brechen. Der Inhalt ist v1.23.0.

`helfi.html`, `manifest.webmanifest`, Icons und OneSignal-Worker bleiben wie bisher bestehen.

Nach dem Upload sollte unter Einstellungen **Version 1.23.0 · 16.10.2026** stehen. Wenn noch eine ältere Version erscheint: App einmal vollständig neu laden bzw. schließen/öffnen; der neue Service-Worker verwendet den Cache `v1230`.

## 2. Google Apps Script aktualisieren

Die `.gs`-Dateien gehören **nicht nur nach GitHub**. Für die echte serverseitige Absicherung müssen sie im bestehenden Google-Apps-Script-Projekt liegen.

- `Code.gs` ersetzt dort die bisherige Router-/Daten-Datei.
- `AccessControl.gs` als eigene Script-Datei hinzufügen bzw. die vorherige AccessControl-Version ersetzen.
- `AccessControlTests.gs` als zusätzliche Script-Datei hinzufügen (empfohlen).
- Alle übrigen vorhandenen Script-Dateien für Login/Auth, Push, Helfi usw. beibehalten.

Anschließend eine **neue Web-App-Version bereitstellen/deployen**, damit die veröffentlichte App die neue Backend-Logik tatsächlich verwendet.

## 3. Einmalig nach dem Backend-Deployment

Als Admin in der App:

1. **Einstellungen → Logins & Zugänge** öffnen.
2. Im Sicherheitsbereich **„Bestehende Anhänge schützen“** einmal ausführen. Damit versucht das Backend, ältere Dateien mit früherer Linkfreigabe wieder privat zu machen.
3. Danach **„Berechtigungsprotokoll anzeigen“** öffnen und prüfen, ob der Vorgang/weitere Änderungen nachvollziehbar erscheinen.

Neue Uploads werden bereits ohne öffentliche Linkfreigabe angelegt.

## 4. Rechte testen

Bitte einmal mit Testkonten durchspielen, bevor echte Arbeit darüber läuft:

### Eingeschränktes Team

Neuen Team-Zugang anlegen. Er muss zunächst **keinen sensiblen Zugriff** haben. Danach z. B. nur freigeben:

- Ponys & Aktivitäten → Bearbeiten
- Kontext → Bildungsprojekt
- Gesundheit → kein Zugriff
- Stall → kein Zugriff
- Ponygruppen → kein Zugriff
- Aufgaben → kein Zugriff

Neu mit diesem Account anmelden. Nicht freigegebene Bereiche dürfen weder in der Navigation auftauchen noch per Backend geliefert/gespeichert werden.

### Mehrere Ponygruppen-Freigaben

Beispiel:

- Mi 1 → dauerhaft
- Di 2 → 20.10.2026 bis 20.10.2026

Am 20.10. ist Di 2 zusätzlich verfügbar, außerhalb dieses Datums nicht.

### Persönliches Ehrenamt

Ein persönlicher Ehrenamt-Zugang kann einzelne Ponygruppen-Termine für operative Mitarbeit erhalten. Der **gemeinsame Ehrenamt-Code gibt niemals persönliche Zusatzrechte** frei. Persönliches Ehrenamt darf insbesondere keine Gruppen-Stammlisten, Leitung oder Terminstruktur verwalten.

## 5. Backend-Selbsttest

Im Apps-Script-Editor die Funktion

`testAccessControlV123`

aus `AccessControlTests.gs` ausführen. Erwartet werden **8 erfolgreiche Tests**. Die Tests verändern keine Produktivdaten.

## 6. Noch ein offener Security-Punkt

Die von AccessControl verwendeten ursprünglichen Login-Funktionen liegen in einer anderen bestehenden Apps-Script-Datei, die in diesem Paket nicht enthalten war, u. a.:

- `serverAuthenticateTeam`
- `serverDescribeTeamSession`
- `serverAdminAddTeamUser`
- `serverAdminUpdateTeamUser`
- `serverAdminRemoveTeamUser`
- `serverAuthenticateVolunteer`

v1.23.0 legt Rate-Limiting und die neue Rechteprüfung **um diese vorhandenen Funktionen herum**. Ich konnte aber ohne diese Quelldatei nicht verifizieren, ob persönliche PINs dort gehasht/gesalzen gespeichert werden, wie Tokens serverseitig erzeugt und widerrufen werden und ob dort weitere Altlogik liegt.

Für maximalen Sicherheitsstandard sollte diese Auth-Datei als nächstes ebenfalls geprüft werden. Das ist kein Grund, die neuen Berechtigungen wegzulassen, aber der verbleibende Teil, den dieses Paket allein nicht beweisen kann.

## 7. Datenschutz / externe Dienste

Google Fonts werden nicht mehr extern geladen. OneSignal bleibt für Push-Benachrichtigungen weiterhin Bestandteil der bestehenden App und sollte in eurer Datenschutzdokumentation entsprechend berücksichtigt bleiben.

## Hinweis zu KolliCloud / Excel

v1.23.0 verwendet weiterhin das vorhandene Google-Apps-Script-/Drive-Backend. Eine Umstellung auf KolliCloud/Nextcloud oder Microsoft/Excel wäre ein eigener Backend-Umbau; die Rechtearchitektur kann dabei grundsätzlich erhalten bleiben.
