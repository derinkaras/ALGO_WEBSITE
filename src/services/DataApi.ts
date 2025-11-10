import { DateTime } from "luxon";

const API = import.meta.env.VITE_API_URL as string;
const CACHE_KEY_MAIN = "main_json_cache_v1";
const CACHE_KEY_DAYOF = "dayof_json_cache_v1";

// Helper to sleep between polls
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function poll(url: string) {
    while (true) {
        const r = await fetch(url);
        const j = await r.json();
        if (j.error) throw new Error(j.error);
        if (!j.running) return j;
        await sleep(5000);
    }
}

// Converts to Edmonton time and returns date string (YYYY-MM-DD)
function getEdmontonDate(): string {
    return DateTime.now().setZone("America/Edmonton").toFormat("yyyy-MM-dd");
}

// --- Generic fetch + cache logic ---
async function fetchAndCache(
    type: "main" | "dayof",
    buildUrl: string,
    statusUrl: string,
    downloadUrl: string,
    cacheKey: string
) {
    const today = getEdmontonDate();

    // ✅ check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.date === today && parsed.data) {
                console.log(`[Cache] Using ${type} JSON from cache (${today})`);
                return parsed.data;
            }
        } catch {}
    }

    // ⏳ Not cached or new day → trigger backend build
    console.log(`[Build] Fetching ${type} JSON from API (${today})`);
    await fetch(`${API}${buildUrl}`, { method: "POST" });
    await poll(`${API}${statusUrl}`);
    const res = await fetch(`${API}${downloadUrl}`);
    if (!res.ok) throw new Error(`${type} JSON not ready`);
    const data = await res.json();

    // 💾 cache result with today's Edmonton date
    localStorage.setItem(cacheKey, JSON.stringify({ date: today, data }));

    return data;
}

// --- Public APIs ---
export async function fetchMainJson(): Promise<any> {
    return fetchAndCache(
        "main",
        "/build-main-db",
        "/build-status",
        "/download-json",
        CACHE_KEY_MAIN
    );
}

export async function fetchDayOfJson(): Promise<any> {
    return fetchAndCache(
        "dayof",
        "/build-day-of-db",
        "/build-day-of-status",
        "/download-day-of-json",
        CACHE_KEY_DAYOF
    );
}
