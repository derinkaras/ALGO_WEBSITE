import {useEffect, useState} from "react";
import ExecuteSimulation from "../services/ExecuteSimulation.ts"
import {useAuth} from "../contexts/AuthContext.tsx";
import icons from "../constants/icons.ts";
import type {UserBetRow} from "../types";
import {fetchBets} from "../services/SupabaseServices.ts";
import Modal from "../components/Modal.tsx";
import AddOrEditBet from "../components/AddOrEditBet.tsx";

const Mlb = () => {
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<"Add" | "Edit">("Add");

    const openAddModal = () => {
        setModalMode("Add");
        // if you want to prefill from a selected favourite, keep selectedGame as set in the favourites table; otherwise clear:
        // setSelectedGame(null);
        setShowModal(true);
    };


    const openEditModal = (bet: UserBetRow) => {
        setModalMode("Edit");
        setSelectedGame(bet);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedGame(null); // optional but recommended

    };


    const [userBets, setUserBets] = useState<UserBetRow[]>([]);
    const fmtDate = (d?: string) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
    const n2 = (n: any) =>
        n === null || n === undefined || isNaN(Number(n)) ? "—" : Number(n).toFixed(2);



    const TABS = ["Live (Current)", "2024 Database", "2023 Database"]
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

    const [loading, setLoading] = useState<boolean>(false)
    const {session} = useAuth()

    const [currTab, setCurrTab] = useState<TabStatus>("Live (Current)")
    const [databaseTableData, setDatabaseTableData] = useState<SimRow[]>([])
    const [todaysFavData, setTodaysFavData] = useState<SimRow[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [winRate, setWinRate] = useState<Record<string, number>>({})

    // Selected index bottom and show addition will work together
    const [selectedIndexBottom, setSelectedIndexBottom] = useState<number | null>(null);
    const [selectedGame, setSelectedGame] = useState<UserBetRow | null>(null);


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


    useEffect(() => {
        const fetch = async () => {
            if (session) {
                console.log("Gets here")
                const bets = await fetchBets()
                if (bets) {
                    setUserBets(bets)
                }
            }
        }
        fetch()
    }, [session]);



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
                                                onClick={() => {
                                                    setSelectedIndexBottom(isSelected ? null : index)
                                                    setSelectedGame({
                                                        home_team: home,
                                                        away_team: away,
                                                        prediction: pred,
                                                        prediction_strength: strength,
                                                        ml
                                                    })
                                                }}
                                            >
                                                <td className="px-3 py-2 text-left">{`${away} @ ${home}`}</td>
                                                <td className="px-3 py-2 text-center">{pred}</td>
                                                <td className="px-3 py-2 text-center relative group">
                                                    {session ? (
                                                        strength
                                                    ) : (
                                                        <>
                                                            {/* Blurred placeholder value */}
                                                            <span className="blur-sm select-none inline-block w-full">{String(strength ?? "—")}</span>

                                                            {/* Hover overlay */}
                                                            <div
                                                                className="
                                                                  absolute inset-0 flex items-center justify-center
                                                                  bg-black/70 text-amber-300 text-[11px] sm:text-xs font-medium
                                                                  rounded opacity-0 group-hover:opacity-100 transition-opacity
                                                                  pointer-events-none
                                                                "
                                                            >
                                                                Sign in to view
                                                            </div>
                                                        </>
                                                    )}
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
                    {(session && currTab === "Live (Current)") && (
                        <div className="rounded-xl bg-[#1d1d1d] shadow-lg p-5 mb-6 mt-6 flex flex-col justify-center items-center">

                            {/*TITLE*/}
                            <div className="flex justify-center items-center">
                                <h3 className="text-amber-300 text-xl md:text-2xl font-semibold tracking-wide">
                                    RECORD BETS
                                </h3>
                            </div>

                            {/*Main Display*/}
                            <div>
                                <button
                                    onClick={openAddModal}
                                >
                                    <img
                                        src={icons.plus}
                                        className="size-6 contain-content hover:cursor-pointer"
                                    />
                                </button>

                                <div className="mt-4 rounded-xl border border-white/10 bg-[#242424]">
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <h4 className="text-amber-300 font-semibold">Your Bets</h4>
                                        <span className="text-xs text-slate-400">{userBets.length} total</span>
                                    </div>

                                    {/* Responsive scroll area: ~3 cards on mobile, taller on desktop */}
                                    <div className="
                                        px-3 pb-3
                                        overflow-y-auto
                                        max-h-[500px]          /* ~3 cards on mobile */
                                        sm:max-h-[650px]
                                        lg:max-h-[800px]
                                      ">
                                        {/* Responsive grid of cards */}
                                        <div
                                            className="
                                                grid gap-3
                                                grid-cols-1
                                                sm:grid-cols-2
                                                lg:grid-cols-3
                                                xl:grid-cols-4
                                              "
                                            role="list"
                                        >
                                            {userBets.length === 0 && (
                                                <div className="col-span-full text-center text-slate-400 py-6">
                                                    No bets recorded yet.
                                                </div>
                                            )}

                                            {userBets.map((bet: UserBetRow, i) => (
                                                <div
                                                    key={bet.id ?? i}
                                                    className="rounded-lg bg-[#2e2e2e] border border-white/5 p-3"
                                                    role="listitem"
                                                    onClick={()=>openEditModal(bet)}
                                                >
                                                    {/* Header: Date + Stake */}
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-slate-400">{fmtDate(bet.created_at)}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Stake: <span className="text-slate-200">${n2(bet.bet_amount)}</span>
                                                        </p>
                                                    </div>

                                                    {/* Matchup */}
                                                    <p className="mt-1 text-sm text-slate-200 break-words">
                                                        <span className="font-medium">{bet.away_team}</span>
                                                        <span className="text-slate-400"> @ </span>
                                                        <span className="font-medium">{bet.home_team}</span>
                                                    </p>

                                                    {/* Info grid */}
                                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                        <div className="rounded-md bg-[#242424] border border-white/5 p-2">
                                                            <p className="text-slate-400">Pick</p>
                                                            <p className="text-slate-100">{String(bet.prediction ?? "—")}</p>
                                                        </div>
                                                        <div className="rounded-md bg-[#242424] border border-white/5 p-2">
                                                            <p className="text-slate-400">Strength</p>
                                                            <p className="text-slate-100">{n2(bet.prediction_strength)}</p>
                                                        </div>
                                                        <div className="rounded-md bg-[#242424] border border-white/5 p-2">
                                                            <p className="text-slate-400">Money Line</p>
                                                            <p className="text-slate-100">{n2(bet.ml)}</p>
                                                        </div>
                                                        <div className="rounded-md bg-[#242424] border border-white/5 p-2">
                                                            <p className="text-slate-400">Date</p>
                                                            <p className="text-slate-100">{fmtDate(bet.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal */}
                            {showModal && (
                                <Modal
                                    handleCloseModal={closeModal}
                                    size="lg"
                                >
                                    <AddOrEditBet
                                        mode={modalMode}
                                        draft={selectedGame}
                                        onClose={closeModal}
                                        setUserBets={setUserBets}
                                    />
                                </Modal>
                            )}

                        </div>

                    )}

                </div>
            )}

        </div>
    );
};

export default Mlb;