/**
 * JSON for an inline <script type="application/ld+json">.
 *
 * Plain JSON.stringify leaves "<" as is, so a value such as "</script>" typed
 * into the admin panel would close the script tag. That is harmless in a live
 * browser, but the build saves some pages to static HTML, where it would let
 * the rest of the text run as markup. Characters that can end the script are
 * written as \u escapes instead; the result is still the same JSON.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
