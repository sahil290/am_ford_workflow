"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

type DetailInspectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    label: string;
    reconJobId: string;
  } | null;
  onSuccess: () => void;
};

export function DetailInspectionModal({ isOpen, onClose, vehicle, onSuccess }: DetailInspectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspector, setInspector] = useState("");
  const [status, setStatus] = useState("Approved");

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async () => {
    if (!inspector.trim()) {
      alert("Please enter the inspector's name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('recon_jobs').update({
        current_stage_code: status === 'Approved' ? 'parked-on-lot' : 'detail-received', // If rejected, move back to intake? Or handle accordingly
        final_decision_notes: `DETAIL INSPECTION: ${status} by ${inspector}`,
        updated_at: new Date().toISOString()
      }).eq('id', vehicle.reconJobId);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[160] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-10 pb-6 flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[#333333] tracking-tighter uppercase leading-none">Detail Inspection</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-60">
              Quality check for: <span className="text-[#00142E]">{vehicle.label}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-[#333333] transition-colors -mt-10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 pt-0 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Inspector</label>
              <div className="relative group">
                <input 
                  type="text" 
                  autoFocus
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="INSPECTOR NAME"
                  className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl px-6 h-[72px] text-[#333333] font-bold text-sm outline-none focus:border-[#00142E] transition-all placeholder:text-gray-400 group-hover:bg-[#E8E8E8]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Status</label>
              <div className="relative group">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl px-6 h-[72px] text-[#333333] font-bold text-sm outline-none focus:border-[#00142E] transition-all appearance-none cursor-pointer group-hover:bg-[#E8E8E8]"
                >
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Needs Rework">Needs Rework</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#00142E] hover:bg-[#000A1A] text-white h-[80px] rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-[0.97] disabled:opacity-50"
          >
            {isSubmitting ? "PROCESSING..." : "Confirm Inspection"}
          </button>
        </div>
      </div>

      <style jsx>{`
        select option {
          background-color: white;
          color: #333333;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}
