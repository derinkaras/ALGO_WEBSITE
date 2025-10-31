import React, { useEffect, useMemo, useState } from "react";

/* ───────────────────── Sim parameters (mirror simulate_bets.py) ───────────────────── */
const SIM_PARAMS = {
    INITIAL_BANKROLL: 3000,
    PRED_STRENGTH_THRESHOLD: 70,
    MAX_PREDICTION_ML: 2.0,
    REINVESTMENT_THRESHOLD: 0,
    RESET_BANKROLL_AMOUNT: 500,
    DAILY_INVEST_PERCENT: 40,
} as const;

/* Per-season hard start dates (your values) */
type DatasetKey = "live" | "2024" | "2023";
const SEASON_STARTS: Record<DatasetKey, string> = {
    live: "2025-11-21",
    "2024": "2024-11-22",
    "2023": "2023-11-24",
};

/* Cache version auto-tied to SIM_PARAMS so stale archives re-compute once */
const BASE_CACHE_VERSION = [
    "v5", // bump when logic changes
    SIM_PARAMS.INITIAL_BANKROLL,
    SIM_PARAMS.PRED_STRENGTH_THRESHOLD,
    SIM_PARAMS.MAX_PREDICTION_ML,
    SIM_PARAMS.REINVESTMENT_THRESHOLD,
    SIM_PARAMS.RESET_BANKROLL_AMOUNT,
    SIM_PARAMS.DAILY_INVEST_PERCENT,
].join("-");

/* ───────────────────── Types & helpers ───────────────────── */
type Row = Record<string, any>;
type TablesJSON = { tables?: Record<string, Row[]> } | Row[];

const PREFERRED_MAIN_TABLES = [
    "PredictionsHistory",
    "Main",
    "History",
    "Games",
    "Performance",
    "performance",
];
const PREFERRED_TODAY_TABLES = ["TodayRecommendations", "Today", "DayOf", "Predictions"];

const base = import.meta.env.BASE_URL || "/";

function pickRows(json: TablesJSON, preferred: string[]): Row[] {
    if (Array.isArray(json)) return json;
    const j: any = json;
    if (Array.isArray(j?.rows)) return j.rows;
    const tables = j?.tables;
    if (tables && typeof tables === "object") {
        for (const name of preferred) {
            const r = (tables as any)[name];
            if (Array.isArray(r) && r.length) return r;
        }
        for (const r of Object.values(tables)) {
            if (Array.isArray(r) && r.length) return r as Row[];
        }
    }
    return [];
}

const norm = (s: any) => String(s ?? "").toLowerCase().replace(/\s|_|-/g, "");
function getFirstKey(row: Row, aliases: string[]): string | null {
    const map = new Map(Object.keys(row).map((k) => [norm(k), k]));
    for (const a of aliases) {
        const k = map.get(norm(a));
        if (k) return k;
    }
    return null;
}
function val(row: Row, aliases: string[], fallback: any = ""): any {
    const k = getFirstKey(row, aliases);
    return k ? row[k] : fallback;
}
const r2 = (x: any) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : x;
};
const money = (n: any) => {
    const x = Number(n);
    return Number.isFinite(x) ? `$${x.toFixed(2)}` : "";
};
const dateKey = (row: Row, aliases: string[]) => String(val(row, aliases, "")).slice(0, 10);

/* ───────────────────── Column aliases ───────────────────── */
const colDate = ["Game Date", "date", "game_date", "gameDate"];
const colHome = ["Home Team", "home", "home_team", "homeTeam", "teamOne", "home_name"];
const colAway = ["Visitor Team", "away", "away_team", "visitor", "visitor_team", "awayTeam", "teamTwo", "away_name"];

const colPred = ["Prediction", "prediction", "pick", "predicted_winner", "model_pick"];
const colPredStr = ["Prediction Strength", "prediction_strength", "edge", "confidence", "model_confidence", "predictionStrength"];
const colWinnerTeam = ["Winner", "winner", "winning_team", "winnerTeam"];
const colCorrectNum = ["predictionCorrectness"]; // 1=win, 0=loss, -1=UNKNOWN

const colHomeML = ["Home ML", "home_ml", "homeMoneyline", "teamOne_ml", "home_odds", "homeMoneyLine", "homeML"];
const colAwayML = ["Away ML", "away_ml", "awayMoneyline", "visitor_ml", "teamTwo_ml", "away_odds", "awayMoneyLine", "awayML"];
const colPredML = ["Pred ML", "pred_ml", "model_ml", "model_moneyline", "decimal_odds", "ml", "moneyline"];

