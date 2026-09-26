# Datenschutz vor der Freigabe · Helfi-Kalender v1.14.0

Die technische Zugriffstrennung und mehrere Maßnahmen zur Datenminimierung sind vorbereitet. Dieses Paket ist **keine rechtliche Bestätigung der DSGVO-Konformität**. Vor dem Regelbetrieb müssen eure tatsächlichen Datenschutzhinweise, Rechtsgrundlagen, Verträge, Zuständigkeiten und Aufbewahrungsfristen zu eurem konkreten Setup passen.

## Technisch umgesetzt

- Helfis nutzen ausschließlich `helfi.html`. Dort gibt es keine Navigation zur Stall-App, keine Kinderlisten, Gesundheitsdaten, To-dos, Ponygruppen-Dokumentation oder Einstellungen.
- Der geschützte gemeinsame Einladungslink gilt nur für den Helfi-Kalender und wird nicht als Pferdeteam- oder Ehrenamt-Zugang akzeptiert.
- Pferdeteam-Logins bleiben persönliche PIN-Zugänge.
- Die Verwaltung des Helfi-Plans gehört zum internen Bereich **Ponygruppen** und ist für gültig angemeldete Pferdeteam-Mitglieder verfügbar.
- Der Grundplan/Rotationspool liegt in `Helfi_Wochenplan`; einzelne Abmeldungen und Vertretungen liegen in `Helfi_Kalender`.
- Abmeldegründe werden weder abgefragt noch gespeichert.
- Die Geräte-Zuordnung wird serverseitig nur als Hash gespeichert.
- Helfi-Kalenderdaten werden nicht über den allgemeinen Stall-App-Datenabruf an Helfis ausgegeben.
- Die Helfi-Seite lädt keine Werbung, Analysewerkzeuge, Push-Dienste oder externen Schriftarten.
- Offline-Kopien der Stall-App sind ab v1.14.0 nach Pferdeteam/Ehrenamt getrennt. Teamgeschützte Ponygruppen-/To-do-Daten werden nicht aus einer alten Team-Kopie in den Ehrenamt-Bereich wiederhergestellt.

## Welche Daten im Helfi-System anfallen

### Grundplan und Rotation

Je Ponygruppe können gespeichert werden:

- Vorname oder vereinbartes Kürzel der Helfis im Rotationspool
- Gruppe
- Uhrzeit
- Woche, ab der die Planversion gilt
- technische Personen-ID innerhalb des Helfi-Plans
- Änderungszeit und Name des Pferdeteam-Mitglieds, das den Plan gespeichert hat

Wenn mehr Helfis als Plätze vorhanden sind, berechnet das System aus diesem Pool den Wochenrhythmus. Es werden dafür keine zusätzlichen persönlichen Daten benötigt.

### Einzelne Termine

Bei einer einzelnen Abmeldung oder Vertretung können gespeichert werden:

- reguläres Slot-Datum und Gruppe
- Name/Kürzel
- Status „für diesen Termin nicht dabei“ bzw. Vertretung
- Zuordnung zur betroffenen regulären Person
- technische Eintrags-ID und Änderungszeit
- gehashte Geräte-Zuordnung

**Nicht vorgesehen und nicht speichern:** Krankheitsgründe, Arzttermine, familiäre Gründe, Diagnosen oder andere Begründungen für eine Abmeldung.

Alle Personen mit gültigem Einladungslink können die für den Helfi-Kalender nötigen Helfi-Namen/Kürzel und Belegungen sehen. Den Link deshalb nur an den vorgesehenen Personenkreis weitergeben.

## Kinder- und Ponygruppenlisten in der Stall-App

Die internen Ponygruppenlisten sind **nicht Teil des Helfi-Kalenders**. Sie liegen unter `ponygroup:`-Schlüsseln und werden serverseitig nicht an den normalen Ehrenamt-Zugang ausgeliefert. Für den Zugriff ist ein gültiger Pferdeteam-Zugang erforderlich.

In diesen Listen können organisatorisch notwendige Angaben wie Name, Gruppenzugehörigkeit, Anwesenheit und ein kurzer **Unterstützungsbedarf / organisatorischer Hinweis** stehen.

Für dieses allgemeine Hinweisfeld gilt als Datenminimierung:

- nur Angaben speichern, die für die konkrete Betreuung wirklich benötigt werden;
- möglichst handlungsbezogen formulieren, z. B. „braucht Unterstützung beim Aufsteigen“;
- keine ausführlichen Krankheitsgeschichten;
- Diagnosen, Medikamente oder andere detaillierte Gesundheitsangaben nicht aus Bequemlichkeit in dieses allgemeine Listenfeld schreiben.

Auch funktionale Hinweise können im Einzelfall Rückschlüsse auf Gesundheit oder Behinderung zulassen. Wenn besonders sensible Gesundheitsinformationen tatsächlich erforderlich sind, müssen Rechtsgrundlage, Zugriffskreis, Speicherdauer und angemessene Schutzmaßnahmen für diesen konkreten Zweck gesondert geklärt werden.

## Rollen und Zugriff

Technisch sind drei Ebenen getrennt:

1. **Helfi-Kalender:** gemeinsamer geschützter Einladungslink, ausschließlich Helfi-Kalender.
2. **Ehrenamt in der Stall-App:** eigener gemeinsamer Ehrenamt-Code für freigegebene Alltagsbereiche.
3. **Pferdeteam:** persönliche PINs; dazu gehören interne Ponygruppenlisten und die Helfi-Plan-Verwaltung.

