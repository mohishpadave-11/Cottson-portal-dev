/**
 * Utility for generating smart codes for companies and orders
 */

/**
 * Generates a 2-3 letter short code from a company name
 * @param {string} name - Company name
 * @param {string[]} existingCodes - List of already taken short codes
 * @returns {string} Unique short code
 */
export const generateShortCode = (name, existingCodes = []) => {
    if (!name) return "XXX";

    // Clean name: remove special characters, trim, uppercase
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "").trim().toUpperCase();
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);

    // Attempt 1: 3-letter combinations
    let code = "";
    if (words.length >= 3) {
        // 3+ words -> First initial of first 3 words
        code = (words[0][0] + words[1][0] + words[2][0]).substring(0, 3);
    } else if (words.length === 2) {
        // 2 words -> First 2 of word 1 + First of word 2
        code = (words[0].substring(0, 2) + words[1][0]).substring(0, 3);
    } else if (words.length === 1) {
        // 1 word -> First 3 letters
        code = words[0].substring(0, 3);
    }

    // Ensure it's 3 letters and padded if word is very short
    if (code.length < 3) code = code.padEnd(3, "X");

    if (code && !existingCodes.includes(code)) return code;

    // Attempt 2: First 3 letters of first word (if different)
    if (words.length > 0) {
        const fallbackCode = words[0].substring(0, 3).padEnd(3, "X");
        if (fallbackCode !== code && !existingCodes.includes(fallbackCode)) return fallbackCode;
    }

    // Attempt 3: Base + Number (MOC1, MOC2...)
    let baseCode = code || "COM";
    let counter = 1;
    while (true) {
        const candidate = `${baseCode}${counter}`.substring(0, 5);
        if (!existingCodes.includes(candidate)) return candidate;
        counter++;
        if (counter > 999) break; // Safety break
    }

    return baseCode + Math.floor(Math.random() * 100);
};

/**
 * Formats an order number
 * @param {string} shortCode - Company short code
 * @param {number} sequence - Sequence number
 * @returns {string} Formatted order number (e.g., CC/ON/MC/01)
 */
export const formatOrderNumber = (shortCode, sequence) => {
    const paddedSequence = String(sequence).padStart(2, "0");
    return `CC/ON/${shortCode}/${paddedSequence}`;
};
