"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

type WorkCompletedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    label: string;
    reconJobId: string;
  } | null;
  onSuccess: () => void;
};

export function WorkCompletedModal({ isOpen, onClose, vehicle, onSuccess }: WorkCompletedModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('recon_jobs').update({
        current_stage_code: 'detail-received',
        updated_at: new Date().toISOString()
      }).eq('id', vehicle.reconJobId);

      if (error) throw error;

      // 2. Trigger App Notification
      try {
        await supabase.from('app_notifications').insert({
          title: "Vehicle Ready for Detailing",
          body: `Unit ${vehicle.label} is now ready for Detailing.`,
          stage_code: 'detail-received',
          job_id: vehicle.reconJobId
        });
      } catch (notifErr) {
        console.error("Failed to insert notification:", notifErr);
      }

      // 3. Trigger Detail Notification Email
      try {
        const { sendDetailNotificationEmail } = await import("@/app/actions/send-detail-notification");
        await sendDetailNotificationEmail({
          vehicleLabel: vehicle.label
        });
      } catch (emailErr) {
        console.error("Failed to send detail email:", emailErr);
      }

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
      <div className="bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        <div className="p-6 border-b border-[#E0E0E0] bg-[#F5F5F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-lg font-black text-[#333333] tracking-tight uppercase">Confirm Completion</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-[#333333] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Workshop Verification</div>
            <h3 className="text-2xl font-black text-[#333333] tracking-tighter">{vehicle.label}</h3>
            <p className="text-gray-500 text-xs font-medium">Has all the authorized work been completed on this vehicle?</p>
          </div>

          <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl p-4 flex items-start gap-4 text-left">
            <AlertCircle className="w-5 h-5 text-[#00142E] shrink-0 mt-0.5" />
            <div className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase">
              Confirming will move this vehicle to <span className="text-[#00142E]">Detail Received</span>.
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#F5F5F5] border-t border-[#E0E0E0] flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#333333] bg-white/95 backdrop-blur-sm border border-[#E0E0E0] transition-all">
            Not Yet
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-[#00142E] hover:bg-[#000A1A] shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "MOVING..." : "YES, COMPLETED"}
          </button>
        </div>
      </div>
    </div>
  );
}