const colMatchup = ["Matchup", "matchup", "game", "teams"];

/* ───────────────────── TODAY aliases ───────────────────── */
const colTodayPred = colPred;
const colTodayStr = colPredStr;
const colTodayML = ["Money Line", "ml", "moneyline", "best_ml", "consensus_ml", ...colHomeML, ...colAwayML];

/* ───────────────────── Value derivation ───────────────────── */
function getPredictedML(row: Row): number | "" {
    const pred = String(val(row, colPred, "")).trim();
    const home = String(val(row, colHome, "")).trim();
    const away = String(val(row, colAway, "")).trim();
    const homeML = Number(val(row, colHomeML, NaN));
    const awayML = Number(val(row, colAwayML, NaN));

    if (pred) {
        if (norm(pred) === norm(home) || ["home", "h", "1"].includes(norm(pred))) {
            if (Number.isFinite(homeML)) return homeML;
        }
        if (norm(pred) === norm(away) || ["away", "a", "2"].includes(norm(pred))) {
            if (Number.isFinite(awayML)) return awayML;
        }
    }
    const pm = Number(val(row, colPredML, NaN));
    if (Number.isFinite(pm)) return pm;
    if (Number.isFinite(homeML) && Number.isFinite(awayML)) {
        return Math.abs(homeML) <= Math.abs(awayML) ? homeML : awayML;
    }
    return "";
}

function computeCorrect(row: Row): boolean | "" {
    // Prefer explicit numeric correctness when available
    const corrNumRaw = val(row, colCorrectNum, null);
    if (corrNumRaw !== null && corrNumRaw !== undefined && corrNumRaw !== "") {
        const n = Number(corrNumRaw);
        if (Number.isFinite(n)) {
            if (n === 1) return true;
            if (n === 0) return false;
            return ""; // -1 or other → UNKNOWN
        }
    }
    const pred = String(val(row, colPred, "")).trim();
    const winner = String(val(row, colWinnerTeam, "")).trim();
    if (pred && winner) return norm(pred) === norm(winner);
    return ""; // unknown
}

function getMatchup(row: Row): string {
    const explicit = String(val(row, colMatchup, "")).trim();
    if (explicit) return explicit;
    const home = String(val(row, colHome, "")).trim();
    const away = String(val(row, colAway, "")).trim();
    if (home || away) return `${away || "Away"} @ ${home || "Home"}`;
    return "";
}

/* ───────────────────── Simulation (parity with simulate_bets.py) ───────────────────── */
type SimRow = Row & {
    _date: string;
    _predML: number | "";
    _correct: boolean | "";
    _stake: number | "";
    _result: number | "";        // +profit or -stake
    _bankrollAfter: number;      // bankroll after this bet
    _roiPct: number | "";        // per-bet ROI %, win:(ml-1)*100, loss:-100
    _reinvested?: number;        // reinvested amount
    _bankrollReset?: boolean;    // did a reset happen today?
};

