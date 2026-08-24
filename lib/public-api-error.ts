const forbiddenRuntimeDetail = /(?:[a-z]:\\|\/users\/|\/home\/|node_modules|sqlite|database|sql\b|auth_secret|client_secret|access[_ -]?token|refresh[_ -]?token|authorization|private key|enoent|eacces|eperm|stack\b)/i;

const safeUserPrefixes = [
  "Abgeschlossener", "Apply", "Agent", "Agenten", "Archivierter", "Aufgaben", "Auswahl", "Backupdatei",
  "Datenkonflikt", "Details", "Diese", "Doppelte", "Ein Block", "Eintrag", "Exakte", "Fokusblock", "Fokusblöcke",
  "Freigabe", "Freigabevorschlag", "Gelesene", "Habit", "Hintergrundwrites", "Inbox", "Integritätsprüfung",
  "Kalender", "Kalenderauswahl", "Karrierepfad", "Kurzname", "Link", "Maximal", "Mindestens", "Name",
  "Nicht erlaubte", "Nicht verifiziertes", "Nur ", "Ohne Provider", "Produktname", "Projekt", "Projektbeschreibung",
  "Projekttermin", "Projektziel", "Puffer", "Qur", "Recovery", "Ressourcenverweis", "Skill", "Trainingsdauer",
  "Unbekannte", "Unbekannter", "Ungültige", "Ungültiger", "Vorschlag", "Wochenplan", "Zugeordnete", "Zugeordneter",
] as const;

function normalizedMessage(error: unknown) {
  return error instanceof Error ? error.message.trim().replace(/\s+/g, " ") : "";
}

export function publicApiError(error: unknown, fallback: string) {
  const message = normalizedMessage(error);
  if (!message || message.length > 220 || forbiddenRuntimeDetail.test(message) || !safeUserPrefixes.some((prefix) => message.startsWith(prefix))) return fallback;
  return message;
}

export function publicConflict(error: unknown) {
  const message = normalizedMessage(error);
  return message.startsWith("Datenkonflikt:");
}
