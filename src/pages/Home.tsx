import { Link } from "react-router-dom";
import icons from "../constants/icons";

const Home = () => {
    return (
        <main className="bg-[#242424]">
            {/* HERO */}
            <section className="relative overflow-hidden bg-brand-green">
                {/* subtle gradient glow */}
                <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute -top-20 -left-24 w-[40rem] h-[40rem] rounded-full bg-brand-yellow blur-[120px]" />
                    <div className="absolute -bottom-24 -right-24 w-[36rem] h-[36rem] rounded-full bg-emerald-400 blur-[140px]" />
                </div>

                <div className="relative mx-auto max-w-[1200px] xl:max-w-[1400px] px-6 py-14 md:py-20">
                    <div className="grid items-center md:grid-cols-2 gap-10">
                        {/* Copy */}
                        <div>
                            <div className="flex items-center gap-3">
                                <img src={icons.robot} alt="ALGO" className="size-10" />
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                                    <span className="text-brand-yellow">AL</span>GO
                                </h1>
                            </div>

                            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-[60ch]">
                                A disciplined, data-driven model for NBA predictions. We engineer
                                hundreds of features per team, match them across opponents, and run
                                a tested selection algorithm that has shown consistent performance
                                on historical data.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link
                                    to="/nba"
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-yellow px-5 py-3 font-semibold text-brand-green shadow-[0_8px_0_rgba(0,0,0,0.25)] hover:translate-y-[1px] hover:shadow-[0_6px_0_rgba(0,0,0,0.25)] transition"
                                >
                                    View NBA Model
                                    <span aria-hidden>📈</span>
                                </Link>
                                <Link
                                    to="/mlb"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/15 transition"
                                >
                                    MLB (coming soon)
                                    <span aria-hidden>⚾</span>
                                </Link>
                                <a
                                    href="https://github.com/derinkaras/AlgoWebsite"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold text-white/90 hover:bg-white/10 transition"
                                >
                                    GitHub
                                    <span aria-hidden>↗</span>
                                </a>
                            </div>

                            {/* daily refresh note */}
                            <div className="mt-6 text-sm text-white/90">
                <span className="rounded-full bg-black/20 px-3 py-1">
                  ⭐ Favourites update every day at <b>12:05 AM (MT)</b>
                </span>
                            </div>
                        </div>

                        {/* Illustration / stat preview */}
                        <div className="relative">
                            <div className="rounded-2xl bg-[#1b1b1b] border border-white/10 p-5 shadow-xl">
                                <header className="flex items-center justify-between">
                                    <div className="text-white/90 font-semibold">Model Preview</div>
                                    <div className="text-xs text-white/50">live metrics</div>
                                </header>

                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    <PreviewCard title="Final Bankroll" value="$3,348" accent="text-amber-300" sub="+$348 P&L" />
                                    <PreviewCard title="Win Rate" value="100%" accent="text-emerald-400" sub="≥ 70 strength" />
                                    <PreviewCard title="Avg ROI / Bet" value="14%" accent="text-emerald-400" sub="decimal odds" />
                                </div>

                                <div className="mt-5 rounded-xl bg-[#141414] p-4 border border-white/5">
                                    <div className="flex items-center justify-between text-sm text-white/70">
                                        <span>Model History</span>
                                        <span>Today’s Favourites</span>
                                    </div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full w-2/3 bg-emerald-500" />
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full w-1/3 bg-amber-400" />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-white/60">
                                    * Numbers sync with the NBA page simulation cards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY ALGO WORKS */}
            <section className="mx-auto max-w-[1200px] xl:max-w-[1400px] px-6 py-12 md:py-16">
                <h2 className="text-center text-2xl md:text-3xl font-bold text-white">
                    Why <span className="text-brand-yellow">AL</span>GO works
                </h2>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Feature
                        emoji="🧠"
                        title="Rich Feature Set"
                        text="Hundreds of datapoints per team: pace, shot profiles, matchup-specific efficiencies, rolling form, rest, travel, lineup context, and more."
                    />
                    <Feature
                        emoji="🤝"
                        title="Matchup-Aware"
                        text="We align opponent feature spaces (team vs. team) so comparable stats face each other—reducing noise and highlighting true edges."
                    />
                    <Feature
                        emoji="🧪"
                        title="Tested & Consistent"
                        text="Selection logic is stress-tested on historical seasons to avoid overfitting. Results are summarized as bankroll, ROI, and win-rate."
                    />
                    <Feature
                        emoji="📏"
                        title="Disciplined Risk"
                        text="Flat daily stake (40% of day-start) + confidence filter (≥70). ROI is calculated with decimal odds for transparent expectations."
                    />
                </div>

                {/* How it works timeline */}
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <Step
                        n={1}
                        title="Ingest & Transform"
                        text="Pull and clean game, team, and player signals. Build rolling windows and opponent-normalized features."
                    />
                    <Step
                        n={2}
                        title="Score & Select"
                        text="Compute prediction strength per matchup. Select only plays that meet strict thresholds and pass sanity checks."
                    />
                    <Step
                        n={3}
                        title="Simulate & Report"
                        text="Simulate bankroll with clear staking rules and show transparent performance summaries on the NBA page."
                    />
                </div>

                {/* trust strip */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-white/70">
                    <Badge>Confidence ≥ 70 only</Badge>
                    <Badge>Decimal odds ROI</Badge>
                    <Badge>Daily refresh 12:05 AM (MT)</Badge>
                    <Badge>Consistent historical results</Badge>
                </div>
            </section>

            {/* CTA STRIP */}
            <section className="mx-auto max-w-[1200px] xl:max-w-[1400px] px-6 pb-10">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#1b1b1b] to-[#161616] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Ready to see today’s edges?</h3>
                        <p className="text-white/70 mt-1">
                            The model updates nightly. “Favourites Today” is refreshed at <b>12:05 AM MT</b>.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/nba"
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-yellow px-5 py-3 font-semibold text-brand-green shadow-[0_8px_0_rgba(0,0,0,0.25)] hover:translate-y-[1px] hover:shadow-[0_6px_0_rgba(0,0,0,0.25)] transition"
                        >
                            Open NBA Model
                            <span aria-hidden>➡️</span>
                        </Link>
                        <a
                            href="https://github.com/derinkaras/AlgoWebsite"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold text-white/90 hover:bg-white/10 transition"
                        >
                            View Source
                            <span aria-hidden>↗</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER (tighter) */}
            <footer className="border-t border-white/10 py-4 text-center text-white/60 text-sm">
                <div className="mx-auto max-w-[1200px] px-6">
                    Built with <span className="text-white">React + Vite + Tailwind</span>. © {new Date().getFullYear()} ALGO.
                </div>
            </footer>
        </main>
    );
};

