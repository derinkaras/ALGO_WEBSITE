import React, { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;
type TablesJSON = { tables?: Record<string, Row[]> } | Row[];

const PREFERRED_MAIN_TABLES = ["PredictionsHistory", "Main", "History", "Games", "Performance"];
const PREFERRED_TODAY_TABLES = ["TodayRecommendations", "Today", "DayOf", "Predictions"];

const base = import.meta.env.BASE_URL || "/";

/* ───────── JSON helpers ───────── */
function pickRows(json: TablesJSON, preferred: string[]): Row[] {
    if (Array.isArray(json)) return json;
    const j: any = json;
    if (Array.isArray(j?.rows)) return j.rows;
    const tables = j?.tables;
    if (tables && typeof tables === "object") {
        for (const name of preferred) {
            const r = tables[name];
            if (Array.isArray(r) && r.length) return r;
        }
        for (const r of Object.values(tables)) {
            if (Array.isArray(r) && r.length) return r as Row[];
        }
    }
    return [];
}

/* ───────── alias + value helpers ───────── */
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

/* ───────── Column aliases ───────── */
const colDate = ["Game Date", "date", "game_date"];
const colHome = ["Home Team", "home", "home_team", "homeTeam", "teamOne", "home_name"];
const colAway = ["Visitor Team", "away", "away_team", "visitor", "visitor_team", "awayTeam", "teamTwo", "away_name"];

const colPred = ["Prediction", "prediction", "pick", "predicted_winner", "model_pick"];
const colPredStr = ["Prediction Strength", "prediction_strength", "edge", "confidence", "model_confidence"];

// Decimal odds
const colHomeML = ["Home ML", "home_ml", "homeMoneyline", "teamOne_ml", "home_odds", "homeMoneyLine"];
const colAwayML = ["Away ML", "away_ml", "awayMoneyline", "visitor_ml", "teamTwo_ml", "away_odds", "awayMoneyLine"];
const colPredML = ["Pred ML", "pred_ml", "model_ml", "model_moneyline"];

const colWinnerTeam = ["Winner", "winner", "winning_team", "winnerTeam", "resultTeam"];

// TODAY table
const colMatchup = ["Matchup", "matchup", "game", "teams"];
const colTodayPred = colPred;
const colTodayStr = colPredStr;
const colTodayHome = colHome;
const colTodayAway = colAway;
const colTodayML = ["Money Line", "ml", "moneyline", "best_ml", "consensus_ml", ...colHomeML, ...colAwayML];

/* ───────── Helpers ───────── */
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
    return Number.isFinite(pm) ? pm : "";
}

function computeCorrect(row: Row): boolean | "" {
    const pred = String(val(row, colPred, "")).trim();
    const winner = String(val(row, colWinnerTeam, "")).trim();
    if (pred && winner) return norm(pred) === norm(winner);
    return ""; // unknown
}

function getMatchup(row: Row): string {
    const explicit = String(val(row, colMatchup, "")).trim();
    if (explicit) return explicit;
    const home = String(val(row, colTodayHome, "")).trim();
    const away = String(val(row, colTodayAway, "")).trim();
    if (home || away) return `${away || "Away"} @ ${home || "Home"}`;
    return "";
}

/* ───────── Bankroll simulation ───────── */
const START_BANKROLL = 3000;
const STAKE_PCT = 0.4;

type SimRow = Row & {
    _date: string;
    _predML: number | "";
    _correct: boolean | "";
    _stake: number | "";
    _result: number | "";        // +profit or -stake
    _bankrollAfter: number;      // bankroll after this bet
    _roiPct: number | "";        // per-bet ROI %, win:(ml-1)*100, loss:-100
};

function simulate(mainData: Row[]): SimRow[] {
    // Filter by Prediction Strength ≥ 70
    const filtered = mainData.filter((r) => {
        const strength = Number(val(r, colPredStr, NaN));
        return Number.isFinite(strength) && strength >= 70;
    });

    // Sort by date ASC
    const rows = [...filtered].sort((a, b) => {
        const ad = String(val(a, colDate, ""));
        const bd = String(val(b, colDate, ""));
        return ad.localeCompare(bd);
    });

    let bankroll = START_BANKROLL;
    let currentDate = "";
    let dayStart = bankroll;
    let dayStake = 0;

    const out: SimRow[] = [];

    for (const row of rows) {
        const dateStr = String(val(row, colDate, ""));
        const correct = computeCorrect(row);
        const predML = getPredictedML(row);

        if (dateStr !== currentDate) {
            currentDate = dateStr;
            dayStart = bankroll;
            dayStake = STAKE_PCT * dayStart; // same stake for all bets on this date
        }

        if (correct === "" || !Number.isFinite(Number(predML))) {
            out.push({
                ...row,
                _date: dateStr,
                _predML: predML,
                _correct: "",
                _stake: "",
                _result: "",
                _bankrollAfter: bankroll,
                _roiPct: "",
            });
            continue;
        }

        const ml = Number(predML);
        const stake = dayStake;
        const result = correct ? stake * (ml - 1) : -stake; // $ profit/loss
        bankroll += result;

        const roiPct = correct ? (ml - 1) * 100 : -100; // per your definition

        out.push({
            ...row,
            _date: dateStr,
            _predML: ml,
            _correct: correct,
            _stake: stake,
            _result: result,
            _bankrollAfter: bankroll,
            _roiPct: Math.round(roiPct),
        });
    }

    return out;
}