function simulateLikePython(mainData: Row[], opts: { startDate: string }): SimRow[] {
    const {
        INITIAL_BANKROLL,
        PRED_STRENGTH_THRESHOLD,
        MAX_PREDICTION_ML,
        REINVESTMENT_THRESHOLD,
        RESET_BANKROLL_AMOUNT,
        DAILY_INVEST_PERCENT,
    } = SIM_PARAMS;

    const START_DATE_EFF = opts.startDate;

    const rows = [...mainData]
        .filter((r) => {
            const strength = Number(val(r, colPredStr, NaN));
            const d = dateKey(r, colDate);
            return Number.isFinite(strength) && strength >= PRED_STRENGTH_THRESHOLD && d >= START_DATE_EFF;
        })
        .map((r) => {
            const d = dateKey(r, colDate);
            const correct = computeCorrect(r);
            const predML = getPredictedML(r);
            return { r, d, correct, predML };
        })
        .filter(({ predML }) => predML !== "" && Number(predML) <= MAX_PREDICTION_ML)
        .sort((a, b) => {
            const cmp = a.d.localeCompare(b.d);
            if (cmp !== 0) return cmp;
            const sa = Number(val(a.r, colPredStr, 0));
            const sb = Number(val(b.r, colPredStr, 0));
            return sb - sa; // strength desc within day (optional, mirrors script)
        });

    let currentBankroll = INITIAL_BANKROLL;
    let totalReinvested = 0;
    const out: SimRow[] = [];

    let currentDate = "";
    let dayOpenBR = currentBankroll;
    let perGameBet = 0;

    for (const { r, d, correct, predML } of rows) {
        if (d !== currentDate) {
            currentDate = d;
            dayOpenBR = currentBankroll;
            perGameBet = Math.round(dayOpenBR * (Math.max(0, Math.min(100, DAILY_INVEST_PERCENT)) / 100) * 100) / 100;
        }

        let bankrollReset = false;
        if (currentBankroll <= 0) {
            currentBankroll = RESET_BANKROLL_AMOUNT;
            bankrollReset = true;
            dayOpenBR = currentBankroll;
            perGameBet = Math.round(dayOpenBR * (Math.max(0, Math.min(100, DAILY_INVEST_PERCENT)) / 100) * 100) / 100;
        }

        // Unknown or invalid → no bet but keep the row
        if (correct === "" || !Number.isFinite(Number(predML))) {
            out.push({
                ...r,
                _date: d,
                _predML: predML,
                _correct: "",
                _stake: "",
                _result: "",
                _bankrollAfter: currentBankroll,
                _roiPct: "",
                _bankrollReset: bankrollReset,
            });
            continue;
        }

        const ml = Number(predML);
        const stake = perGameBet;

        let result: number;
        let winLossPct = 0;
        let reinvested = 0;

        if (correct) {
            result = stake * (ml - 1.0);
            winLossPct = (ml - 1.0) * 100.0;
        } else {
            result = -stake;
            if (REINVESTMENT_THRESHOLD > 0 && totalReinvested < REINVESTMENT_THRESHOLD) {
                reinvested = Math.min(-result, REINVESTMENT_THRESHOLD - totalReinvested);
                totalReinvested += reinvested;
            }
        }

        currentBankroll += result + reinvested;

        out.push({
            ...r,
            _date: d,
            _predML: ml,
            _correct: correct,
            _stake: stake,
            _result: result,
            _bankrollAfter: Math.round(currentBankroll * 100) / 100,
            _roiPct: Math.round(winLossPct || (correct ? (ml - 1) * 100 : -100)),
            _reinvested: Math.round(reinvested * 100) / 100,
            _bankrollReset: bankrollReset,
        });
    }

    return out;
}

/* ───────────────────── Dataset selector & caching ───────────────────── */
const DATASETS: Record<DatasetKey, { label: string; mainPath: string; todayPath?: string }> = {
    live: { label: "Live (Current)", mainPath: "data/database.json", todayPath: "data/dayOf.json" },
    "2024": { label: "2024 Database", mainPath: "data/2024Database.json" },
    "2023": { label: "2023 Database", mainPath: "data/2023Database.json" },
};

const isArchive = (k: DatasetKey) => k !== "live";
const cacheKey = (k: DatasetKey, startDate: string) =>
    `nba-archive-${BASE_CACHE_VERSION}-${k}-start:${startDate}`;

