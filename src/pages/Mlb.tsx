import React, {useState} from "react";

const Mlb = () => {
    const TABS = ["Live (Current)", "2024 Database", "2023 Database"]
    type TabStatus = typeof TABS[number]

    const [currTab, setCurrTab] = useState<TabStatus>("Live (Current)")

    return (
        <div>
            <div className="flex flex-row justify-center items-center mt-6">
                <h2 className="text-xl font-semibold text-amber-300 tracking-wide">VIEW DATASET</h2>
            </div>
            {/*TABS*/}
            <div className="flex flex-row justify-center items-center mt-3 gap-2">
                {
                   TABS.map((tab: TabStatus) => {
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
                    })
                }

            </div>

        </div>
    );
};

export default Mlb;
