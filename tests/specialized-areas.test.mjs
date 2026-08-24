import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ui = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const store = await readFile(new URL("../lib/shared-store.ts", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("faith workspace tracks only self-entered prayer and Quran values", () => {
  for (const control of ["Gebet festhalten", "Fajr", "Dhuhr", "ʿAsr", "Maghrib", "ʿIschāʾ", "Aktuelle Seite", "Heute gelesene Seiten"]) assert.match(ui, new RegExp(control));
  assert.match(ui, /Keine Standortautomatik oder Gebetszeit-Berechnung aktiv/);
  assert.match(ui, /Persönlich, nicht autoritativ/);
  assert.match(store, /Qurʾān-Seite muss zwischen 1 und 604 liegen/);
  assert.match(store, /Gelesene Seiten müssen zwischen 1 und 604 liegen/);
  assert.doesNotMatch(ui, /Gebetszeit heute um|Qibla berechnet|religiöse Empfehlung/i);
});

test("health workspace uses encrypted organizational fields without advice", () => {
  for (const control of ["Dauer in Minuten", "Intensität", "Recovery 1–5", "Schlafstunden", "Eintragsart", "Messwert"]) assert.match(ui, new RegExp(control));
  assert.match(ui, /Organisation, keine Diagnose oder medizinische Fachberatung/);
  assert.match(store, /Trainingsdauer muss zwischen 1 und 1440 Minuten liegen/);
  assert.match(store, /Recovery-Wert muss zwischen 1 und 5 liegen/);
  assert.match(ui, /Die Grafik erscheint erst aus selbst erfassten Werten/);
  assert.doesNotMatch(ui, /Du solltest medizinisch|Diagnose lautet|optimale Dosis/i);
});

test("finance workspace calculates only manual records and cannot transact", () => {
  for (const control of ["Container erfassen", "Zielbetrag", "Rhythmus", "Wiederkehrend", "Keine Bankverbindung · keine Transaktionen"]) assert.match(ui, new RegExp(control));
  assert.match(ui, /Noch keine berechenbaren Finanzwerte/);
  assert.match(ui, /keine Finanzberatung, Anlageentscheidung oder Geldbewegung/i);
  assert.doesNotMatch(ui, /Überweisung ausführen|Aktie kaufen|Bank synchronisieren/i);
});

test("relationship workspace shows real people, birthdays and follow-ups without messaging", () => {
  for (const control of ["Person erfassen", "Geburtstag", "Letzter Kontakt", "Nächstes Follow-up", "Platz in Konstellation"]) assert.match(ui, new RegExp(control));
  assert.match(ui, /Avatare erscheinen nur aus echten privaten Datensätzen/);
  assert.match(ui, /Keine Nachricht oder Erinnerung wird automatisch versendet/);
  assert.match(store, /Ungültige Beziehungskategorie/);
  assert.match(css, /\.relationshipConstellation/);
  assert.doesNotMatch(ui, /Nachricht jetzt senden|WhatsApp öffnen/i);
});

test("all specialized private values remain inside encrypted area payloads", () => {
  for (const field of ["prayerName", "completed", "quranPage", "pagesRead", "durationMinutes", "recoveryScore", "sleepHours", "metricValue", "targetAmount", "birthday", "lastContact", "nextFollowUp", "relationshipCategory", "constellationSlot"]) assert.match(store, new RegExp(`'${field}'`));
  const payload = store.slice(store.indexOf("function areaRecordPayload"), store.indexOf("export function listRecords"));
  assert.match(payload, /sensitive:encryptSensitive\(sensitive\)/);
  assert.doesNotMatch(payload.match(/publicData:JSON\.stringify\(([^)]*)\)/)?.[1] || "", /birthday|amount|details|quranPage|recoveryScore|lastContact/);
});

test("life-area details translate stored enums instead of exposing internal codes", () => {
  for (const map of ["recordStatusLabel", "relationshipLabel", "frequencyLabel", "intensityLabel"]) assert.match(ui, new RegExp(map));
  assert.match(ui, /recordStatusLabel\[record\.status\]/);
  assert.match(ui, /recordStatusLabel\[selected\.status\]/);
  assert.match(ui, /relationshipLabel\[selected\.relationshipCategory\]/);
  assert.match(ui, /frequencyLabel\[selected\.frequency\]/);
  assert.match(ui, /intensityLabel\[selected\.intensity\]/);
});
