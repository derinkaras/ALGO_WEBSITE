import { useEffect } from "react";

// Pings your own site. Works on any domain the app is served from.
const TARGET = typeof window !== "undefined" ? window.location.origin : "/";
// Every 14 minutes (Render free idles after ~15m)
const INTERVAL_MS = 14 * 60 * 1000;

export default function useKeepAlive() {
    useEffect(() => {
        const ping = () => {
            fetch(TARGET, { cache: "no-store", mode: "no-cors" })
                .then(() => console.log("[keep-alive] ping"))
                .catch(() => {}); // ignore errors
        };

        ping(); // once on mount
        const id = setInterval(ping, INTERVAL_MS);
        return () => clearInterval(id);
    }, []);
}
