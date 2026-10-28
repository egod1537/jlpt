export function normalizeName(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("und");
}

export function normalizeSearch(value: string) {
  return normalizeName(value)
    .replace(/\s+/g, " ")
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}
