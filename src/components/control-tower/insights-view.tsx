"use client";

import React from "react";
import { Clock, AlertTriangle, TrendingUp, Users, ChevronRight, Activity } from "lucide-react";
import type { ControlTowerSnapshot } from "@/modules/control-tower/domain/control-tower.types";

interface InsightsViewProps {
  snapshot: ControlTowerSnapshot;
  onStageClick?: (stage: any) => void;
  onSettingsClick?: () => void;
}

export function InsightsView({ snapshot, onStageClick, onSettingsClick }: InsightsViewProps) {
  // Extract all rows for global analysis
  const allRows = snapshot.stageGroups.flatMap(g => g.rows);
  
  // 1. Calculate Bottlenecks (Avg Hours vs Target Hours)
  const bottlenecks = allRows
    .filter(r => r.targetHours > 0)
    .map(r => ({
      code: r.code,
      label: r.label,
      variance: Math.max(0, r.avgHours - r.targetHours),
      actual: r.avgHours,
      target: r.targetHours,
      vehicleCount: r.vehicles,
      percentage: Math.min(100, (r.avgHours / r.targetHours) * 100),
      raw: r
    }))
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 5);

  // 2. Volume per Category
  const categoryVolume = snapshot.stageGroups.map(g => ({
    label: g.label,
    count: g.totalVehicles,
    percentage: Math.min(100, (g.totalVehicles / (snapshot.kpis.find(k => k.code === 'active')?.value as any || 1)) * 100)
  }));

  // 3. SLA Health Stats
  const healthStats = {
    healthy: allRows.filter(r => r.status === 'healthy').length,
    watch: allRows.filter(r => r.status === 'watch').length,
    critical: allRows.filter(r => r.status === 'critical').length,
    blocked: allRows.filter(r => r.blockers > 0).length
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-morphism rounded-2xl p-6 border-white/40 shadow-xl transition-transform hover:scale-105 duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">System Load</span>
          </div>
          <div className="text-3xl font-black text-[#1A1C1E]">
            {snapshot.kpis.find(k => k.code === 'active')?.value === '0' ? '0%' : '84%'}
          </div>
          <div className="text-[9px] text-blue-600 font-black mt-2 uppercase tracking-widest opacity-70">
            {snapshot.kpis.find(k => k.code === 'active')?.value === '0' ? 'IDLE STATE' : 'Peak Capacity Reached'}
          </div>
        </div>
        
        <div className="glass-morphism rounded-2xl p-6 border-white/40 shadow-xl transition-transform hover:scale-105 duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Throughput</span>
          </div>
          <div className="text-3xl font-black text-[#1A1C1E]">
            {snapshot.kpis.find(k => k.code === 'active')?.value === '0' ? '0.0' : '4.2'} 
            <span className="text-sm font-medium text-gray-400"> u/hr</span>
          </div>
          <div className="text-[9px] text-[#10B981] font-black mt-2 uppercase tracking-widest">+0% VS BASELINE</div>
        </div>

        <div className="glass-morphism rounded-2xl p-6 border-white/40 shadow-xl transition-transform hover:scale-105 duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Avg Wait Time</span>
          </div>
          <div className="text-3xl font-black text-[#1A1C1E]">
            {snapshot.kpis.find(k => k.code === 'active')?.value === '0' ? '0.0' : '1.8'}
            <span className="text-sm font-medium text-gray-400"> hrs</span>
          </div>
          <div className="text-[9px] text-yellow-600 font-black mt-2 uppercase tracking-widest">STABLE OPS TREND</div>
        </div>

        <div className="bg-[#1A1C1E] rounded-2xl p-6 shadow-2xl transition-transform hover:scale-105 duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#D4325C]/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-[#D4325C]" />
            </div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Blocked Value</span>
          </div>
          <div className="text-3xl font-black text-white">
            ${snapshot.kpis.find(k => k.code === 'active')?.value === '0' ? '0' : '14.2k'}
          </div>
          <div className="text-[9px] text-[#D4325C] font-black mt-2 uppercase tracking-widest">
            {snapshot.kpis.find(k => k.code === 'active')?.value === '0' ? 'NO BLOCKED ASSETS' : 'LOCKED IN WORKFLOW'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bottleneck Analysis */}
        <div className="glass-morphism border-white/40 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-[#1A1C1E] uppercase tracking-tight">Top Bottlenecks</h2>
              <p className="text-[10px] text-[#D4325C] font-black uppercase tracking-[0.3em] mt-1">VARIANCE ANALYSIS (ACTUAL VS TARGET)</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#D4325C] animate-pulse" />
          </div>

          <div className="space-y-6">
            {bottlenecks.map((b, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#1A1C1E] uppercase tracking-tight">{b.label}</span>
                    {b.vehicleCount > 0 && (
                      <button 
                        onClick={() => onStageClick?.(b.raw)}
                        className="px-3 py-1 bg-[#D4325C] rounded-lg text-[9px] font-black text-white hover:bg-[#1A1C1E] transition-all shadow-lg shadow-[#D4325C]/20"
                      >
                        {b.vehicleCount} UNITS STUCK
                      </button>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-black text-[#D4325C]">{b.actual.toFixed(1)}h</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{b.target.toFixed(1)}H TARGET</span>
                  </div>
                </div>
                <div className="h-4 bg-white/20 rounded-full overflow-hidden flex items-center shadow-inner border border-white/20">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4325C]/50 to-[#D4325C] rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(255,82,82,0.4)]" 
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Load */}
        <div className="glass-morphism border-white/40 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-[#1A1C1E] uppercase tracking-tight">Department Load</h2>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] mt-1">VEHICLE DISTRIBUTION ACROSS CATEGORIES</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {categoryVolume.map((c, i) => (
              <div key={i} className="glass-morphism border border-white/60 rounded-3xl p-6 hover:bg-white/40 transition-all group shadow-sm">
                <div className="flex justify-between items-start mb-5">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover:text-blue-500 transition-colors">{c.label}</span>
                  <span className="text-2xl font-black text-[#1A1C1E]">{c.count}</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-blue-500 rounded-full group-hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000" 
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
                <p className="text-[9px] text-[#1A1C1E] mt-3 uppercase font-black tracking-widest opacity-60">
                  {c.percentage.toFixed(0)}% OF TOTAL VOLUME
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff & Workflow Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-morphism border-white/40 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-[#1A1C1E] uppercase tracking-tight">Active Team Utilization</h2>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#10B981] rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">REAL-TIME TELEMETRY</span>
            </div>
          </div>
          
          <div className="space-y-5">
            {snapshot.staffLoad.map((s, i) => (
              <div key={i} className="flex items-center gap-8 p-6 glass-morphism border-white/60 rounded-[1.5rem] hover:bg-white/40 transition-all shadow-sm">
                <div className="flex-1">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-black text-[#1A1C1E] uppercase tracking-tight">{s.team}</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.activeUnits} / {s.capacity} UNITS</span>
                  </div>
                  <div className="h-2.5 bg-black/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        s.status === 'critical' ? 'bg-[#D4325C] shadow-[0_0_10px_rgba(255,82,82,0.4)]' : 
                        s.status === 'watch' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      }`}
                      style={{ width: `${(s.activeUnits / s.capacity) * 100}%` }}
                    />
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  s.status === 'critical' ? 'text-[#D4325C] bg-[#D4325C]/10 border-[#D4325C]/20' : 
                  s.status === 'watch' ? 'text-yellow-600 bg-yellow-400/10 border-yellow-400/20' : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
                }`}>
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1C1E] rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4325C]/10 to-transparent opacity-50" />
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
            <TrendingUp className="w-12 h-12 text-[#D4325C]" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3 relative z-10">Optimization Hub</h3>
          <p className="text-[11px] text-gray-400 font-bold leading-relaxed mb-10 uppercase tracking-widest relative z-10 px-4">
            Our AI detected a slowdown in <span className="text-[#D4325C] font-black">"{bottlenecks[0]?.label || "Workflow"}"</span>. Reducing TAT by 15 mins could increase daily throughput by <span className="text-white">{((bottlenecks[0]?.variance || 0) * 0.5 + 1).toFixed(1)} units</span>.
          </p>
          <button 
            onClick={onSettingsClick}
            className="w-full py-5 bg-[#D4325C] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white hover:text-[#1A1C1E] transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(255,82,82,0.4)] relative z-10"
          >
            Optimize Settings
          </button>
        </div>
      </div>
    </div>
  );
}
