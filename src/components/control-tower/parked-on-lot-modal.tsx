"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

type ParkedOnLotModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    label: string;
    reconJobId: string;
  } | null;
  onSuccess: () => void;
};

export function ParkedOnLotModal({ isOpen, onClose, vehicle, onSuccess }: ParkedOnLotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async () => {
    if (!driverName.trim()) {
      setError("DRIVER NAME IS REQUIRED");
      return;
    }
    if (!location.trim()) {
      setError("LOCATION/BAY # IS REQUIRED");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update stage and mark status as 'completed'
      const { error } = await supabase.from('recon_jobs').update({
        current_stage_code: 'completed',
        status: 'completed', // Officially marking as finished
        final_decision_notes: `PARKED AT ${location.toUpperCase()} BY ${driverName}`,
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
      <div className="bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-10 pb-6 flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-[#333333] tracking-tighter uppercase leading-none">Parked on Lot</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-60">
              Final placement for: <span className="text-[#00142E]">{vehicle.label}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-[#333333] transition-colors -mt-10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 pt-0 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Driver Name</label>
              <div className="relative group">
                <input 
                  type="text" 
                  autoFocus
                  value={driverName}
                  onChange={(e) => { setDriverName(e.target.value); setError(""); }}
                  placeholder="DRIVER NAME"
                  className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl px-6 h-[72px] text-[#333333] font-bold text-sm outline-none focus:border-[#00142E] transition-all placeholder:text-gray-400 group-hover:bg-[#E8E8E8]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Location / Bay #</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setError(""); }}
                  placeholder="E.G. BAY 12"
                  className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl px-6 h-[72px] text-[#333333] font-bold text-sm outline-none focus:border-[#00142E] transition-all placeholder:text-gray-400 group-hover:bg-[#E8E8E8]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#00142E] hover:bg-[#000A1A] text-white h-[80px] rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg active:scale-[0.97] disabled:opacity-50"
          >
            {isSubmitting ? "PROCESSING..." : "Confirm Placement"}
          </button>
        </div>
      </div>
    </div>
  );
}
