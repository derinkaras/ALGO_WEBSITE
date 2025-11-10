// import {fetchDayOfJson, fetchMainJson} from "./DataApi.ts";

type rowType = {
    id: number;
    gameDate: string;
    teamOne: string,
    teamTwo: string,
    prediction: string,
    predictionStrength: number,
    winner: string,
    predictionCorrectness: number,
    homeML: number,
    awayML: number,
    predML?: number,
    correct?: string,
    winPer?: string,
    betAmount?: number,
    betRes?: number,
    currBankroll?: number
}

class ExecuteSimulation {
    database: string;
    simResults: rowType[]

    constructor(database: string) {
        this.database = database;
        this.simResults = []
    }

    private async loadMainJson(): Promise<any> {
        // if (this.database === "Live (Current)") {
        //     // 🔄 Build on server, wait, then fetch JSON
        //     return await fetchMainJson();
        // }
        // RESET LATER IF YOU WANT TO USE THE API

        if (this.database == "Live (Current)") {
            const res = await fetch("/data/database.json")
            return res.json()
        }

        const path =
            this.database === "2024 Database"
                ? "/data/2024Database.json"
                : "/data/2023Database.json";
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        return res.json();
    }

    private async loadDayOfJson(): Promise<any> {
        // if (this.database === "Live (Current)") {
        //     // 🔄 Build day-of on server, wait, then fetch JSON
        //     return await fetchDayOfJson();
        // }
        // RESET LATER IF YOU WANT TO USE THE API
        const res = await fetch("/data/dayOf.json"); // or another static fallback
        if (!res.ok) {
            return { tables: {} };
        }
        return res.json();
    }


    async executeSimulation(data: rowType[]){
        if (!data || data.length === 0) return data;

        const filtered = data.filter((game)=>game.winner !== "UNKNOWN")
        let bankroll = 3000
        let dayBankroll = 3000
        let dayStr = data[0].gameDate

        for (const game of filtered) {
            if (game.winner === "UNKNOWN") {
                continue
            }

            if (game.gameDate !== dayStr) {
                bankroll = dayBankroll
                dayStr = game.gameDate
            }

            const predML =  game.teamOne === game.prediction ? game.homeML : game.awayML
            game["predML"] = predML
            game["correct"] = game.predictionCorrectness === 1 ? "✔️" : "❌"

            const winPer = Math.round( (predML - 1) * 100 )
            game["winPer"] = game.predictionCorrectness === 0 ? "-100%" : `${winPer}%`

            game["betAmount"] = Number((bankroll * 0.4).toFixed(2))
            const betRes = game.correct === "❌" ? -game.betAmount! : Number((game.betAmount!*(winPer/100)).toFixed(2))
            game["betRes"] = betRes
            dayBankroll += betRes
            game["currBankroll"] = Number(dayBankroll.toFixed(2))
        }

        return filtered;
    }

    async getFavourites() {
        const data = await this.loadDayOfJson();
        return data.tables.day_of_predictions;
    }


    async getMainTable() {
        if (this.database === "Live (Current)") {
            const data = await this.loadMainJson();
            const filtered = data.tables.performance
                .filter((i: rowType) => i.predictionStrength >= 70);
            const res = await this.executeSimulation(filtered);
            this.simResults = res;
            return res;

        } else if (this.database === "2024 Database") {
            const cache = localStorage.getItem("2024 Database");
            if (cache) {
                try {
                    const data = JSON.parse(cache);
                    this.simResults = data;
                    return data;
                } catch {}
            }
            const response = await fetch("/data/2024Database.json");
            if (!response.ok) throw new Error("Failed to load JSON");
            const data = await response.json();
            const filtered = data.tables.performance
                .filter((i: rowType) => i.predictionStrength >= 70);
            const res = await this.executeSimulation(filtered);
            localStorage.setItem("2024 Database", JSON.stringify(res));
            this.simResults = res;
            return res;

        } else if (this.database === "2023 Database") {
            const cache = localStorage.getItem("2023 Database");
            if (cache) {
                try {
                    const data = JSON.parse(cache);
                    this.simResults = data;
                    return data;
                } catch {}
            }
            const response = await fetch("/data/2023Database.json");
            if (!response.ok) throw new Error("Failed to load JSON");
            const data = await response.json();
            const filtered = data.tables.performance
                .filter((i: rowType) => i.predictionStrength >= 70);
            const res = await this.executeSimulation(filtered);
            localStorage.setItem("2023 Database", JSON.stringify(res));
            this.simResults = res;
            return res;
        }
    }



    async getWinRate() {
        let wins = 0
        let losses = 0
        for (const game of this.simResults) {
            if (game.winner === "UNKNOWN") {
                continue;
            }
            if (game.predictionCorrectness === 1) {
                wins += 1
            } else {
                losses += 1
            }
        }
        return {wins, losses};
    }


}

export default ExecuteSimulation;
