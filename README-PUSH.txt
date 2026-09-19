Stall Abenteuerhof – Build mit echten Push-Benachrichtigungen

GitHub-Dateien:
- index.html
- sw.js
- manifest.webmanifest
- icon-192.png
- icon-512.png
- onesignal/OneSignalSDKWorker.js

Apps-Script-Dateien (NICHT nach GitHub als Geheimnis-Konfiguration nötig; die Dateien
enthalten keine Keys):
- Push_OneSignal.gs
- Push_Router_Helper.gs

Die OneSignal App API Key gehört ausschließlich in Apps Script > Script Properties,
niemals in index.html oder GitHub.

Alle Installationsschritte stehen in PUSH-BACKEND-INTEGRATION.txt.


AKTUELLE PUSH-LOGIK:
- nur Allgemeine Infos, Gesundheit und To-dos
- bei jedem neuen Info-/Gesundheitseintrag kann „Benachrichtigung senden“ an/aus gewählt werden
- bei To-dos kann die Push-Erinnerung bei Fälligkeit an/aus gewählt werden
- Ponygruppen- und Stalldienst-Pushs sind deaktiviert
