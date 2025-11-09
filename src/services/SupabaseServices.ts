import {supabase} from "../supabaseClient.ts";
import type {BetRow, UserBetRow} from "../types";

export const fetchBets = async () => {
    // Since I have RLS this will only fetch the users rows and the eq is not needed
    const {data, error} = await supabase.from("bets_placed").select("*")
    if (error) {
        console.log("There was a problem with fetching the users bets placed: ",error)
    } else {
        return data
    }
}

export const submitBet = async (userId: string, bet: BetRow, betAmount: number ) => {
    const {data, error} = await supabase.from("bets_placed").insert([{
        user_id : userId,
        ...bet,
        bet_amount : betAmount,
    }]).select().single()
    if (error) {
        console.log("There was a problem submitting a user bet: ", error);
    } else {
        return data
    }
}


export const editBet = async (
    betId: number,
    betAmount: number
): Promise<UserBetRow | null> => {
    const { data, error } = await supabase
        .from("bets_placed")
        .update({ bet_amount: betAmount })
        .eq("id", betId)
        .select()
        .single(); // ← returns updated row

    if (error) {
        console.error("There was a problem updating user bet: ", error);
        return null;
    }
    return data;
};

export const deleteBet = async (betId: number) => {
    const {error} = await supabase.from("bets_placed").delete().eq("id", betId);
    if (error) {
        console.error("There was a problem deleted user bet: ", error);
    }
}