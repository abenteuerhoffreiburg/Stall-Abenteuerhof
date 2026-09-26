STALL ABENTEUERHOF · Version 1.14.0 · 26.09.2026
Basis: v1.13.0

HELFI-PLAN MIT ECHTEM WECHSELRHYTHMUS

Der Helfi-Plan löst jetzt auch den Fall „mehr Helfis als Plätze“ automatisch.
Im Pferdeteam werden pro Gruppe einfach alle Helfis eingetragen. Sind mehr Namen
vorhanden als Plätze, verteilt das System die Einsätze gleichmäßig über einen
wiederkehrenden Wochenzyklus.

Beispiel: 5 Helfis / 2 Plätze
Woche 1: A + B
Woche 2: C + D
Woche 3: E + A
Woche 4: B + C
Woche 5: D + E
Danach beginnt der Rhythmus wieder von vorn. Jede Person kommt in fünf Wochen
genau zweimal dran.

ABSAGEN UND VERTRETUNGEN

Eine fest für die jeweilige Woche eingeplante Person kann nur diesen einzelnen
Termin mit „Ich kann nicht“ freigeben. Eine andere Helfi-Person kann genau diesen
Platz übernehmen. Die Rotation der kommenden Wochen verändert sich dadurch nicht.
Bestehende Zusagen werden bei späteren Planänderungen weiterhin auf Konflikte
geprüft.

FERIEN, FEIERTAGE UND TERMINÄNDERUNGEN

Der Helfi-Kalender berücksichtigt nun:
- die in der Stall-App hinterlegten benutzerdefinierten Ferienwochen,
- die in der App hinterlegte BaWü-Schulferienbasis,
- gesetzliche Feiertage in Baden-Württemberg,
- in Ponygruppen gespeicherte Absagen,
- in Ponygruppen gespeicherte Terminverschiebungen.

Eine ausdrücklich verschobene Ponygruppe wird am neuen Datum angezeigt. Ein
abgesagter oder regulär in Ferien/auf einen Feiertag fallender Termin kann nicht
von Helfis verändert oder übernommen werden.

WICHTIG: Die statische Schulferienbasis ist in diesem Paket bis einschließlich
Sommerferien 2027 aktualisiert und muss danach wie bisher jährlich gemeinsam in
App und Helfi-Backend aktualisiert werden. Benutzerdefinierte Ferienwochen werden
automatisch mitgenutzt.

MITARBEITENDE

Aktive Personen mit Pferdeteam-Zugang werden nicht als Helfis in den Grundplan
aufgenommen. Der frühere Sonderfall Moritz bleibt zusätzlich als Altbestandsschutz
ausgeschlossen. Frühere Moritz-Helfi-Einträge werden nicht mitgezählt.

ZUGANG DER HELFIS

Helfis brauchen keinen Code. Sie erhalten den geschützten Einladungslink aus
Ponygruppen → Helfi-Plan und landen ausschließlich in helfi.html. Der Link gibt
keinen Zugriff auf die Stall-App, Kinderlisten oder andere interne Daten. Das
Pferdeteam kann den Link erneuern; alte Links und bestehende Helfi-Sitzungen werden
anschließend ungültig.

SCHNELLER APP-START

Wenn auf dem Gerät bereits eine passende Offline-Kopie vorhanden ist, zeigt die
Stall-App diese jetzt sofort und aktualisiert die Google-Daten im Hintergrund.
Offline-Kopien sind nach Rolle getrennt. Ponygruppen-/Teamdaten werden nicht aus
einer alten Team-Kopie in den Ehrenamt-Bereich wiederhergestellt.

PONYGRUPPENLISTEN / DATENMINIMIERUNG

Das Feld in den Namenslisten heißt nun „Unterstützungsbedarf / organisatorischer
Hinweis“. Es ist für kurze, für die konkrete Betreuung notwendige und möglichst
handlungsbezogene Angaben gedacht. Diagnosen, Medikamente oder ausführliche
Krankheitsgeschichten sollen nicht in dieses allgemeine Listenfeld eingetragen
werden.

EINBAU

Siehe EINBAU.md. Backend und Frontend müssen gemeinsam aktualisiert werden.
Die Backend-Datei heißt aus Kompatibilitätsgründen weiterhin
Helfi_Kalender_v1_12.gs; ihr Inhalt ist für v1.14.0 aktualisiert.

PRÜFUNG

Lokale Syntax-, Struktur- und Ablaufprüfungen wurden mit künstlichen Daten
ausgeführt. Es wurden keine echten Tabellen verändert, keine echten Pushs
versendet und nichts veröffentlicht. Die Live-Bereitstellung und die tatsächlichen
Google-/Datenschutz-Einstellungen müssen vor dem Regelbetrieb separat geprüft werden.
