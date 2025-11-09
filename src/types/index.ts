export type BetRow = {
    home_team: string,
    away_team: string,
    prediction: number,
    prediction_strength: number,
    ml: number
}

export type UserBetRow = BetRow & {
    id: number;
    created_at: string;
    bet_amount: number
};
