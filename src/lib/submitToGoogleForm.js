/**
 * Submit an arbitrary set of fields to a Google Form.
 *
 * @param {string} formActionUrl  – The Google Form /formResponse URL
 * @param {Record<string,string>} fields – { [entryKey]: value }
 */
export async function submitToGoogleForm({ formActionUrl, fields }) {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
        body.set(key, String(value ?? ""));
    }

    await fetch(formActionUrl, {
        method:  "POST",
        mode:    "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
    });
}