Aktive Namen aus den persönlichen Pferdeteam-Zugängen werden im Helfi-Backend als Team/Mitarbeitende behandelt und nicht als Helfis in den Rotationspool aufgenommen. `Moritz` bleibt zusätzlich als Altbestandsschutz ausgeschlossen.

## Gemeinsamer Einladungslink: verbleibende Grenze

Der Einladungslink ist ein **Gruppenzugang**, kein persönlicher Identitätsnachweis. Helfis geben ihren Namen bzw. ihr vereinbartes Kürzel selbst ein. Wer den Link erhält, kann die Helfi-Belegung sehen. Einzelne Personen lassen sich mit einem gemeinsamen Link nicht separat sperren.

Wenn der Link außerhalb des vorgesehenen Personenkreises gelangt, im Pferdeteam-Bereich **Link erneuern** und nur den neuen Link erneut verteilen. Dadurch werden der bisherige Link und bestehende Helfi-Sitzungen beim nächsten Serverkontakt ungültig.

Diese Vertrauensgrenze ist bewusst beibehalten, weil kein Helfi-Konto und keine zusätzliche Code-Eingabe verwendet werden sollen. Für einen stärkeren individuellen Nachweis wären persönliche Einladungen oder Benutzerkonten nötig.

## Ferien, Feiertage und Terminänderungen

Der Helfi-Kalender liest nur die für seine Terminlogik nötigen bestehenden Ponygruppen-/Ferienwerte aus dem internen `data`-Reiter. Diese Informationen werden verwendet, um ausgefallene oder verschobene Helfi-Termine korrekt anzuzeigen. Kinderlisten oder Ponygruppen-Inhalte werden dabei nicht an die Helfi-Seite übertragen.

## Aufbewahrung und automatische Löschung

Für **terminbezogene** Helfi-Daten kann `HELFI_RETENTION_DAYS` gesetzt werden. Technisch zulässig sind 30 bis 730 Tage. Bei gültiger Einstellung löscht das Backend bei Kalenderzugriffen alte Terminzeilen außerhalb dieser Frist.

Beispiel: `HELFI_RETENTION_DAYS = 180`

Der versionierte Grundplan wird dadurch nicht automatisch gelöscht. Eine Aufbewahrungsregel für ältere Planversionen muss organisatorisch festgelegt werden, wenn sie nicht länger benötigt werden.

Löschen in der Tabelle bedeutet nicht automatisch, dass Anbieterprotokolle, Sicherungen oder Google-Versionsverläufe gleichzeitig gelöscht sind. Diese müssen in einem vollständigen Löschkonzept berücksichtigt werden.

## Lokale Offline-Kopien

Die Stall-App speichert eine begrenzte Offline-Kopie im Browser, damit sie bei schlechtem Netz funktioniert. Ab v1.14.0 werden Offline-Kopien nach Rolle getrennt. Das reduziert das Risiko, dass auf demselben Browser nach einem Rollenwechsel intern geschützte Ponygruppeninformationen in der Ehrenamt-Ansicht wiederhergestellt werden.

Auf gemeinsam genutzten Geräten bleibt trotzdem wichtig, den Gerätezugriff selbst zu schützen. Personen mit Zugriff auf das lokale Browserprofil können technisch gespeicherte Webdaten einsehen. Besonders sensible Daten sollten deshalb nicht allein durch die Benutzeroberfläche als geschützt betrachtet werden.

## Organisatorisch noch festzulegen

Für die tatsächlichen Datenschutzhinweise sind insbesondere zu klären:

- verantwortliche Stelle und Kontakt
- Zwecke und jeweilige Rechtsgrundlagen
- berechtigter Personenkreis für Helfi-Link, Ehrenamt und Pferdeteam
- besondere Rechtsgrundlage/Schutzmaßnahmen, falls Gesundheitsdaten tatsächlich verarbeitet werden
- verwendete Dienstleister und Empfänger
- gegebenenfalls Drittlandtransfers
- konkrete Speicherdauern und Löschabläufe
- Betroffenenrechte und Ansprechstelle
- tatsächliche Google-/Workspace-Verträge und Berechtigungen

Eine Checkbox oder diese technische Dokumentation ersetzt diese Punkte nicht.

## Bereits vorhandene Daten und alte Bereitstellungen

Dieses Update ändert bereits veröffentlichte Drive-Freigabelinks, heruntergeladene Kopien, Sicherungen oder alte Apps-Script-Bereitstellungen nicht rückwirkend. Solche Altbestände müssen separat geprüft werden. Alte aktive Web-App-Bereitstellungen mit früheren Zugriffsmöglichkeiten gegebenenfalls stilllegen.

## Vor Freigabe testen

Mit getrennten Browsern beziehungsweise privaten Fenstern prüfen:

- Einladungslink öffnet ausschließlich `helfi.html`.
- Einladungslink funktioniert nicht als Stall-App-Zugang.
- Ehrenamt kann keine `ponygroup:`-Listen abrufen oder aus einer Team-Offline-Kopie wiederherstellen.
- Pferdeteam kann Ponygruppenlisten und Helfi-Plan öffnen.
- einzelne Abmeldung verändert den Rotationsplan der Folgewochen nicht.
- Vertretung belegt nur den freigegebenen Termin.
- Ferien/Feiertage/Absagen erscheinen ohne Helfi-Aktionen.
- es wird nirgends ein Abmeldegrund gespeichert.
- tatsächliche Löschfrist und Datenschutzhinweise sind eingerichtet.
