import React, {useEffect, useState} from "react";
import ExecuteSimulation from "../services/ExecuteSimulation.ts"

const Mlb = () => {
    const TABS = ["Live (Current)", "2024 Database", "2023 Database"]
    const [loading, setLoading] = useState<boolean>(false)

    type TabStatus = typeof TABS[number]
    type Row = Record<string, any>;
    type SimRow = Row & {
        _date: string;
        _predML: number | "";
        _correct: boolean | "";
        _stake: number | "";
        _result: number | "";
        _bankrollAfter: number;
        _roiPct: number | "";
    };

    const [currTab, setCurrTab] = useState<TabStatus>("Live (Current)")
    const [databaseTableData, setDatabaseTableData] = useState<SimRow[]>([])
    const [todaysFavData, setTodaysFavData] = useState<SimRow[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [selectedIndexBottom, setSelectedIndexBottom] = useState<number | null>(null);
    const [winRate, setWinRate] = useState<Record<string, number>>({})

    useEffect(() => {
        const run = async ()=>{
            setLoading(true)
            setSelectedIndex(null)
            setSelectedIndexBottom(null)
            if (currTab) {
                const sim = new ExecuteSimulation(currTab);
                const data = await sim.getMainTable()
                setDatabaseTableData(data)
                const dayData = await sim.getFavourites()
                setTodaysFavData(dayData)
                const winRate = await sim.getWinRate()
                setWinRate(winRate)
            }
            setLoading(false)
        }
        run()
    }, [currTab])

    return (
        <div className="w-full max-w-[1400px] xl:max-w-[1500px] mx-auto px-4 md:px-8 py-6">
            <div className="mb-4 flex flex-col items-center gap-3">
                <h2 className="text-xl font-semibold text-amber-300 tracking-wide">VIEW DATASET</h2>
                {/*TABS*/}
                <div className="flex flex-wrap items-center gap-2">
                    {TABS.map((tab: TabStatus) => {
                        const active = tab === currTab
                        return (
                            <button
                                key={tab}
                                onClick={() => setCurrTab(tab)}
                                className={[
                                    "px-3 py-1.5 rounded-lg border transition-colors text-sm",
                                    active
                                        ? "bg-amber-300 text-black border-amber-300"
                                        : "bg-[#242424] text-slate-200 border-white/10 hover:bg-[#2e2e2e]",
                                ].join(" ")}
                                aria-pressed={active}
                            >
                                {tab}
                            </button>
                        )
                    })}
                </div>
            </div>

            {loading ? (
                <div className="px-6 py-10 text-center text-slate-200">
                    <p className="opacity-70 mt-2">Loading data…</p>
                </div>
            ): (
                <div>
                    <div className="rounded-xl bg-[#1d1d1d] shadow-lg overflow-hidden">
                        <div className="overflow-auto max-h-[600px]">
                            <table className="min-w-[1400px] text-slate-100 text-sm">
                                <thead className="sticky top-0 z-20 bg-emerald-700">
                                <tr className="text-center">
                                    <th className="px-3 py-2 sticky left-0 bg-emerald-700 z-30 text-center whitespace-nowrap">Game Date</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Home Team</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Visitor Team</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Prediction</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Prediction Strength</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Home ML</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Away ML</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Pred ML</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Correct</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Win %</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Bet Amount</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Bet Result</th>
                                    <th className="px-3 py-2 text-center whitespace-nowrap">Current Bankroll</th>
                                </tr>
                                </thead>
                                <tbody>
                                {databaseTableData.map((row,index)=> {
                                    const isSelected = selectedIndex === index;
                                    return (
                                        <tr
                                            key={index}
                                            className={`${index % 2 === 0 ? "bg-[#2e2e2e]" : ""} hover:bg-amber-300 hover:text-black transition-colors cursor-pointer ${isSelected ? "bg-amber-300 text-black" : ""} text-center`}
                                            onClick={() => setSelectedIndex(isSelected ? null : index)}
                                        >
                                            <td className={`px-3 py-2 sticky left-0 z-10 ${isSelected ? "bg-amber-300" : "bg-emerald-700"} text-center whitespace-nowrap`}>{row.gameDate || row._date}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.teamOne}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.teamTwo}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.prediction}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.predictionStrength}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.homeML}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.awayML}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.predML}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.correct}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.winPer}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{`$${row.betAmount}`}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{`$${row.betRes}`}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{`$${row.currBankroll}`}</td>


                                        </tr>
                                    );
                                })}
                                {!databaseTableData.length && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                                            No rows to display.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {currTab === "Live (Current)" && (
                        <div className="rounded-xl bg-[#1d1d1d] shadow-lg p-4 mt-4">
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
                                    {todaysFavData.map((row, index) => {
                                        const isSelected = selectedIndexBottom === index;

                                        // Try both MLB/NBA-style keys gracefully
                                        const home = row.homeTeam ;
                                        const away = row.awayTeam ;
                                        const pred = row.prediction ;
                                        const strength = row.predictionStrength
                                        const homeML = row.homeML
                                        const awayML = row.awayML ;
                                        const ml = String(pred).toLowerCase() === String(home).toLowerCase() ? homeML :
                                            String(pred).toLowerCase() === String(away).toLowerCase() ? awayML :
                                                (row.ml ?? row.moneyline ?? "");

                                        return (
                                            <tr
                                                key={index}
                                                className={`hover:bg-amber-300 hover:text-black transition-colors cursor-pointer ${
                                                    isSelected ? "bg-amber-300 text-black" : index % 2 === 0 ? "bg-[#2e2e2e]" : ""
                                                }`}
                                                onClick={() => setSelectedIndexBottom(isSelected ? null : index)}
                                            >
                                                <td className="px-3 py-2 text-left">{`${away || "Away"} @ ${home || "Home"}`}</td>
                                                <td className="px-3 py-2 text-center">{String(pred)}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {Number.isFinite(Number(strength)) ? Math.round(Number(strength)) : String(strength)}
                                                </td>
                                                <td className="px-3 py-2 text-center">{String(ml)}</td>
                                            </tr>
                                        );
                                    })}

                                    {!todaysFavData.length && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                                No rows found for today
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {databaseTableData.length > 0 && (
                        <section className="rounded-xl bg-[#1d1d1d] shadow-lg p-5 mb-6 mt-6">
                            <div className="flex items-center justify-center gap-2 mb-5">
                                <h3 className="text-amber-300 text-xl md:text-2xl font-semibold tracking-wide">
                                    OVERALL RESULTS
                                </h3>
                            </div>

                            <div className="grid grid-cols-1  lg:grid-cols-4 gap-4">
                                {/* Final Bankroll */}
                                <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-300">Final Bankroll</p>
                                        <span className="text-xl">💼</span>
                                    </div>
                                    <p className="text-amber-300 text-2xl font-extrabold mt-1">
                                        {`$${Number(databaseTableData.at(-1)?.currBankroll ?? 0).toFixed(2)}`}
                                    </p>
                                    {/* PnL line (derived from betRes) */}
                                    {(() => {
                                        const pnl = databaseTableData.reduce((a: number, r: any) => a + Number(r.betRes ?? 0), 0);
                                        const up = pnl >= 0;
                                        return (
                                            <p className={`mt-1 text-sm ${up ? "text-green-400" : "text-red-400"}`}>
                                                {up ? "▲ +" : "▼ -"}${Math.abs(pnl).toFixed(2)}
                                            </p>
                                        );
                                    })()}
                                </div>

                                {/* Win Rate */}
                                <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-300">Win Rate</p>
                                        <span className="text-xl">🏆</span>
                                    </div>
                                    {(() => {
                                        const wins = Number(winRate?.wins ?? 0);
                                        const losses = Number(winRate?.losses ?? 0);
                                        const wr = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
                                        return (
                                            <>
                                                <p className="text-amber-300 text-2xl font-extrabold mt-1">{wr}%</p>
                                                <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500"
                                                        style={{ width: `${Math.min(100, Math.max(0, wr))}%` }}
                                                    />
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Total Bets */}
                                <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-300">Total Bets</p>
                                        <span className="text-xl">🎯</span>
                                    </div>
                                    <p className="text-amber-300 text-2xl font-extrabold mt-1">
                                        {Number(winRate?.wins ?? 0) + Number(winRate?.losses ?? 0)}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">Completed bets</p>
                                </div>

                                {/* W / L */}
                                <div className="bg-[#242424] rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-slate-300">W / L</p>
                                        <span className="text-xl">⚖️</span>
                                    </div>
                                    <p className="text-2xl font-extrabold mt-1">
                                        <span className="text-green-400">{Number(winRate?.wins ?? 0)}</span>
                                        <span className="text-slate-400"> / </span>
                                        <span className="text-red-400">{Number(winRate?.losses ?? 0)}</span>
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">From service totals</p>
                                </div>
                            </div>
                        </section>
                    )}


                </div>
            )}

        </div>
    );
};

export default Mlb;