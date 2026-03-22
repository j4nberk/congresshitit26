/**
 * Strip "mailto:" prefix and trim whitespace from email addresses.
 * Shared utility — renderer tarafı kullanımı.
 */
export function cleanEmail(raw) {
    if (!raw) return '';
    let e = String(raw).trim();
    if (e.toLowerCase().startsWith('mailto:')) {
        e = e.slice(7);
    }
    return e.trim();
}

/**
 * Bir hücredeki virgül/noktalı virgülle ayrılmış email adreslerini
 * ayrı ayrı temizleyip array olarak döndürür.
 * Örn: "ali@test.com, veli@test.com" → ["ali@test.com", "veli@test.com"]
 * Tek email varsa tek elemanlı array döner.
 */
export function splitEmails(raw) {
    if (!raw) return [];
    return String(raw)
        .split(/[,;]+/)
        .map(e => cleanEmail(e))
        .filter(e => e && e.includes('@'));
}
