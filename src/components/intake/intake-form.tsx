"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function IntakeForm({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    stockNumber: "",
    year: "2024",
    make: "Ford",
    model: "",
    source: "Trade",
    mileage: "",
    comments: "",
    picturesUploaded: "Yes"
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.stockNumber) newErrors.stockNumber = "Stock number is required";
    if (!formData.model) newErrors.model = "Model is required";
    if (!formData.year || isNaN(parseInt(formData.year))) newErrors.year = "Valid year is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const { data: dealership } = await supabase.from('dealerships').select('id, tenant_id').limit(1).single();
      const { data: workflow } = await supabase.from('workflow_templates').select('id').limit(1).single();

      if (!dealership || !workflow) throw new Error("Setup data missing");

      const { data: vehicle, error: vError } = await supabase
        .from('vehicles')
        .insert({
          tenant_id: dealership.tenant_id,
          dealership_id: dealership.id,
          vin: formData.stockNumber || `TEMP-${Date.now()}`,
          stock_number: formData.stockNumber,
          year: parseInt(formData.year),
          make: formData.make,
          model: formData.model,
          trim: "",
          mileage: parseInt(formData.mileage) || 0,
          acquisition_type: formData.source.toLowerCase()
        })
        .select()
        .single();

      if (vError) throw vError;

      const { error: jError } = await supabase
        .from('recon_jobs')
        .insert({
          tenant_id: dealership.tenant_id,
          dealership_id: dealership.id,
          vehicle_id: vehicle.id,
          workflow_template_id: workflow.id,
          status: 'active',
          current_stage_code: 'ro-open',
          priority_score: 50,
          started_at: new Date().toISOString()
        });

      if (jError) throw jError;

      onSuccess?.();
      setFormData({
        stockNumber: "",
        year: "2024",
        make: "Ford",
        model: "",
        source: "Trade",
        mileage: "",
        comments: "",
        picturesUploaded: "Yes"
      });
    } catch (error: any) {
      console.error("Intake Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div className="space-y-0.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Stock Number</label>
          <input
            type="text"
            name="stockNumber"
            value={formData.stockNumber}
            onChange={handleInputChange}
            className={cn(
              "w-full command-input py-2 uppercase tracking-[0.2em]",
              errors.stockNumber && "border-[#FF5252] bg-red-50"
            )}
            placeholder="E.G. A25182"
          />
          {errors.stockNumber && <p className="text-[8px] text-[#FF5252] ml-2 font-black uppercase tracking-widest">{errors.stockNumber}</p>}
        </div>

        <div className="space-y-0.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Asset Year</label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            className={cn(
              "w-full command-input py-2",
              errors.year && "border-[#FF5252] bg-red-50"
            )}
            placeholder="2024"
          />
        </div>

        <div className="space-y-0.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Asset Make</label>
          <select
            name="make"
            value={formData.make}
            onChange={handleInputChange}
            className="w-full command-input py-2 appearance-none cursor-pointer"
          >
            <option value="Ford">Ford</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
            <option value="Hyundai">Hyundai</option>
            <option value="Kia">Kia</option>
            <option value="Maruti Suzuki">Maruti Suzuki</option>
            <option value="Mahindra">Mahindra</option>
            <option value="Tata">Tata</option>
            <option value="BMW">BMW</option>
            <option value="Mercedes-Benz">Mercedes-Benz</option>
            <option value="Audi">Audi</option>
            <option value="Volkswagen">Volkswagen</option>
            <option value="MG">MG</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Model Name</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            className={cn(
              "w-full command-input py-2",
              errors.model && "border-[#FF5252] bg-red-50"
            )}
            placeholder="Explorer"
          />
        </div>

        <div className="space-y-0.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Acquisition Source</label>
          <select
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            className="w-full command-input py-2 appearance-none cursor-pointer"
          >
            <option value="Trade">Customer Trade</option>
            <option value="Auction">Direct Auction</option>
            <option value="Purchase">Private Purchase</option>
            <option value="Service">Service Loaner</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Current Mileage</label>
          <input
            type="text"
            name="mileage"
            value={formData.mileage}
            onChange={handleInputChange}
            className="w-full command-input py-2"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-0.5">
        <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Internal Comments</label>
        <textarea
          name="comments"
          value={formData.comments}
          onChange={handleInputChange}
          rows={2}
          className="w-full command-input py-2 resize-none"
          placeholder="ENTER INITIAL VEHICLE CONDITION OR SPECIAL INSTRUCTIONS..."
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/20">
        <div className="space-y-2.5">
          <label className="block text-[8px] font-black text-[#1A1C1E] uppercase tracking-[0.1em] ml-1 opacity-50">Pictures Logged?</label>
          <div className="flex gap-2">
            {['Yes', 'No'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, picturesUploaded: opt }))}
                className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${formData.picturesUploaded === opt ? 'bg-[#1A1C1E] text-white shadow-lg scale-105' : 'glass-morphism border-white/80 text-[#1A1C1E] opacity-40 hover:opacity-100 hover:bg-white/40'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-gray-100 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#1A1C1E] hover:bg-[#FF5252] text-white rounded-lg px-10 py-3 font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.95] disabled:opacity-50"
          >
            {isSubmitting ? "SYNCING..." : "SUBMIT INTAKE"}
          </button>
        </div>
      </div>
    </form>
  );
}

type IntakeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function IntakeModal({ isOpen, onClose, onSuccess }: IntakeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="glass-modal rounded-[2rem] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-black text-[#1A1C1E] tracking-tight uppercase leading-none">Vehicle Intake</h2>
            <p className="text-[8px] text-[#FF5252] mt-1.5 uppercase tracking-[0.2em] font-black leading-none">ENROLL ASSET</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-[#FF5252] hover:text-white transition-all active:scale-90 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 bg-white">
          <IntakeForm onSuccess={() => { onSuccess?.(); onClose(); }} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
