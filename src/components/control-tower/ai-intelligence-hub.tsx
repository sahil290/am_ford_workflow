"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  RefreshCcw,
  Zap,
  Search,
  MessageSquare,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Terminal,
  Activity,
} from "lucide-react";
import { ControlTowerSnapshot } from "@/modules/control-tower/domain/control-tower.types";

export function AIIntelligenceHub({
  snapshot,
}: {
  snapshot: ControlTowerSnapshot;
}) {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to the Command Console. I have analyzed your live inventory. What would you like to know?",
    },
  ]);

  const quickQueries = [
    "Delayed vehicles?",
    "Inventory total?",
    "Stage bottlenecks?",
  ];

  const generateResponse = (text: string) => {
    const q = text.toLowerCase();

    // Helper to get KPI value
    const getKPI = (code: string) =>
      snapshot.kpis.find((k) => k.code === code)?.value || "0";

    // 1. Detailed Insights / Full Audit
    if (
      q.includes("detailed") ||
      q.includes("insight") ||
      q.includes("audit") ||
      q.includes("summary")
    ) {
      const active = getKPI("active");
      const blocked = getKPI("blocked");
      const cycle = getKPI("cycle");
      const ready = getKPI("ready");

      const allRows = snapshot.stageGroups.flatMap((g) => g.rows);
      const bottleneck = [...allRows].sort(
        (a, b) => b.vehicles - a.vehicles,
      )[0];

      return `### STRATEGIC WORKSHOP AUDIT
      
**Current Posture:** Your pipeline is currently managing **${active} units**. Of these, **${blocked} units** are currently stalled, representing a ${Math.round((parseInt(blocked) / parseInt(active)) * 100)}% friction rate in your workflow.

**Performance Telemetry:**
• **Velocity:** Average cycle time is holding at **${cycle}**.
• **Output:** You have **${ready} units** finalized and ready for delivery.
• **Critical Friction:** The **${bottleneck.label}** stage is your primary pressure point with **${bottleneck.vehicles} vehicles** currently queued.

**Recommendation:** Focus immediate resources on clearing the ${bottleneck.label} backlog to reduce the global cycle time. Your blocked vehicle count is higher than target; I recommend a manual review of the warning flags in the Workflow Queue.`;
    }

    // 2. Inventory Deep Dive
    if (
      q.includes("inventory") ||
      q.includes("total") ||
      q.includes("how many")
    ) {
      const active = getKPI("active");
      const intakeCount =
        snapshot.stageGroups
          .find((g) => g.label === "Intake")
          ?.rows.reduce((acc, r) => acc + r.vehicles, 0) || 0;
      const workshopCount =
        snapshot.stageGroups
          .find((g) => g.label === "Workshop")
          ?.rows.reduce((acc, r) => acc + r.vehicles, 0) || 0;

      return `**Total Inventory:** You have **${active} active units**. 
      
**Distribution:**
• **Intake:** ${intakeCount} units awaiting processing.
• **Workshop:** ${workshopCount} units currently undergoing repair/inspection.
• **Balance:** The remaining units are in Detailing or awaiting final release.`;
    }

    // 3. Bottleneck Analysis
    if (
      q.includes("bottleneck") ||
      q.includes("slowest") ||
      q.includes("stuck")
    ) {
      const allRows = snapshot.stageGroups.flatMap((g) => g.rows);
      const top3 = [...allRows]
        .sort((a, b) => b.vehicles - a.vehicles)
        .slice(0, 3);

      return `**Top 3 Operational Bottlenecks:**
      
1. **${top3[0].label}:** ${top3[0].vehicles} units (Critical)
2. **${top3[1].label}:** ${top3[1].vehicles} units (Moderate)
3. **${top3[2].label}:** ${top3[2].vehicles} units (Minor)

**Analysis:** The concentration of vehicles in ${top3[0].label} suggests a resource mismatch or a delay in parts/approvals. Expediting these will significantly improve your TAT.`;
    }

    // 4. TAT / Performance
    if (
      q.includes("tat") ||
      q.includes("cycle") ||
      q.includes("time") ||
      q.includes("performance")
    ) {
      const cycle = getKPI("cycle");
      return `**Performance Report:** Your global cycle time is **${cycle}**. 
      
This indicates a steady flow, but any increase beyond this threshold will impact your delivery targets. I am monitoring the relationship between "Workshop Ready" and "Detail Intake" to ensure no vehicles are getting lost in the hand-off.`;
    }

    return "I am analyzing your query against the live telemetry. For a complete overview, please ask for a 'Detailed Insight' report, or inquire about specific 'Bottlenecks' or 'Inventory' counts.";
  };

  const handleAskAI = (q?: string) => {
    const text = q || query;
    if (!text.trim()) return;

    setMessages([...messages, { role: "user", content: text }]);
    setQuery("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: generateResponse(text),
        },
      ]);
    }, 800);
  };

  // Find biggest bottleneck for the Pulse card
  const allRows = snapshot.stageGroups.flatMap((g) => g.rows);
  const bottleneck = [...allRows].sort((a, b) => b.vehicles - a.vehicles)[0];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#f1f5f9] rounded-[30px] overflow-hidden border border-white shadow-2xl">
      {/* Header */}
      <div className="p-8 flex items-center gap-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
          AI Intelligence Hub
        </h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-8 gap-8 overflow-hidden">
        {/* Left: Command Console */}
        <div className="flex-1 flex flex-col bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  Command Console
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Direct Inventory Query
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Live Sync Active
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-blue-50 border border-blue-100" : "bg-gray-900"}`}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  ) : (
                    <UserIcon />
                  )}
                </div>
                <div
                  className={`max-w-[80%] p-5 rounded-2xl text-[13px] leading-relaxed shadow-sm border ${msg.role === "assistant"
                    ? "bg-white border-gray-100 text-gray-700"
                    : "bg-gray-900 text-white font-medium border-gray-800"
                    }`}
                >
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.content.split("\n").map((line, i) => {
                      if (line.startsWith("###"))
                        return (
                          <h3
                            key={i}
                            className="text-sm font-black text-gray-900 uppercase tracking-tight pt-2"
                          >
                            {line.replace("###", "")}
                          </h3>
                        );
                      if (line.startsWith("**"))
                        return (
                          <p key={i} className="font-bold">
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      if (line.startsWith("•"))
                        return (
                          <div key={i} className="flex gap-2 pl-2">
                            <span>•</span>
                            <span>{line.replace("•", "")}</span>
                          </div>
                        );
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-gray-50">
            <div className="relative flex items-center gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAskAI()}
                placeholder="E.G. 'HOW MANY VEHICLES ARE DELAYED?' OR 'SHOW ME ALL FORD MODELS'"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-sans"
              />
              <button
                onClick={() => handleAskAI()}
                className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-gray-900/20"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Ask AI
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Side Panels */}
        <div className="w-full lg:w-80 space-y-8 flex flex-col">
          {/* Operational Pulse */}
          <div className="bg-gray-900 rounded-[24px] p-8 text-white relative overflow-hidden shadow-2xl shadow-gray-900/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  Operational Pulse
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Automated Insights
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
              <p className="text-xs italic leading-relaxed text-gray-300 font-medium">
                "Based on your vehicle pipeline data, the most critical
                bottleneck appears to be the{" "}
                <span className="text-white font-black underline decoration-yellow-500/50">
                  '{bottleneck.label}'
                </span>{" "}
                stage, with{" "}
                <span className="text-white font-black">
                  {bottleneck.vehicles} vehicles
                </span>{" "}
                waiting to proceed to the next step. To improve flow today, I
                recommend that you prioritize and expedite completions for these
                units, aiming to clear at least 3-4 vehicles within the next 3-4
                hours to move the pipeline forward."
              </p>
            </div>

            <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/5">
              <RefreshCcw className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Refresh Pulse
              </span>
            </button>
          </div>

          {/* Quick Queries */}
          <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex-1">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">
              Quick Queries
            </h4>
            <div className="space-y-3">
              {quickQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskAI(q)}
                  className="w-full p-4 text-left rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all group flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-gray-600">{q}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      className="w-4 h-4 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
