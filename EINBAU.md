# Helfi-Wochenplan v1.14.0 einrichten

Dieses Paket baut auf v1.13.0 auf. Neu sind vor allem der **echte automatische Wechselrhythmus**, die Berücksichtigung von **Ferien/Feiertagen/Absagen/Terminverschiebungen**, der **schnellere App-Start aus einer rollengetrennten Offline-Kopie** und die klarere Formulierung des Felds für Unterstützungsbedarf in den Ponygruppenlisten.

## 1. Apps-Script-Dateien aktualisieren

Im **bestehenden** Apps-Script-Projekt weiterarbeiten. Die vorhandene Google-Tabelle, Web-App-Adresse, Pferdeteam-Konten und OneSignal-Einstellungen bleiben bestehen.

Bestehende Dateien ersetzen:

- `Code.gs` durch `Code_v1_9.gs`
- die vorhandene Auth-Datei durch `Auth_v1_9.gs`
- die vorhandene OneSignal-/Push-Datei durch `Push_OneSignal_v1_9_1_gesundheit.gs`
- die vorhandene Push-Router-/Helper-Datei durch `Push_Router_Helper.gs`
- die bisherige Helfi-Datei durch `Helfi_Kalender_v1_12.gs`

Keine zweite Kopie derselben Serverfunktionen daneben anlegen. Der Dateiname `Helfi_Kalender_v1_12.gs` bleibt nur aus Kompatibilitätsgründen bestehen; der Inhalt ist v1.14.0.

## 2. Skripteigenschaften prüfen

Unter **Projekteinstellungen → Skripteigenschaften** prüfen:

| Eigenschaft | Wert |
|---|---|
| `HELFI_INVITE_TOKEN` | optionaler zufälliger geheimer Schlüssel mit mindestens 16 Zeichen; wenn er fehlt, erzeugt **Ponygruppen → Helfi-Plan** beim ersten Laden automatisch einen |
| `PONY_VOLUNTEER_ACCESS_CODE` | anderer zufälliger Code für den Ehrenamt-Zugang der Stall-App |
| `HELFI_PRIVACY_URL` | vollständige HTTPS-Adresse eurer Datenschutzhinweise |

Optional, aber für eine saubere Speicherbegrenzung empfohlen:

| Eigenschaft | Wert |
|---|---|
| `HELFI_RETENTION_DAYS` | vereinbarte Frist für terminbezogene Helfi-Abmeldungen/Vertretungen, technisch 30–730 Tage, z. B. `180` |

Einladungs-Schlüssel und Ehrenamt-Code müssen unterschiedlich sein und gehören nicht in öffentliches HTML, GitHub oder die Datenschutzhinweise.

Falls aus einer älteren Version noch `HELFI_ACCESS_CODE` vorhanden ist, kann die Eigenschaft zunächst stehen bleiben. Solange noch kein `HELFI_INVITE_TOKEN` existiert, dient der alte Wert nur als Übergang für den ersten Einladungslink. Nach **Link erneuern** ist er für den Helfi-Kalender ohne Bedeutung.

`PONY_HELFI_COORDINATORS` aus v1.12 kann gelöscht werden; die Eigenschaft wird für den Helfi-Plan nicht mehr verwendet.

## 3. Web-App neu bereitstellen

**Bereitstellen → Bereitstellungen verwalten → bestehende Web-App bearbeiten → Neue Version → Bereitstellen.**

Die bisherige Web-App-Adresse beibehalten. Backend und Frontend zusammen aktualisieren.

Alte weiterhin aktive Web-App-Bereitstellungen prüfen und stilllegen, wenn sie noch ungeschützte Datenzugriffe erlauben. Das Aktualisieren einer Bereitstellung ändert andere Bereitstellungen nicht automatisch.

## 4. GitHub Pages aktualisieren

Im bisherigen Stammordner ersetzen:

- `index.html`
- `helfi.html`
- `sw.js`
- `version.json`

Manifest und Icons bleiben unverändert.

Helfis bekommen nicht einfach die öffentliche Adresse von `helfi.html`, sondern den im Pferdeteam-Bereich erzeugten geschützten Einladungslink.

## 5. Helfi-Plan öffnen

Mit einem normalen persönlichen Pferdeteam-Login:

**Ponygruppen → Helfi-Plan**

Es gibt keine zusätzliche Helfi-Plan-Berechtigung. Wer als Pferdeteam den Ponygruppen-Bereich nutzen kann, kann auch den Helfi-Plan laden und bearbeiten.

Ab Donnerstag öffnet die Verwaltung automatisch die kommende Ponygruppenwoche. Montag bis Mittwoch bleibt die laufende Woche voreingestellt.

## 6. Fairen Grundrhythmus anlegen

1. Woche auswählen, ab der die Einteilung gelten soll.
2. **Plan laden**.
3. Pro Gruppe Uhrzeit und **alle Helfis, die zu dieser Gruppe gehören**, mit Komma getrennt eintragen.
4. Speichern.

Sind höchstens so viele Helfis eingetragen wie Plätze vorhanden sind, sind diese Personen jede Woche eingeplant.

Sind mehr Helfis eingetragen als Plätze, erzeugt das Backend automatisch einen fairen wiederkehrenden Zyklus. Beispiel bei 5 Helfis und 2 Plätzen:

- Woche 1: A + B
- Woche 2: C + D
- Woche 3: E + A
- Woche 4: B + C
- Woche 5: D + E

Danach beginnt der Rhythmus wieder von vorn. Die Verteilung ist so gewählt, dass über einen vollständigen Zyklus alle gleich oft eingeplant werden.

