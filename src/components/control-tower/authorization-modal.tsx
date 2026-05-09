"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Upload, Plus, FileText, CheckCircle2, Trash2, Eye, Check, MinusCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthorizationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    label: string;
    reconJobId: string;
    current_stage_code?: string;
  } | null;
  onSuccess: () => void;
};

export function AuthorizationModal({ isOpen, onClose, vehicle, onSuccess }: AuthorizationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [requiresSignOff, setRequiresSignOff] = useState(true);
  
  // Main Input Fields
  const [itemsRequired, setItemsRequired] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Service Line Items
  const [newItem, setNewItem] = useState({ code: "", description: "", payType: "Internal Pay", cost: "" });
  const [lineItems, setLineItems] = useState<any[]>([]);

  // Final Decision (Manager Mode Only)
  const [finalDecision, setFinalDecision] = useState("Approved");
  const [finalDecisionNotes, setFinalDecisionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentStageCode = vehicle?.current_stage_code;
  const isFinalizeMode = currentStageCode === 'finalize-approval';

  // RESET FUNCTION
  const resetForm = () => {
    setItemsRequired("");
    setTotalCost("");
    setPdfUrl(null);
    setNewItem({ code: "", description: "", payType: "Internal Pay", cost: "" });
    setLineItems([]);
    setFinalDecision("Approved");
    setFinalDecisionNotes("");
    setRequiresSignOff(true);
    setError(null);
  };

  // Load existing data for Manager Review
  useEffect(() => {
    if (isOpen && vehicle && isFinalizeMode) {
      const fetchJobData = async () => {
        const { data } = await supabase
          .from('recon_jobs')
          .select('authorization_data, pdf_url, items_required, total_cost, final_decision, final_decision_notes')
          .eq('id', vehicle.reconJobId)
          .single();
        
        if (data) {
          const mappedItems = (data.authorization_data || []).map((item: any) => ({
            ...item,
            finalCost: item.finalCost || item.cost || "0.00",
            remarks: item.remarks || "",
            status: item.status || "pending"
          }));
          setLineItems(mappedItems);
          setPdfUrl(data.pdf_url);
          setItemsRequired(data.items_required || "");
          setTotalCost(data.total_cost || "0.00");
          if (data.final_decision) setFinalDecision(data.final_decision);
          if (data.final_decision_notes) setFinalDecisionNotes(data.final_decision_notes);
        }
      };
      fetchJobData();
    } else if (isOpen && !isFinalizeMode) {
      resetForm();
    }
  }, [isOpen, vehicle, isFinalizeMode]);

  // Auto-sync Summary ONLY if not in manager mode
  useEffect(() => {
    if (!isFinalizeMode && requiresSignOff && lineItems.length > 0) {
      const summary = lineItems.map(item => `${item.code || 'SVC'}: ${item.description}`).join(", ");
      setItemsRequired(summary);
      const total = lineItems.reduce((acc, item) => acc + (parseFloat(item.cost) || 0), 0);
      setTotalCost(total.toFixed(2));
    }
  }, [lineItems, isFinalizeMode, requiresSignOff]);

  if (!isOpen || !vehicle) return null;

  const removeLineItem = (id: number) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleAIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${vehicle.reconJobId}/${fileName}`;
      await supabase.storage.from('authorization-pdfs').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('authorization-pdfs').getPublicUrl(filePath);
      setPdfUrl(publicUrl);
      const formData = new FormData();
      formData.append('file', file);
      const { parseServicePDF } = await import("@/app/actions/parse-pdf");
      const extracted = await parseServicePDF(formData);
      if (extracted && extracted.length > 0) {
        setLineItems([...lineItems, ...extracted.map((i: any) => ({ ...i, id: Math.random(), status: 'pending', remarks: '', finalCost: i.cost }))]);
      }
    } catch (err) { console.error(err); } finally { setIsParsing(false); }
  };

  const updateLineItem = (id: number, field: string, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // VALIDATION
    if (isFinalizeMode) {
      // 1. Check if all items have been decided
      const pendingItems = lineItems.filter(i => i.status === 'pending');
      if (pendingItems.length > 0) {
        setError(`${pendingItems.length} ITEMS STILL PENDING DECISION. PLEASE APPROVE OR DECLINE ALL.`);
        return;
      }
    } else {
      // Entry Mode Validation
      if (requiresSignOff && lineItems.length === 0) {
        setError("AT LEAST ONE SERVICE ITEM IS REQUIRED FOR FULL APPROVAL.");
        return;
      }
      if (!itemsRequired.trim() && !requiresSignOff) {
        setError("PLEASE ENTER THE ITEMS REQUIRED SUMMARY.");
        return;
      }
      if (parseFloat(totalCost) <= 0 || isNaN(parseFloat(totalCost))) {
        setError("TOTAL COST MUST BE GREATER THAN ZERO.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const nextStage = isFinalizeMode ? 'work-completed' : 'finalize-approval';
      await supabase.from('recon_jobs').update({
        current_stage_code: nextStage,
        authorization_data: lineItems,
        pdf_url: pdfUrl,
        items_required: itemsRequired,
        total_cost: totalCost,
        final_decision: finalDecision,
        final_decision_notes: finalDecisionNotes,
        updated_at: new Date().toISOString()
      }).eq('id', vehicle.reconJobId);
      
      // Trigger App Notification
      if (!isFinalizeMode) {
        try {
          await supabase.from('app_notifications').insert({
            title: "Approval Required",
            body: `Review required for ${vehicle.label}. Est: $${totalCost}`,
            stage_code: 'finalize-approval',
            job_id: vehicle.reconJobId
          });
        } catch (notifErr) {
          console.error("Failed to insert notification:", notifErr);
        }
      }

      // Trigger Email
      try {
        const { sendAuthorizationEmail } = await import("@/app/actions/send-authorization-email");
        if (isFinalizeMode) {
          // Final Decision Email
          await sendAuthorizationEmail({
            jobId: vehicle.reconJobId,
            vehicleLabel: vehicle.label,
            totalCost: totalCost,
            items: lineItems,
            requiresApproval: true,
            pdfUrl: pdfUrl || undefined,
            isFinalDecision: true,
            verdict: finalDecision,
            remarks: finalDecisionNotes
          });
        } else {
          // Initial Request Email
          await sendAuthorizationEmail({
            jobId: vehicle.reconJobId,
            vehicleLabel: vehicle.label,
            totalCost: totalCost,
            items: lineItems.length > 0 ? lineItems : [{ code: 'MANUAL', description: itemsRequired, cost: totalCost }],
            requiresApproval: true,
            pdfUrl: pdfUrl || undefined
          });
        }
      } catch (emailErr) {
        console.error("Email failed:", emailErr);
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="glass-modal rounded-[2rem] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-[#1A1C1E] tracking-tight uppercase leading-none">
              {isFinalizeMode ? "Command Authorization" : "Service Assessment"}
            </h2>
            <p className="text-[#FF5252] font-black mt-2 uppercase tracking-[0.3em] text-[9px]">
              {isFinalizeMode ? `FINALIZE DETERMINATION FOR ${vehicle.label}` : `INITIATE ESTIMATE PROTOCOL FOR ${vehicle.label}`}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-[#FF5252] hover:text-white transition-all active:scale-90 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
          
          {/* Manager Verdict & Comments */}
          {isFinalizeMode && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="col-span-4 space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Operational Verdict</label>
                <div className="relative">
                  <select 
                    value={finalDecision} 
                    onChange={(e) => setFinalDecision(e.target.value)} 
                    className="w-full glass-morphism border border-white/60 rounded-2xl px-6 h-[64px] text-[#1A1C1E] font-black text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all shadow-inner"
                  >
                    <option>Approved</option>
                    <option>Partially Approved</option>
                    <option>Declined</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="col-span-8 space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Decision Intelligence / Remarks</label>
                <textarea 
                  value={finalDecisionNotes} 
                  onChange={(e) => setFinalDecisionNotes(e.target.value)}
                  placeholder="ENTER FINAL DETERMINATION NOTES..."
                  className="w-full command-input h-[64px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Toggle (Entry Mode Only) */}
          {!isFinalizeMode && (
            <div className="flex items-center gap-10 bg-gray-50 border border-gray-100 rounded-2xl p-5 justify-center shadow-inner">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="radio" checked={requiresSignOff} onChange={() => setRequiresSignOff(true)} className="w-6 h-6 rounded-full border-2 border-gray-300 appearance-none checked:border-[#FF5252] transition-all cursor-pointer" />
                  {requiresSignOff && <div className="absolute w-3 h-3 bg-[#FF5252] rounded-full" />}
                </div>
                <span className={cn("text-[11px] font-black uppercase tracking-[0.1em]", requiresSignOff ? "text-[#1A1C1E]" : "text-gray-400")}>Deep Inspection Protocol</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="radio" checked={!requiresSignOff} onChange={() => setRequiresSignOff(false)} className="w-6 h-6 rounded-full border-2 border-gray-300 appearance-none checked:border-[#FF5252] transition-all cursor-pointer" />
                  {!requiresSignOff && <div className="absolute w-3 h-3 bg-[#FF5252] rounded-full" />}
                </div>
                <span className={cn("text-[11px] font-black uppercase tracking-[0.1em]", !requiresSignOff ? "text-[#1A1C1E]" : "text-gray-400")}>Rapid Estimate Sync</span>
              </label>
            </div>
          )}

          {/* Summary Box (Entry Mode Only) */}
          {!isFinalizeMode && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="col-span-8 space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Workflow Summary</label>
                <textarea 
                  value={itemsRequired} 
                  onChange={(e) => setItemsRequired(e.target.value)} 
                  placeholder="IDENTIFY REQUIRED SERVICE PROTOCOLS..." 
                  className="w-full command-input min-h-[100px] resize-none shadow-inner" 
                />
              </div>
              <div className="col-span-4 space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Aggregate Cost ($)</label>
                <div className="bg-white border border-gray-200 rounded-3xl p-8 flex items-center h-[100px] shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gray-50 opacity-100" />
                  <span className="text-2xl font-black text-[#FF5252] mr-3 z-10">$</span>
                  <input 
                    type="text" 
                    value={totalCost} 
                    onChange={(e) => setTotalCost(e.target.value)} 
                    className="bg-transparent text-4xl font-black text-[#1A1C1E] outline-none w-full tracking-tighter z-10 placeholder:text-gray-300" 
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PDF Attachment Card */}
          {pdfUrl && (
            <div className="space-y-2">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Attached Authorization Document</label>
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/10 transition-all border-dashed border-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-xl">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white truncate max-w-[400px]">
                      {isFinalizeMode ? `Authorization document for ${vehicle.label}` : "Searching for authorization document..."}
                    </div>
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Verified Authorization Document Click to View</div>
                  </div>
                </div>
                <a href={pdfUrl} target="_blank" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 border border-white/5 transition-all text-gray-400 hover:text-white">
                  <Eye className="w-5 h-5" />
                </a>
              </div>
            </div>
          )}

          {/* Service Line Items */}
          {(requiresSignOff || isFinalizeMode) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Service Authorizations</span>
                </div>
                {isFinalizeMode && lineItems.length > 0 && (
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setLineItems(lineItems.map(i => ({...i, status: 'approved'})))} className="text-[8px] font-black text-green-500 uppercase hover:text-green-400 border border-green-500/20 px-3 py-1 rounded-lg bg-green-500/5">Approve All</button>
                    <button type="button" onClick={() => setLineItems(lineItems.map(i => ({...i, status: 'declined'})))} className="text-[8px] font-black text-red-500 uppercase hover:text-red-400 border border-red-500/20 px-3 py-1 rounded-lg bg-red-500/5">Decline All</button>
                  </div>
                )}
              </div>

              {/* Entry Mode Row */}
               {!isFinalizeMode && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 grid grid-cols-12 gap-3 items-end shadow-inner">
                  <div className="col-span-2 space-y-1"><label className="text-[7px] font-black text-gray-600 uppercase">Code</label><input value={newItem.code} onChange={(e) => setNewItem({...newItem, code: e.target.value})} className="w-full command-input !py-2.5 !text-[10px]" placeholder="CODE" /></div>
                  <div className="col-span-4 space-y-1"><label className="text-[7px] font-black text-gray-600 uppercase">Description</label><input value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} className="w-full command-input !py-2.5 !text-[10px]" placeholder="SERVICE DESCRIPTION" /></div>
                  <div className="col-span-2 space-y-1"><label className="text-[7px] font-black text-gray-600 uppercase">Pay Type</label><select value={newItem.payType} onChange={(e) => setNewItem({...newItem, payType: e.target.value})} className="w-full command-input !py-2.5 !text-[10px] appearance-none cursor-pointer"><option>Internal Pay</option><option>Customer Pay</option><option>Warranty</option></select></div>
                  <div className="col-span-2 space-y-1"><label className="text-[7px] font-black text-gray-600 uppercase">Cost</label><div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 h-[38px] shadow-sm"><span className="text-[10px] text-[#FF5252] font-black mr-1">$</span><input value={newItem.cost} onChange={(e) => setNewItem({...newItem, cost: e.target.value})} className="bg-transparent w-full text-[10px] font-black text-[#1A1C1E] outline-none placeholder:text-gray-300" placeholder="0.00" /></div></div>
                  <div className="col-span-2"><button type="button" onClick={() => { if (!newItem.description) return; setLineItems([...lineItems, {...newItem, id: Math.random(), status: 'pending', remarks: '', finalCost: newItem.cost}]); setNewItem({ code: "", description: "", payType: "Internal Pay", cost: "" }); }} className="w-full h-[38px] bg-[#00142E] hover:bg-[#FF5252] text-white rounded-xl flex items-center justify-center transition-all shadow-lg"><Plus className="w-5 h-5" /></button></div>
                </div>
              )}

              {/* List of Items */}
              <div className="space-y-3">
                {lineItems.map(item => (
                   <div key={item.id} className={cn(
                    "bg-white border rounded-2xl p-5 transition-all shadow-sm",
                    item.status === 'approved' ? 'border-green-500/40 bg-green-50/50' : 
                    item.status === 'declined' ? 'border-red-500/40 bg-red-50/50' : 
                    'border-gray-200'
                  )}>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="min-w-[70px] px-3 py-1.5 bg-gray-100 rounded-lg text-[9px] font-black text-[#1A1C1E] uppercase tracking-tighter border border-gray-200 text-center">{item.code || "SVC"}</div>
                        <div className="flex-1">
                          <div className="text-[11px] font-black text-[#1A1C1E] leading-tight uppercase">{item.description}</div>
                          <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{item.payType}</div>
                        </div>
                        
                        {isFinalizeMode && (
                          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-[42px] min-w-[100px] shadow-inner">
                            <span className="text-[10px] text-[#FF5252] font-black mr-1">$</span>
                            <input 
                              type="text" 
                              value={item.finalCost} 
                              onChange={(e) => updateLineItem(item.id, 'finalCost', e.target.value)}
                              className="bg-transparent w-full text-[12px] font-black text-[#1A1C1E] outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {isFinalizeMode ? (
                        <div className="flex-1 max-w-[300px]">
                          <input 
                            type="text" 
                            value={item.remarks} 
                            onChange={(e) => updateLineItem(item.id, 'remarks', e.target.value)}
                            placeholder="ADD DECISION REMARKS..."
                            className="w-full command-input !py-3 !text-[10px]"
                          />
                        </div>
                      ) : null}

                      <div className="flex items-center gap-3">
                        {isFinalizeMode ? (
                          <>
                            <button onClick={() => updateLineItem(item.id, 'status', 'approved')} className={cn("px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all", item.status === 'approved' ? "bg-green-600 text-white shadow-lg" : "bg-white/5 text-gray-500")}>
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => updateLineItem(item.id, 'status', 'declined')} className={cn("px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all", item.status === 'declined' ? "bg-red-600 text-white shadow-lg" : "bg-white/5 text-gray-500")}>
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </>
                        ) : (
                          <button onClick={() => removeLineItem(item.id)} className="text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area (Entry Mode Only) */}
          {!isFinalizeMode && requiresSignOff && (
            <div className={cn(
              "relative h-28 rounded-2xl border-2 border-dashed transition-all group overflow-hidden",
              isParsing ? "border-[#FF5252] bg-[#FF5252]/5" : "border-gray-200 bg-gray-50 hover:border-blue-500/40"
            )}>
              {isParsing ? (
                <div className="absolute inset-0 flex items-center justify-center gap-4 p-4 z-10">
                  <div className="w-10 h-10 border-4 border-[#FF5252]/20 border-t-[#FF5252] rounded-full animate-spin" />
                  <div className="text-left">
                    <span className="text-xs font-black text-[#1A1C1E] uppercase tracking-widest block">AI ANALYZING DOCUMENT...</span>
                    <span className="text-[8px] text-[#FF5252] uppercase tracking-[0.2em] font-bold animate-pulse">EXTRACTING SERVICE CODES</span>
                  </div>
                </div>
              ) : (
                <>
                  <input type="file" accept="application/pdf" onChange={handleAIUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="absolute inset-0 flex items-center justify-center gap-4 p-4 z-10">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"><Upload className="w-5 h-5 text-gray-400" /></div>
                    <div className="text-left">
                      <span className="text-xs font-black text-[#1A1C1E] uppercase tracking-widest block">Upload Authorization PDF</span>
                      <span className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-bold">SMART EXTRACTION PROTOCOL</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-white/20 bg-white/20 shrink-0 space-y-6">
          {error && (
            <div className="bg-[#FF5252]/10 border border-[#FF5252]/20 rounded-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5252] animate-pulse shrink-0 shadow-[0_0_12px_rgba(255,82,82,0.5)]" />
              <p className="text-[11px] font-black text-[#FF5252] uppercase tracking-[0.2em] leading-tight">{error}</p>
            </div>
          )}
          <button 
            onClick={handleSubmit} disabled={isSubmitting || isParsing}
            className="w-full bg-[#1A1C1E] hover:bg-[#FF5252] text-white font-black py-6 rounded-2xl uppercase tracking-[0.5em] text-xs shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] border border-white/10 hover:shadow-[#FF5252]/20"
          >
            {isSubmitting ? "SYNCING DATA..." : (isFinalizeMode ? "FINALIZE DETERMINATION" : "EXECUTE APPROVAL REQUEST")}
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,82,82,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,82,82,0.3); }
        select option {
          background-color: white;
          color: #1A1C1E;
          font-weight: 900;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
