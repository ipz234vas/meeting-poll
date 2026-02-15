export async function submitToGoogleForm({
                                             formActionUrl,
                                             entryNameKey,
                                             entryJsonKey,
                                             name,
                                             jsonString,
                                         }) {
    const body = new URLSearchParams();
    body.set(entryNameKey, String(name || ""));
    body.set(entryJsonKey, String(jsonString || ""));

    await fetch(formActionUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
    });
}
