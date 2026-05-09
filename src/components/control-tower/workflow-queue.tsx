"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  Car, 
  User, 
  ArrowRight,
  ClipboardList,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { deleteReconJob } from "@/app/actions/delete-vehicle";

type VehicleDetail = {
  id: string;
  stock_number: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  color: string;
  body_style: string;
  inventory_status: string;
  days_in_inventory: number;
};

type WorkflowJob = {
  id: string;
  current_stage_code: string;
  status: string;
  priority_score: number;
  started_at: string;
  updated_at: string;
  total_cost: string;
  vehicle: VehicleDetail;
  stage_label: string;
};

export function WorkflowQueue({ onOpenRecord, onDelete }: { onOpenRecord?: (job: WorkflowJob) => void; onDelete?: () => void }) {
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<WorkflowJob | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkflowJob | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all active workflow jobs
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: stages } = await supabase
        .from('workflow_stage_definitions')
        .select('stage_code, display_name');

      const stageMap = new Map(stages?.map(s => [s.stage_code, s.display_name]));

      const { data, error } = await supabase
        .from('recon_jobs')
        .select(`
          *,
          total_cost,
          vehicle:vehicles(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const transformed: WorkflowJob[] = (data || []).map(j => ({
        ...j,
        stage_label: stageMap.get(j.current_stage_code) || j.current_stage_code
      }));

      setJobs(transformed);
    } catch (err) {
      console.error("Failed to fetch workflow queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const stages = [
    { code: 'all', label: 'ALL VEHICLES' },
    { code: 'intake', label: 'INTAKE' },
    { code: 'workshop', label: 'WORKSHOP' },
    { code: 'detail', label: 'DETAILING' },
    { code: 'lot', label: 'READY' },
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.vehicle?.stock_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.vehicle?.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${job.vehicle?.make} ${job.vehicle?.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simple grouping for tabs
    const getDept = (code: string) => {
      if (code.includes('detail')) return 'detail';
      if (code.includes('inspection') || code.includes('mechanic') || code.includes('parts')) return 'workshop';
      if (code === 'completed' || code === 'parked-on-lot') return 'lot';
      return 'intake';
    };

    const matchesStage = selectedStage === 'all' || getDept(job.current_stage_code) === selectedStage;

    return matchesSearch && matchesStage;
  });

  const handleDeleteVehicle = async (job: WorkflowJob) => {
    if (!confirm(`Are you sure you want to delete ${job.vehicle?.year} ${job.vehicle?.make} ${job.vehicle?.model} (${job.vehicle?.stock_number})? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Use the server action which uses service role to bypass RLS
      const result = await deleteReconJob(job.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete vehicle');
      }

      // Remove the deleted job from local state immediately for instant UI update
      setJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
      
      // Also refresh from server to ensure consistency
      await fetchJobs();
      
      // Notify parent component to refresh its data
      if (onDelete) {
        onDelete();
      }
      
      // Close detail panel if open
      if (selectedVehicle?.id === job.id) {
        setSelectedVehicle(null);
      }

      alert('Vehicle deleted successfully');
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert(`Failed to delete vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // If deletion failed, refresh to restore correct state
      await fetchJobs();
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="SEARCH STOCK #, VIN, OR MODEL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl py-3 pl-12 pr-4 text-sm text-[#333333] placeholder:text-gray-400 focus:outline-none focus:border-[#00142E] transition-all font-sans"
          />
        </div>
        <div className="flex bg-[#F5F5F5] rounded-xl p-1 border border-[#E0E0E0]">
          {stages.map((s) => (
            <button
              key={s.code}
              onClick={() => setSelectedStage(s.code)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                selectedStage === s.code 
                  ? "bg-[#00142E] text-white shadow-lg" 
                  : "text-gray-500 hover:text-[#333333]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">SCANNING WORKFLOW RECORDS...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedVehicle(job)}
              className="group bg-white/95 backdrop-blur-sm border border-[#E0E0E0] hover:border-[#00142E]/30 rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer hover:bg-[#F5F5F5]"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-lg bg-[#F5F5F5] flex items-center justify-center border border-[#E0E0E0] group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6 text-gray-400 group-hover:text-[#00142E] transition-colors" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-[#333333] tracking-tight uppercase">
                      {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#00142E]/10 text-[#00142E] text-[10px] font-black tracking-widest uppercase">
                      {job.vehicle?.stock_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-3 h-3" />
                      {job.stage_label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Started {new Date(job.started_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">R/O</div>
                  <div className="text-xs font-black text-[#1A1C1E]">
                    {job.total_cost && parseFloat(job.total_cost) > 0 ? (
                      <span className="text-[#10B981]">${parseFloat(job.total_cost).toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-400">---</span>
                    )}
                  </div>
                </div>
                <div className="w-px h-8 bg-[#E0E0E0]" />
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</div>
                  <div className={`text-xs font-bold uppercase ${job.status === 'active' ? 'text-green-400' : 'text-blue-400'}`}>
                    {job.status}
                  </div>
                </div>
                <div className="w-px h-8 bg-[#E0E0E0]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVehicle(job);
                  }}
                  disabled={isDeleting}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group/delete"
                  title="Delete vehicle"
                >
                  <Trash2 className="w-5 h-5 text-gray-600 group-hover/delete:text-white transition-colors" />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#333333] transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium uppercase">NO VEHICLES FOUND MATCHING YOUR SELECTION.</p>
          </div>
        )}
      </div>

      {/* Detail Slide-over */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedVehicle(null)} />
          <div className="relative w-full max-w-xl bg-white border-l border-gray-100 shadow-2xl h-full p-8 animate-in slide-in-from-right duration-500 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-[#333333] uppercase tracking-tighter">VEHICLE INTELLIGENCE</h2>
              <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-[#E8E8E8] rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Header Info */}
              <div className="bg-[#F5F5F5] rounded-2xl p-6 border border-[#E0E0E0]">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#00142E] flex items-center justify-center shadow-lg">
                    <Car className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#333333] tracking-tighter leading-tight">
                      {selectedVehicle.vehicle?.year} {selectedVehicle.vehicle?.make} {selectedVehicle.vehicle?.model}
                    </h3>
                    <p className="text-[#00142E] font-bold tracking-[0.2em] uppercase text-xs mt-1">
                      STOCK # {selectedVehicle.vehicle?.stock_number}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#E8E8E8] rounded-xl p-4">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">CURRENT STAGE</div>
                    <div className="text-sm font-bold text-[#333333] uppercase tracking-tight">{selectedVehicle.stage_label}</div>
                  </div>
                  <div className="bg-[#E8E8E8] rounded-xl p-4">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">VIN</div>
                    <div className="text-sm font-bold text-[#333333] uppercase tracking-tight">{selectedVehicle.vehicle?.vin}</div>
                  </div>
                </div>
              </div>

              {/* Full Specs Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] px-2">STORED METADATA</h4>
                <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-2xl divide-y divide-[#E0E0E0]">
                  <DetailItem label="EXTERIOR COLOR" value={selectedVehicle.vehicle?.color || "NOT RECORDED"} />
                  <DetailItem label="BODY STYLE" value={selectedVehicle.vehicle?.body_style || "STANDARD"} />
                  <DetailItem 
                    label="R/O TOTAL" 
                    value={selectedVehicle.total_cost && parseFloat(selectedVehicle.total_cost) > 0 
                      ? `$${parseFloat(selectedVehicle.total_cost).toLocaleString()}` 
                      : "PENDING APPROVAL"} 
                    highlight={!!(selectedVehicle.total_cost && parseFloat(selectedVehicle.total_cost) > 0)}
                  />
                  <DetailItem label="INVENTORY STATUS" value={selectedVehicle.vehicle?.inventory_status || "ACTIVE"} />
                  <DetailItem label="DAYS IN INVENTORY" value={`${selectedVehicle.vehicle?.days_in_inventory || 0} DAYS`} />
                  <DetailItem label="WORKFLOW PRIORITY" value={selectedVehicle.priority_score.toString()} />
                  <DetailItem label="JOB START DATE" value={new Date(selectedVehicle.started_at).toLocaleString()} />
                  <DetailItem label="LAST ACTIVITY" value={new Date(selectedVehicle.updated_at).toLocaleString()} />
                </div>
              </div>

              {/* Action */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (onOpenRecord && selectedVehicle) {
                      onOpenRecord(selectedVehicle);
                      setSelectedVehicle(null);
                    }
                  }}
                  className="w-full bg-white/95 backdrop-blur-sm text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
                >
                  OPEN FULL RECON RECORD
                </button>
                
                <button
                  onClick={() => handleDeleteVehicle(selectedVehicle)}
                  disabled={isDeleting}
                  className="w-full bg-[#DC3545] hover:bg-[#c82333] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'DELETING...' : 'DELETE VEHICLE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-black uppercase tracking-tight ${highlight ? 'text-[#10B981]' : 'text-[#333333]'}`}>
        {value}
      </span>
    </div>
  );
}
