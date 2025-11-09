import {useEffect, useState} from "react";
import {deleteBet, editBet, submitBet} from "../services/SupabaseServices.ts";
import type { UserBetRow } from "../types";
import { useAuth } from "../contexts/AuthContext.tsx";
import icons from "../constants/icons.ts";

type Mode = "Add" | "Edit";

type AddOrEditBetProps = {
    mode: Mode;
    draft: UserBetRow | null;
    onClose: () => void;
    setUserBets: React.Dispatch<React.SetStateAction<UserBetRow[]>>;
};

const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const AddOrEditBet = ({ mode, draft, onClose, setUserBets }: AddOrEditBetProps) => {
    const { session } = useAuth();

    const [betAmount, setBetAmount] = useState("");
    const [betAmountError, setBetAmountError] = useState("");

    useEffect(() => {
        if (mode === "Edit") {
            setBetAmount(String(draft.bet_amount));
        } else if (mode === "Add") {
            setBetAmount("");
        }
    }, [mode, draft]);

    const handleSubmit = async () => {
        try {
            if (!session) throw new Error("Please sign in to continue.");
            if (!draft) throw new Error("No game selected.");
            const amt = Number(betAmount);
            if (Number.isNaN(amt) || amt <= 0) throw new Error("Bet amount is invalid, please try again.");

            if (mode === "Add") {
                const data = await submitBet(session.user.id, draft, amt);
                if (!data) throw new Error("There was an issue submitting your bet, please try again.");
                setUserBets((prev) => [data, ...prev]);
                onClose();
                return;
            }

            if (mode === "Edit") {
                if (!draft.id) throw new Error("Missing bet id.");
                const updated = await editBet(draft.id, amt);
                // fallback to amt if API didn’t return the row for any reason
                setUserBets((prev) =>
                    prev.map((b) => (b.id === draft.id ? { ...b, bet_amount: updated?.bet_amount ?? amt } : b))
                );
                onClose();
                return;
            }
        } catch (err: any) {
            setBetAmount("");
            setBetAmountError(err?.message ?? "Something went wrong.");
        }
    };

    const handleDelete = async () => {
        if (draft && draft.id) {
            await deleteBet(draft.id)
            setUserBets((prev) => prev.filter((b) => b.id !== draft.id))
            onClose()
            return
        }

    }

    if (!draft) {
        return (
            <div className="rounded-2xl bg-[#1f1f1f] border border-white/10 p-4 text-slate-200">
                <p className="mb-4">No game selected, click on one of today's favourites to select.</p>
                <button className="px-4 py-2 rounded-lg bg-amber-300 text-black" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    }

    return (
        <div
            className="
      w-full h-full bg-[#1f1f1f] rounded-2xl shadow-2xl
      px-10 py-12 flex flex-col items-center justify-center
      space-y-8 border border-white/10
    "
        >
            {/* Header */}
            <div className="flex flex-col items-center justify-center space-y-2">
                <h3 className="text-4xl font-bold text-amber-300 text-center leading-tight">
                    {mode === "Add" ? "Add Bet" : "Edit Bet"}
                </h3>
                <button
                    className="text-slate-400 hover:text-white text-sm"
                    onClick={onClose}
                >
                    Cancel
                </button>
                {mode === "Edit" && (
                    <img
                        src = {icons.trash}
                        className="size-8"
                        onClick={handleDelete}
                    />
                )}
            </div>

            {/* Summary */}
            <div className="w-full max-w-4xl overflow-auto rounded-xl border border-white/10 bg-[#242424] p-6">
                <table className="w-full text-slate-100 text-sm text-center">
                    <thead className="bg-emerald-700">
                    <tr>
                        <th className="px-4 py-2 text-left">Matchup</th>
                        <th className="px-4 py-2">Prediction</th>
                        <th className="px-4 py-2">Strength</th>
                        <th className="px-4 py-2">Money Line</th>
                        <th className="px-4 py-2">Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr className="bg-[#2e2e2e] text-left">
                        <td className="px-4 py-2">{`${draft.away_team} @ ${draft.home_team}`}</td>
                        <td className="px-4 py-2 text-center">{String(draft.prediction)}</td>
                        <td className="px-4 py-2 text-center">
                            {Number(draft.prediction_strength).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                            {Number(draft.ml).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">{fmtDate(draft.created_at)}</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* Input + Submit */}
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <input
                    value={betAmount}
                    inputMode="decimal"
                    placeholder="Enter bet amount"
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-[#242424] px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-300/50"
                />
                <button
                    onClick={handleSubmit}
                    className="rounded-lg bg-amber-300 text-black font-semibold px-6 py-3 hover:bg-amber-400 transition"
                >
                    Submit
                </button>
            </div>

            {/* Error */}
            {betAmountError && (
                <p className="text-red-400 text-sm font-medium text-center mt-2">
                    {betAmountError}
                </p>
            )}
        </div>
    );


};

export default AddOrEditBet;
