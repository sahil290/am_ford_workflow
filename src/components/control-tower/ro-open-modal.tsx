"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ROOpenModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    label: string;
    reconJobId: string;
  } | null;
  onSuccess: () => void;
};

export function ROOpenModal({ isOpen, onClose, vehicle, onSuccess }: ROOpenModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roNumber, setRoNumber] = useState("");
  const [keyTag, setKeyTag] = useState("Yes");
  const [error, setError] = useState("");

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roNumber) {
      setError("RO NUMBER IS REQUIRED");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update Recon Job with RO number and move to next stage (Service Advisors)
      const { error: updateError } = await supabase
        .from('recon_jobs')
        .update({
          current_stage_code: 'approval-sent', // Move to the next stage
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicle.reconJobId);

      if (updateError) throw updateError;

      // 2. Here we could also log the RO number in a separate table or metadata
      // For this prototype, we'll just success out
      onSuccess();
      onClose();
      setRoNumber("");
    } catch (err: any) {
      console.error("RO Open Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="glass-modal rounded-3xl w-full max-w-[500px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-black text-[#1A1C1E] tracking-tight uppercase">Open Repair Order</h2>
            <p className="text-[#FF5252] font-black mt-1 uppercase tracking-[0.2em] text-[8px]">INITIATE WORKFLOW PROTOCOL</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-[#FF5252] hover:text-white transition-all active:scale-90 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
          {/* RO Number */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Repair Order Index</label>
            <input
              type="text"
              value={roNumber}
              onChange={(e) => {
                setRoNumber(e.target.value);
                setError("");
              }}
              className={cn(
                "w-full command-input !text-xl !py-5 uppercase tracking-tighter",
                error && "border-[#FF5252] bg-red-50"
              )}
              placeholder="ENTER RO NUMBER"
            />
            {error && <p className="text-[9px] text-[#FF5252] ml-2 font-black uppercase tracking-widest animate-pulse">{error}</p>}
          </div>

          {/* Key Tag */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Asset Status (Key Tag)</label>
            <div className="relative">
              <select
                value={keyTag}
                onChange={(e) => setKeyTag(e.target.value)}
                className="w-full command-input !text-xl !py-5 appearance-none cursor-pointer uppercase tracking-tighter"
              >
                <option>Yes</option>
                <option>No</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1A1C1E] hover:bg-[#FF5252] text-white rounded-2xl py-5 font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 hover:shadow-[#FF5252]/20"
          >
            {isSubmitting ? "PROCESSING COMMAND..." : "CONFIRM STAGE ENTRY"}
          </button>
        </form>
      </div>
    </div>
  );
}