/* ───────────────────── Component ───────────────────── */
const Nba: React.FC = () => {
    const [selectedDataset, setSelectedDataset] = useState<DatasetKey>("live");

    const [mainData, setMainData] = useState<Row[]>([]);
    const [todayData, setTodayData] = useState<Row[]>([]);
    const [simRows, setSimRows] = useState<SimRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [selectedIndexTop, setSelectedIndexTop] = useState<number | null>(null);
    const [selectedIndexBottom, setSelectedIndexBottom] = useState<number | null>(null);
    const [effectiveStartDate, setEffectiveStartDate] = useState<string>(SEASON_STARTS.live);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setSelectedIndexTop(null);
                setSelectedIndexBottom(null);
                setErr(null);

                const cfg = DATASETS[selectedDataset];
                const startEff = SEASON_STARTS[selectedDataset];
                setEffectiveStartDate(startEff);

                // Archives: try cached sim first
                if (isArchive(selectedDataset)) {
                    const ck = cacheKey(selectedDataset, startEff);
                    const cached = localStorage.getItem(ck);
                    if (cached) {
                        const parsed = JSON.parse(cached) as { simRows: SimRow[]; savedAt: string };
                        if (!cancelled) {
                            setSimRows(parsed.simRows);
                            setMainData([]);
                            setTodayData([]);
                            setLoading(false);
                        }
                        return;
                    }
                }

                // Fetch data
                const mainResp = await fetch(`${base}${cfg.mainPath}`, { cache: "no-store" });
                if (!mainResp.ok) throw new Error(`${cfg.mainPath} ${mainResp.status}`);
                const jm = await mainResp.json();
                const rowsMain = pickRows(jm, PREFERRED_MAIN_TABLES);

                let rowsToday: Row[] = [];
                if (cfg.todayPath) {
                    const todayResp = await fetch(`${base}${cfg.todayPath}`, { cache: "no-store" });
                    if (!todayResp.ok) throw new Error(`${cfg.todayPath} ${todayResp.status}`);
                    const jd = await todayResp.json();
                    rowsToday = pickRows(jd, PREFERRED_TODAY_TABLES);
                }

                const sim = simulateLikePython(rowsMain, { startDate: startEff });

                if (!cancelled) {
                    setMainData(rowsMain);
                    setTodayData(rowsToday);
                    setSimRows(sim);
                }

                // Cache archives after first calc
                if (isArchive(selectedDataset)) {
                    const ck = cacheKey(selectedDataset, startEff);
                    localStorage.setItem(ck, JSON.stringify({ simRows: sim, savedAt: new Date().toISOString() }));
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message ?? "Failed to load data");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedDataset]);

    /* ── Overall Results ── */
    const perf = useMemo(() => {
        const finished = simRows.filter((r) => r._result !== "");
        const totalBets = finished.length;
        const wins = finished.filter((r) => r._correct === true).length;
        const losses = finished.filter((r) => r._correct === false).length;
        const pnl = finished.reduce((a, r) => a + Number(r._result), 0);
        const finalBankroll = SIM_PARAMS.INITIAL_BANKROLL + pnl;
        const totalStake = finished.reduce((a, r) => a + Number(r._stake), 0);
        const avgRoi = totalStake > 0 ? (pnl / totalStake) * 100 : 0;
        const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

        // Max bankroll tracking (including start)
        let maxBankroll = SIM_PARAMS.INITIAL_BANKROLL;
        let maxBankrollDate = "";
        for (const r of finished) {
            const br = Number(r._bankrollAfter);
            if (Number.isFinite(br) && br > maxBankroll) {
                maxBankroll = br;
                maxBankrollDate = String(r._date || "");
            }
        }

        return {
            totalBets,
            wins,
            losses,
            winRate: Math.round(winRate),
            pnl,
            finalBankroll,
            avgRoi: Math.round(avgRoi),
            maxBankroll,
            maxBankrollDate,
        };
    }, [simRows]);

    if (loading) {
        return (
            <div className="px-6 py-10 text-center text-slate-200">
                <h2 className="text-2xl font-semibold">NBA ALGO</h2>
                <p className="opacity-70 mt-2">Loading data…</p>
            </div>
        );
    }
    if (err) {
        return (
            <div className="px-6 py-10 text-center text-red-300">
                <h2 className="text-2xl font-semibold">NBA ALGO</h2>
                <p className="mt-2">Error: {err}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1400px] xl:max-w-[1500px] mx-auto px-4 md:px-8 py-6">
            {/* Dataset Selector */}
            <div className="mb-4 flex flex-col items-center gap-3">
                <h2 className="text-xl font-semibold text-amber-300 tracking-wide">VIEW DATASET</h2>
                <div className="flex flex-wrap items-center gap-2">
                    {(
                        [
                            ["live", "Live (Current)"],
                            ["2024", "2024 Database"],
                            ["2023", "2023 Database"],
                        ] as [DatasetKey, string][]
                    ).map(([key, label]) => {
                        const active = selectedDataset === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedDataset(key)}
                                className={[
                                    "px-3 py-1.5 rounded-lg border transition-colors text-sm",
                                    active
                                        ? "bg-amber-300 text-black border-amber-300"
                                        : "bg-[#242424] text-slate-200 border-white/10 hover:bg-[#2e2e2e]",
                                ].join(" ")}
                                aria-pressed={active}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-slate-400">
                    {selectedDataset === "live"
                        ? `Showing current season (start ${SEASON_STARTS.live}).`
                        : `Showing archive: ${selectedDataset.toUpperCase()} (start ${SEASON_STARTS[selectedDataset]}, cached).`}
                </p>
            </div>

            {/* MAIN TABLE */}
            <div className="rounded-xl bg-[#1d1d1d] shadow-lg overflow-hidden">
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full min-w-[1400px] text-slate-100 text-sm">
                        <thead className="sticky top-0 z-20 bg-emerald-700">
                        <tr className="text-center">
                            <th className="px-3 py-2 sticky left-0 bg-emerald-700 z-30 text-center">Game Date</th>
                            <th className="px-3 py-2 text-center">Home Team</th>
                            <th className="px-3 py-2 text-center">Visitor Team</th>
                            <th className="px-3 py-2 text-center">Prediction</th>
                            <th className="px-3 py-2 text-center">Prediction Strength</th>
                            <th className="px-3 py-2 text-center">Home ML</th>
                            <th className="px-3 py-2 text-center">Away ML</th>
                            <th className="px-3 py-2 text-center">Pred ML</th>
                            <th className="px-3 py-2 text-center">Correct</th>
                            <th className="px-3 py-2 text-center">Win %</th>
                            <th className="px-3 py-2 text-center">Bet Amount</th>
                            <th className="px-3 py-2 text-center min-w-[120px]">Bet Result</th>
                            <th className="px-3 py-2 text-center">Current Bankroll</th>
                        </tr>
                        </thead>
                        <tbody>
                        {simRows.map((row, i) => {
                            const isSelected = selectedIndexTop === i;
                            const baseRowCls = `${i % 2 === 0 ? "bg-[#2e2e2e]" : ""} hover:bg-amber-300 hover:text-black transition-colors cursor-pointer ${isSelected ? "bg-amber-300 text-black" : ""} text-center`;

                            const resultVal = row._result as number | "";
                            const isPositive = resultVal !== "" && Number(resultVal) >= 0;
                            const betResultCls =
                                resultVal === ""
                                    ? ""
                                    : isPositive
                                        ? (isSelected ? "text-white" : "text-green-400") // white when selected to avoid clash
                                        : "text-red-400";

                            return (
                                <tr
                                    key={i}
                                    className={baseRowCls}
                                    onClick={() => setSelectedIndexTop(isSelected ? null : i)}
                                >
                                    <td className={`px-3 py-2 sticky left-0 z-10 ${isSelected ? "bg-amber-300" : "bg-emerald-700"} text-center`}>
                                        {String(val(row, colDate, ""))}
                                    </td>
                                    <td className="px-3 py-2">{String(val(row, colHome, ""))}</td>
                                    <td className="px-3 py-2">{String(val(row, colAway, ""))}</td>
                                    <td className="px-3 py-2">{String(val(row, colPred, ""))}</td>
                                    <td className="px-3 py-2">{String(r2(val(row, colPredStr, "")))}</td>
                                    <td className="px-3 py-2">{String(val(row, colHomeML, ""))}</td>
                                    <td className="px-3 py-2">{String(val(row, colAwayML, ""))}</td>
                                    <td className="px-3 py-2">{row._predML !== "" ? String(r2(row._predML)) : ""}</td>
                                    <td className="px-3 py-2">
                                        {row._correct === "" ? "" : row._correct ? (
                                            <span className="text-green-400">✔</span>
                                        ) : (
                                            <span className="text-red-400">✖</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">{row._roiPct === "" ? "" : `${row._roiPct}%`}</td>
                                    <td className="px-3 py-2">{row._stake === "" ? "" : money(row._stake)}</td>
                                    <td className={`px-3 py-2 min-w-[120px] ${betResultCls}`}>
                                        {resultVal === ""
                                            ? ""
                                            : isPositive
                                                ? `+${money(resultVal)}`
                                                : `-${money(Math.abs(resultVal as number))}`}
                                    </td>
                                    <td className="px-3 py-2">{money(row._bankrollAfter)}</td>
                                </tr>
                            );
                        })}
                        {!simRows.length && (
                            <tr>
                                <td colSpan={13} className="px-4 py-6 text-center text-slate-400">
                                    No rows available after filters ({SIM_PARAMS.PRED_STRENGTH_THRESHOLD}%+, start {effectiveStartDate}, ML ≤ {SIM_PARAMS.MAX_PREDICTION_ML})
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TODAY (live only) */}
            {selectedDataset === "live" && (
                <section className="rounded-xl bg-[#1d1d1d] shadow-lg p-4 mt-4">
                    <h3 className="text-amber-300 text-xl font-semibold text-center">FAVOURITES TODAY</h3>
                    <div className="mt-3 overflow-auto">
                        <table className="w-full min-w-[700px] text-slate-100 text-sm">
                            <thead className="sticky top-0 z-10 bg-emerald-700">
                            <tr className="text-center">
                                <th className="px-3 py-2 text-left">Matchup</th>
                                <th className="px-3 py-2">Prediction</th>
                                <th className="px-3 py-2">Prediction Strength</th>
                                <th className="px-3 py-2">Money Line</th>
                            </tr>
                            </thead>
                            <tbody>
                            {todayData.map((row, i) => {
                                const isSelected = selectedIndexBottom === i;
                                const ml = val(row, colTodayML, "");
                                return (
                                    <tr
                                        key={i}
                                        className={`hover:bg-amber-300 hover:text-black transition-colors cursor-pointer ${isSelected ? "bg-amber-300 text-black" : i % 2 === 0 ? "bg-[#2e2e2e]" : ""}`}
                                        onClick={() => setSelectedIndexBottom(isSelected ? null : i)}
                                    >
                                        <td className="px-3 py-2 text-left">{getMatchup(row)}</td>
                                        <td className="px-3 py-2 text-center">{String(val(row, colTodayPred, ""))}</td>
                                        <td className="px-3 py-2 text-center">{String(r2(val(row, colTodayStr, "")))}</td>
                                        <td className="px-3 py-2 text-center">{String(ml)}</td>
                                    </tr>
                                );
                            })}
                            {!todayData.length && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                        No rows found in dayOf.json
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* OVERALL RESULTS / PERFORMANCE */}
            <section className="rounded-xl bg-[#1d1d1d] shadow-lg p-5 mb-6 mt-6">
                <div className="flex items-center justify-center gap-2 mb-5">
                    <h3 className="text-amber-300 text-xl md:text-2xl font-semibold tracking-wide">
                        OVERALL RESULTS {selectedDataset !== "live" ? `— ${selectedDataset.toUpperCase()}` : ""}
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Final Bankroll */}
                    <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300">Final Bankroll</p>
                            <span className="text-xl">💼</span>
                        </div>
                        <p className="text-amber-300 text-2xl font-extrabold mt-1">
                            {money(perf.finalBankroll)}
                        </p>
                        <p className={`mt-1 text-sm ${perf.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {perf.pnl >= 0 ? "▲" : "▼"} {perf.pnl >= 0 ? "+" : "-"}
                            {money(Math.abs(perf.pnl))}
                        </p>
                    </div>

                    {/* Max Bankroll (archives only) */}
                    {selectedDataset !== "live" && (
                        <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between">
                                <p className="text-slate-300">Max Bankroll</p>
                                <span className="text-xl">🚀</span>
                            </div>
                            <p className="text-amber-300 text-2xl font-extrabold mt-1">
                                {money(perf.maxBankroll)}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                {perf.maxBankrollDate ? `On ${perf.maxBankrollDate}` : "—"}
                            </p>
                        </div>
                    )}

                    {/* Win Rate */}
                    <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300">Win Rate</p>
                            <span className="text-xl">🏆</span>
                        </div>
                        <p className="text-amber-300 text-2xl font-extrabold mt-1">{perf.winRate}%</p>
                        <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${Math.min(100, Math.max(0, perf.winRate))}%` }}
                            />
                        </div>
                    </div>

                    {/* Avg ROI / Bet */}
                    <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300">Avg ROI / Bet</p>
                            <span className="text-xl">💹</span>
                        </div>
                        <p className={`text-2xl font-extrabold mt-1 ${perf.avgRoi >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {perf.avgRoi}%
                        </p>
                        <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                            <div
                                className={`h-full ${perf.avgRoi >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, Math.max(0, Math.abs(perf.avgRoi)))}%` }}
                            />
                        </div>
                    </div>

                    {/* Total Bets */}
                    <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300">Total Bets</p>
                            <span className="text-xl">🎯</span>
                        </div>
                        <p className="text-amber-300 text-2xl font-extrabold mt-1">{perf.totalBets}</p>
                        <p className="text-slate-400 text-sm mt-1">≥ {SIM_PARAMS.PRED_STRENGTH_THRESHOLD} strength</p>
                    </div>

                    {/* W / L */}
                    <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300">W / L</p>
                            <span className="text-xl">⚖️</span>
                        </div>
                        <p className="text-2xl font-extrabold mt-1">
                            <span className="text-green-400">{perf.wins}</span>
                            <span className="text-slate-400"> / </span>
                            <span className="text-red-400">{perf.losses}</span>
                        </p>
                        <p className="text-slate-400 text-sm mt-1">Completed bets</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Nba;
