"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Clock, Save, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StageSLA = {
  id: string;
  stage_code: string;
  display_name: string;
  planned_duration_minutes: number;
};

export function WorkflowSettings({ isOpen, onClose, isSection = false }: { isOpen?: boolean, onClose?: () => void, isSection?: boolean }) {
  const [stages, setStages] = useState<StageSLA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen || isSection) fetchStages();
  }, [isOpen, isSection]);

  const fetchStages = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('workflow_stage_definitions')
      .select('id, stage_code, display_name, planned_duration_minutes')
      .order('sequence_no', { ascending: true });
    
    if (data) {
      console.log('SETTINGS DEBUG: Fetched Stages from DB:', data.map(s => ({ code: s.stage_code, mins: s.planned_duration_minutes })));
      setStages(data);
    }
    setIsLoading(false);
  };

  const handleUpdateSLA = async (stageCode: string, minutes: number) => {
    setIsSaving(stageCode);
    const { data, error } = await supabase
      .from('workflow_stage_definitions')
      .update({ planned_duration_minutes: minutes })
      .eq('stage_code', stageCode)
      .select();
    
    if (error) {
      console.error('Update failed:', error);
      alert(`FAILED TO SAVE: ${error.message}`);
    } else {
      console.log('DATABASE CONFIRMED SAVE:', data);
      if (data && data.length > 0) {
        setStages(stages.map(s => s.stage_code === stageCode ? { ...s, planned_duration_minutes: data[0].planned_duration_minutes } : s));
      } else {
        alert("SAVE FAILED: 0 rows updated. This usually means you don't have permission (RLS Policy) to edit this table in Supabase.");
      }
    }
    setIsSaving(null);
  };

  if (!isOpen && !isSection) return null;

  const content = (
    <div className={cn(
      "flex flex-col",
      isSection ? "w-full" : "bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-[40px] w-full max-w-6xl shadow-lg overflow-hidden max-h-[90vh]"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b border-[#E0E0E0]",
        isSection ? "mb-8 pb-8" : "p-8 bg-[#F5F5F5]"
      )}>
        <div>
          <h2 className="text-3xl font-black text-[#333333] tracking-tight uppercase">Workflow TAT Settings</h2>
          <p className="text-gray-500 font-medium mt-1 uppercase tracking-widest text-[10px] opacity-70">Configure planned duration for each stage to track delays</p>
        </div>
        {!isSection && onClose && (
          <button onClick={onClose} className="w-12 h-12 bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-2xl flex items-center justify-center hover:bg-[#E8E8E8] transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        isSection ? "animate-in fade-in slide-in-from-bottom-4 duration-700" : "p-8 overflow-y-auto no-scrollbar bg-[#F8F8F8]"
      )}>
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Loading workflow configuration...</p>
          </div>
        ) : (
          stages.map((stage) => (
            <SLACard 
              key={stage.id} 
              stage={stage} 
              onSave={(mins) => handleUpdateSLA(stage.stage_code, mins)} 
              isSaving={isSaving === stage.stage_code} 
            />
          ))
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );

  if (isSection) return content;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[200] flex items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-300">
      {content}
    </div>
  );
}

function SLACard({ stage, onSave, isSaving }: { stage: StageSLA, onSave: (mins: number) => void, isSaving: boolean }) {
  const initialMins = stage.planned_duration_minutes || 0;
  
  const getInitialTime = (mins: number) => ({
    years: Math.floor(mins / (525600)) || 0,
    months: Math.floor((mins % 525600) / 43800) || 0,
    weeks: Math.floor((mins % 43800) / 10080) || 0,
    days: Math.floor((mins % 10080) / 1440) || 0,
    hours: Math.floor((mins % 1440) / 60) || 0,
    minutes: mins % 60 || 0
  });

  const [time, setTime] = useState(getInitialTime(initialMins));

  const totalMinutes = (time.years * 525600) + (time.months * 43800) + (time.weeks * 10080) + (time.days * 1440) + (time.hours * 60) + (time.minutes);

  return (
    <div className="bg-[#F5F5F5] rounded-[32px] p-6 shadow-lg border border-[#E0E0E0] hover:border-[#00142E]/20 transition-all duration-300 group">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-[#333333] tracking-tight">{stage.display_name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <TimeUnit label="YEAR" value={time.years} onChange={(v) => setTime({ ...time, years: v })} />
        <TimeUnit label="MONTHS" value={time.months} onChange={(v) => setTime({ ...time, months: v })} />
        <TimeUnit label="WEEKS" value={time.weeks} onChange={(v) => setTime({ ...time, weeks: v })} />
        <TimeUnit label="DAYS" value={time.days} onChange={(v) => setTime({ ...time, days: v })} />
        <TimeUnit label="HOURS" value={time.hours} onChange={(v) => setTime({ ...time, hours: v })} />
        <TimeUnit label="MINUTES" value={time.minutes} onChange={(v) => setTime({ ...time, minutes: v })} />
      </div>

      <div className="flex gap-3 mt-auto">
        <button 
          onClick={() => setTime({ years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0 })}
          className="flex-1 bg-white/95 backdrop-blur-sm hover:bg-red-50 border border-[#E0E0E0] hover:border-red-500/20 text-gray-500 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all"
        >
          Clear
        </button>
        <button 
          onClick={() => onSave(totalMinutes)}
          disabled={isSaving}
          className="flex-[2] bg-[#00142E] hover:bg-[#000A1A] border border-[#00142E] text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "SAVE & RECALCULATE"
          )}
        </button>
      </div>
    </div>
  );
}

function TimeUnit({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="bg-[#E8E8E8] border border-[#E0E0E0] rounded-2xl p-3 flex items-center justify-between hover:bg-[#DDDDDD] transition-colors">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <input 
        type="text" 
        value={value === 0 ? '' : value} 
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          onChange(val === '' ? 0 : parseInt(val));
        }}
        placeholder="-"
        className="w-12 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg text-center font-black text-[#333333] py-1 focus:ring-2 focus:ring-[#00142E]/40 outline-none transition-all placeholder:text-gray-400"
      />
    </div>
  );
}