/* ───────── Component ───────── */
const Nba: React.FC = () => {
    const [mainData, setMainData] = useState<Row[]>([]);
    const [todayData, setTodayData] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [selectedIndexTop, setSelectedIndexTop] = useState<number | null>(null);
    const [selectedIndexBottom, setSelectedIndexBottom] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [m, d] = await Promise.all([
                    fetch(`${base}data/database.json`, { cache: "no-store" }),
                    fetch(`${base}data/dayOf.json`, { cache: "no-store" }),
                ]);
                if (!m.ok) throw new Error(`database.json ${m.status}`);
                if (!d.ok) throw new Error(`dayOf.json ${d.status}`);
                const jm = await m.json();
                const jd = await d.json();
                const rowsMain = pickRows(jm, PREFERRED_MAIN_TABLES);
                const rowsToday = pickRows(jd, PREFERRED_TODAY_TABLES);
                if (!cancelled) {
                    setMainData(rowsMain);
                    setTodayData(rowsToday);
                    setErr(null);
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message ?? "Failed to load data");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const simRows = useMemo(() => simulate(mainData), [mainData]);

    // ── Overall Results / Performance
    const perf = useMemo(() => {
        const finished = simRows.filter(r => r._result !== "");
        const totalBets = finished.length;
        const wins = finished.filter(r => r._correct === true).length;
        const losses = finished.filter(r => r._correct === false).length;
        const pnl = finished.reduce((a, r) => a + Number(r._result), 0);
        const finalBankroll = START_BANKROLL + pnl;
        const totalStake = finished.reduce((a, r) => a + Number(r._stake), 0);
        const avgRoi = totalStake > 0 ? (pnl / totalStake) * 100 : 0;
        const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
        return {
            totalBets,
            wins,
            losses,
            winRate: Math.round(winRate),
            pnl,
            finalBankroll,
            avgRoi: Math.round(avgRoi),
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

            {/* MAIN / History with bankroll columns */}
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
                            return (
                                <tr
                                    key={i}
                                    className={`${i % 2 === 0 ? "bg-[#2e2e2e]" : ""} hover:bg-amber-300 hover:text-black transition-colors cursor-pointer ${
                                        isSelected ? "bg-amber-300 text-black" : ""
                                    } text-center`}
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
                                    {/* Win % = per-bet ROI definition */}
                                    <td className="px-3 py-2">{row._roiPct === "" ? "" : `${row._roiPct}%`}</td>
                                    <td className="px-3 py-2">{row._stake === "" ? "" : money(row._stake)}</td>
                                    <td className="px-3 py-2 min-w-[120px]">
                                        {row._result === ""
                                            ? ""
                                            : (row._result as number) >= 0
                                                ? <span className="text-green-400">+{money(row._result)}</span>
                                                : <span className="text-red-400">-{money(Math.abs(row._result as number))}</span>}
                                    </td>
                                    <td className="px-3 py-2">{money(row._bankrollAfter)}</td>
                                </tr>
                            );
                        })}
                        {!simRows.length && (
                            <tr>
                                <td colSpan={13} className="px-4 py-6 text-center text-slate-400">
                                    No rows found in database.json
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TODAY */}
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
                                    className={`hover:bg-amber-300 hover:text-black transition-colors cursor-pointer ${
                                        isSelected ? "bg-amber-300 text-black" : i % 2 === 0 ? "bg-[#2e2e2e]" : ""
                                    }`}
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

            {/* OVERALL RESULTS / PERFORMANCE */}
            <section className="rounded-xl bg-[#1d1d1d] shadow-lg p-5 mb-6 mt-6">
                <div className="flex items-center justify-center gap-2 mb-5">
                    <h3 className="text-amber-300 text-xl md:text-2xl font-semibold tracking-wide">
                        OVERALL RESULTS
                    </h3>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

                    {/* Total P&L */}
                    <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-300">Total P&amp;L</p>
                            <span className="text-xl">📈</span>
                        </div>
                        <p className={`text-2xl font-extrabold mt-1 ${perf.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {perf.pnl >= 0 ? "+" : "-"}{money(Math.abs(perf.pnl))}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">Since start</p>
                    </div>

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
                        <p className="text-slate-400 text-sm mt-1">≥ 70 strength only</p>
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