export default Home;

/* ——— Small presentational components ——— */

function Feature({ emoji, title, text }: { emoji: string; title: string; text: string }) {
    return (
        <div className="rounded-xl bg-[#1b1b1b] border border-white/10 p-5 hover:-translate-y-[2px] transition">
            <div className="text-2xl">{emoji}</div>
            <h3 className="mt-3 text-white font-semibold">{title}</h3>
            <p className="mt-1 text-white/70 text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
    return (
        <div className="rounded-xl bg-[#1b1b1b] border border-white/10 p-5">
            <div className="flex items-center gap-3">
                <div className="grid place-items-center size-8 rounded-full bg-brand-yellow text-brand-green font-bold">
                    {n}
                </div>
                <h4 className="text-white font-semibold">{title}</h4>
            </div>
            <p className="mt-2 text-white/70 text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-xs rounded-full bg-white/10 text-white px-3 py-1 border border-white/10">
      {children}
    </span>
    );
}

function PreviewCard({
                         title,
                         value,
                         sub,
                         accent = "text-amber-300",
                     }: {
    title: string;
    value: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="rounded-xl bg-[#141414] border border-white/5 p-4">
            <p className="text-xs text-white/60">{title}</p>
            <p className={`mt-1 text-2xl font-extrabold ${accent}`}>{value}</p>
            {sub ? <p className="mt-1 text-xs text-white/50">{sub}</p> : null}
        </div>
    );
}