Vergangene Wochen können nicht nachträglich durch eine neue Planversion überschrieben werden. Eine spätere Planversion wirkt erst ab der gewählten Woche.

## 7. Einzelne Absage und Vertretung

Wenn eine Person in einer bestimmten Woche eingeplant ist und einmal nicht kann:

1. Im Helfi-Kalender den eigenen Namen eingeben.
2. Beim eigenen Termin **Ich kann nicht** wählen.
3. Nur dieser einzelne Termin wird frei.
4. Eine andere Helfi-Person kann **Übernehmen** wählen.
5. Der normale Rotationsrhythmus der folgenden Wochen bleibt unverändert.

Es gibt kein Feld für einen Abmeldegrund.

## 8. Ferien, Feiertage und Ponygruppen-Terminänderungen

Der Helfi-Kalender liest zusätzlich die für Ponygruppen relevanten Terminangaben aus dem bestehenden `data`-Reiter:

- `customFerienWeeks`
- `ponygroup:schedule:<gruppe>:<datum>`

Damit werden benutzerdefinierte Ferienwochen sowie in **Ponygruppen** gespeicherte Absagen und Verschiebungen automatisch übernommen.

Zusätzlich enthält das Helfi-Backend dieselbe statische BaWü-Schulferienbasis wie die Stall-App und berechnet die gesetzlichen Feiertage in Baden-Württemberg. In diesem Paket ist die Schulferienbasis bis einschließlich Sommerferien 2027 aktualisiert; danach muss die statische Liste weiterhin jährlich gemeinsam aktualisiert werden.

Eine ausdrücklich gespeicherte Terminverschiebung hat Vorrang vor der normalen Ferien-/Feiertagsregel und wird im Helfi-Kalender mit dem neuen Datum angezeigt.

## 9. Mitarbeitende nicht als Helfis eintragen

Aktive Namen aus den persönlichen Pferdeteam-Zugängen werden serverseitig als Team/Mitarbeitende erkannt und nicht als Helfis in einem Grundplan akzeptiert. Zusätzlich bleibt `Moritz` als Altbestandsschutz ausgeschlossen, damit alte Daten aus früheren Versionen nicht wieder als Helfi zählen.

## 10. Schneller App-Start

Auf Geräten mit bereits vorhandener Offline-Kopie erscheint die zuletzt gespeicherte Ansicht sofort; der Abruf von Google läuft danach im Hintergrund. Die Offline-Kopien sind nach **Pferdeteam** und **Ehrenamt** getrennt.

Beim Update aus älteren Versionen wird eine alte ungetrennte Offline-Kopie für einen Ehrenamt-Zugang gefiltert, sodass Ponygruppen-, To-do- und andere serverseitig geschützte Teamdaten nicht in dessen Ansicht wiederhergestellt werden.

## 11. Unterstützungsbedarf in Ponygruppenlisten

Das vorhandene Notizfeld wurde klarer benannt:

**Unterstützungsbedarf / organisatorischer Hinweis**

Dort möglichst nur kurze, für die konkrete Betreuung notwendige und handlungsbezogene Hinweise speichern, etwa „braucht Unterstützung beim Aufsteigen“ oder „feste Bezugsperson hilfreich“. Diagnosen, Medikamente und ausführliche Krankheitsgeschichten gehören nicht in dieses allgemeine Listenfeld.

Das ist eine technische/organisatorische Datenminimierung und ersetzt keine Prüfung eurer Rechtsgrundlage für tatsächlich benötigte sensible Daten.

## 12. Praxisprüfung vor Freigabe

Mit getrennten Browsern testen:

### Browser A · Pferdeteam
- **Ponygruppen → Helfi-Plan** öffnen.
- Eine Gruppe mit mehr Namen als Plätzen eintragen, z. B. fünf Namen bei zwei Plätzen.
- mehrere Folgewochen im Helfi-Kalender öffnen und prüfen, dass die Paarungen rotieren.
- Einladungslink kopieren.

### Browser B · Helfi
- Einladungslink öffnen; keine Code-Abfrage darf erscheinen.
- prüfen, dass nur der Helfi-Kalender sichtbar ist.
- in einer Woche mit eigener Einteilung **Ich kann nicht** wählen.

### Browser C · anderer Helfi
- den freigewordenen Platz übernehmen.
- prüfen, dass spätere Wochen des Rotationsplans unverändert bleiben.

Zusätzlich testen:

- eine Ponygruppe in der Stall-App absagen → im Helfi-Kalender muss sie als ausfallend erscheinen;
- eine Ponygruppe verschieben → das neue Datum muss im Helfi-Kalender erscheinen;
- eine Ferienwoche → keine normalen Helfi-Aktionen für die betroffenen Gruppen;
- **Link erneuern** → alter Link und alte Helfi-Sitzung müssen anschließend abgewiesen werden;
- als Ehrenamt anmelden → Ponygruppenlisten dürfen nicht aus einer früheren Pferdeteam-Offline-Kopie auftauchen.

## 13. Tabellenreiter

Bei Bedarf entstehen automatisch:

- `Helfi_Wochenplan` für versionierte Grundpläne/Rotationspools
- `Helfi_Kalender` für einzelne Abmeldungen und Vertretungen

Die Helfi-Reiter sind nicht Teil des allgemeinen Key/Value-Datenabrufs der Stall-App.

## 14. Datenschutz

Vor dem Regelbetrieb `DATENSCHUTZ.md` durchgehen und eure tatsächlichen Datenschutzhinweise vervollständigen. Besonders wichtig bleiben berechtigter Personenkreis, Rechtsgrundlage, Aufbewahrungsfristen, eingesetzte Google-Dienste/Verträge und der Umgang mit besonders sensiblen Angaben.
