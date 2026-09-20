STALL ABENTEUERHOF · v1.9.1 · Gesundheitspush-Auswahl

Neu:
- Gesundheit: Art des Eintrags auswählbar:
  Beobachtung / Tierarzt / Hufpflege / Osteopathie / Behandlung / Sonstiges.
- Bei Tierarzt, Hufpflege und Osteopathie kann die Fachperson/Praxis angegeben werden
  (z. B. Nadine).
- Der eigentliche Befund / was gemacht wurde bleibt als ausführliche Notiz dokumentiert.
- Bei neuen Ehrenamt-Gesundheitseinträgen kann gewählt werden:
  „Nur Pferdeteam“ oder „Alle App-Nutzer:innen“ mit aktiviertem Gesundheits-Push.
- Die Voreinstellung ist „Nur Pferdeteam“.
- Beide Push-Varianten enthalten ausschließlich neutrale Texte, keine Gesundheitsdetails.
- Pferdeteam-Einträge verhalten sich beim Push wie bisher.
- Missverständliche Formulierung „Team-Einträge sind intern …“ wurde entfernt.
- Alte Gesundheitseinträge bleiben vollständig kompatibel.

Deployment:
GITHUB:
- index.html ersetzen
- sw.js ersetzen
- version.json ersetzen
- manifest.webmanifest kann ebenfalls aus diesem Paket genommen werden
- OneSignal-Worker bleibt gleich

APPS SCRIPT:
- index.html und Push_OneSignal_v1_9_1_gesundheit.gs enthalten die neue Empfängerauswahl.
- Code.gs und Auth.gs sind identisch zu v1.8 und liegen nur der Vollständigkeit halber bei.
- Push-Datei ersetzen, speichern und neue Web-App-Version bereitstellen.

Test:
1. Als Ehrenamt ein Gesundheitsupdate anlegen.
2. „Benachrichtigung senden“ aktiviert lassen.
3. „Nur Pferdeteam“ wählen und prüfen, dass nur gültige Pferdeteam-Geräte mit
   aktiviertem Gesundheits-Push die neutrale Meldung erhalten.
4. „Alle App-Nutzer:innen“ wählen und prüfen, dass alle aktiven Geräte mit
   aktiviertem Gesundheits-Push die neutrale Meldung erhalten.
5. Tierarzt/Hufpflege/Osteopathie auswählen und prüfen, ob Fachperson + Info
   im Gesundheitsverlauf erscheinen.
