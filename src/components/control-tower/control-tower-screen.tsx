"use client";

import { useState, useEffect } from "react";
import { OpsShell } from "@/components/app-shell/ops-shell";
import { Navbar } from "@/components/navbar/navbar";
import { Sidebar } from "@/components/navbar/sidebar";
import { IntakeModal } from "@/components/intake/intake-form";
import { ROOpenModal } from "@/components/control-tower/ro-open-modal";
import { AuthorizationModal } from "@/components/control-tower/authorization-modal";
import { WorkCompletedModal } from "@/components/control-tower/work-completed-modal";
import { DetailIntakeModal } from "@/components/control-tower/detail-intake-modal";
import { DetailCompletedModal } from "@/components/control-tower/detail-completed-modal";
import { DetailInspectionModal } from "@/components/control-tower/detail-inspection-modal";
import { ParkedOnLotModal } from "@/components/control-tower/parked-on-lot-modal";
import { WorkflowSettings } from "@/components/control-tower/workflow-settings";
import { WorkflowQueue } from "@/components/control-tower/workflow-queue";
import { AIIntelligenceHub } from "@/components/control-tower/ai-intelligence-hub";
import { Clock, X, ChevronRight, BarChart3, LayoutDashboard, Trash2, Search } from "lucide-react";
import { InsightsView } from "@/components/control-tower/insights-view";
import { getControlTowerSnapshot } from "@/server/query-services/control-tower-query-service";

import { supabase } from "@/lib/supabase";
import type {
  ControlTowerSnapshot,
  QueueStageRow,
} from "@/modules/control-tower/domain/control-tower.types";

type ControlTowerScreenProps = {
  snapshot: ControlTowerSnapshot;
  initialViewMode?: 'tower' | 'insights' | 'tat-settings' | 'workflow-queue' | 'ai-insights';
};

export function ControlTowerScreen({ snapshot: initialSnapshot, initialViewMode = 'tower' }: ControlTowerScreenProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [showEmptyDepts, setShowEmptyDepts] = useState(true);
  const [selectedStage, setSelectedStage] = useState<QueueStageRow | null>(null);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roVehicle, setRoVehicle] = useState<{ id: string; label: string; reconJobId: string } | null>(null);
  const [authVehicle, setAuthVehicle] = useState<{ id: string; label: string; reconJobId: string; current_stage_code?: string } | null>(null);
  const [workVehicle, setWorkVehicle] = useState<{ id: string; label: string; reconJobId: string } | null>(null);
  const [detailIntakeVehicle, setDetailIntakeVehicle] = useState<{ id: string; label: string; reconJobId: string } | null>(null);
  const [detailCompletedVehicle, setDetailCompletedVehicle] = useState<{ id: string; label: string; reconJobId: string } | null>(null);
  const [detailInspectionVehicle, setDetailInspectionVehicle] = useState<{ id: string; label: string; reconJobId: string } | null>(null);
  const [parkedOnLotVehicle, setParkedOnLotVehicle] = useState<{ id: string; label: string; reconJobId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tower' | 'insights' | 'tat-settings' | 'workflow-queue' | 'ai-insights'>(initialViewMode);
  const [expandedStageCode, setExpandedStageCode] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userJson = localStorage.getItem('recon_user');
    if (userJson) setUser(JSON.parse(userJson));
  }, []);

  const refreshSnapshot = async () => {
    setIsRefreshing(true);
    try {
      let newSnapshot = await getControlTowerSnapshot();

      // HARD SUPPRESSION: Filter out vehicles we know were just deleted
      if (lastDeletedId) {
        newSnapshot.stageGroups = newSnapshot.stageGroups.map(g => ({
          ...g,
          rows: g.rows.map(r => ({
            ...r,
            vehicles: r.vehicles // Logic to filter out specific jobs would go here if deep structure allowed
          }))
        }));
      }

      // Filter stage groups based on role
      if (user?.role === 'detailer') {
        const detailStages = ['detail-received', 'detail-completed', 'detail-inspection', 'parked-on-lot'];
        newSnapshot.stageGroups = newSnapshot.stageGroups.map(g => ({
          ...g,
          rows: g.rows.filter(r => detailStages.includes(r.code))
        })).filter(g => g.rows.length > 0);
      }

      setSnapshot(newSnapshot);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Request Notification Permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  const [toasts, setToasts] = useState<any[]>([]);

  const fetchUnreadNotifications = async () => {
    if (!user) return;
    const role = user.role?.toLowerCase();
    
    // Fetch notifications meant for this role that aren't read yet
    const { data } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (data) {
      const filtered = data.filter(n => {
        if (n.stage_code === 'detail-received') return role === 'detailer' || role === 'admin';
        if (n.stage_code === 'approval-sent') return role === 'manager' || role === 'admin' || role === 'advisor';
        return role === 'admin';
      });
      setToasts(filtered);
    }
  };

  const markAsRead = async (notifId: string) => {
    await supabase
      .from('app_notifications')
      .update({ is_read: true })
      .eq('id', notifId);
    setToasts(prev => prev.filter(t => t.id !== notifId));
  };

  useEffect(() => {
    fetchUnreadNotifications();
  }, [user]);

  // Real-time listener with Notifications
  useEffect(() => {
    const channel = supabase
      .channel('app-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
        },
        (payload: any) => {
          const notification = payload.new;
          console.log("REALTIME: Received Notification:", notification);
          
          refreshSnapshot();

          const role = user?.role?.toLowerCase();
          let shouldShow = false;

          if (notification.stage_code === 'detail-received') {
            if (role === 'detailer') shouldShow = true;
          } else if (notification.stage_code === 'approval-sent' || notification.stage_code === 'finalize-approval') {
            if (role === 'manager' || role === 'admin' || role === 'advisor') shouldShow = true;
          } else if (role === 'admin') {
            shouldShow = true;
          }

          if (shouldShow) {
            setToasts(prev => [notification, ...prev]);

            if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
              new Notification(notification.title, {
                body: notification.body,
                icon: "https://di-uploads-pod45.dealerinspire.com/amford/uploads/2025/08/am-ford-mobile-logo.png",
                tag: `notif-${notification.id}` 
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Filter stage groups based on search query and user role
  const filteredStageGroups = snapshot.stageGroups.map(group => ({
    ...group,
    rows: group.rows.filter(row => {
      // Search filter
      const matchesSearch = row.label.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Role filter for Detailers
      if (user?.role === 'detailer') {
        const detailStages = ['detail-received', 'detail-completed', 'detail-inspection', 'parked-on-lot'];
        if (!detailStages.includes(row.code)) return false;
      }

      // Hide empty stages if toggle is off
      if (!showEmptyDepts && row.vehicles === 0) return false;

      return true;
    })
  })).filter(group => {
    // 1. Must have rows after search/role filtering
    if (group.rows.length === 0) return false;

    // 2. If showEmptyDepts is true, show everything
    if (showEmptyDepts) return true;

    // 3. If showEmptyDepts is false, only show groups with actual vehicles
    return group.rows.some(row => row.vehicles > 0);
  });

  if (!mounted) return null;

  return (
    <OpsShell>
      <Navbar
        onSearch={setSearchQuery}
        onIntakeClick={() => setIsIntakeOpen(true)}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onNavigate={setViewMode}
        currentView={viewMode}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-black rounded-2xl px-6 py-3 flex flex-col items-center min-w-[160px] border-white/10 shadow-2xl transition-transform hover:scale-105 duration-300">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Active Operations</span>
              <span className="text-3xl font-black text-white">{snapshot.kpis.find(k => k.code === 'active')?.value || "0"}</span>
            </div>

            <div className="glass-morphism rounded-2xl px-6 py-3 flex flex-col items-center min-w-[160px] border-[#10B981]/20 shadow-xl transition-transform hover:scale-105 duration-300">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10B981] mb-1">Completed</span>
              <span className="text-3xl font-black text-[#1A1C1E]">{snapshot.kpis.find(k => k.code === 'ready')?.value || "0"}</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-4 glass-morphism rounded-2xl px-5 py-3 cursor-pointer hover:bg-white/60 transition-all active:scale-95 shadow-lg"
              onClick={() => setShowEmptyDepts(!showEmptyDepts)}
            >
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Show Empty Depts</span>
              <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showEmptyDepts ? 'bg-[#00142E]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showEmptyDepts ? 'left-6' : 'left-1'}`}></div>
              </div>
            </div>

            <div className="glass-morphism rounded-2xl px-8 py-3 text-center min-w-[180px] shadow-lg border-white/40">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Avg Cycle Time</div>
              <div className="text-xl font-black text-[#FF5252] uppercase tracking-tighter">
                {snapshot.kpis.find(k => k.code === 'cycle')?.value || "0.0d"}
              </div>
            </div>
          </div>
        </div>

        {/* Main Viewport */}
        {viewMode === 'insights' ? (
          <InsightsView
            snapshot={snapshot}
            onStageClick={(stage) => setSelectedStage(stage)}
            onSettingsClick={() => setViewMode('tat-settings')}
          />
        ) : viewMode === 'tat-settings' ? (
          <WorkflowSettings isSection={true} />
        ) : viewMode === 'workflow-queue' ? (
          <WorkflowQueue 
            onOpenRecord={(job: any) => {
              const vehicleInfo = {
                id: job.vehicle.id,
                label: `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`,
                reconJobId: job.id,
                current_stage_code: job.current_stage_code
              };

              // Map stage code to the correct operational modal
              const code = job.current_stage_code;
              if (code === 'ro-open') setRoVehicle(vehicleInfo);
              else if (code === 'approval-sent' || code === 'finalize-approval') setAuthVehicle(vehicleInfo);
              else if (code === 'work-completed') setWorkVehicle(vehicleInfo);
              else if (code === 'detail-received') setDetailIntakeVehicle(vehicleInfo);
              else if (code === 'detail-completed') setDetailCompletedVehicle(vehicleInfo);
              else if (code === 'detail-inspection') setDetailInspectionVehicle(vehicleInfo);
              else if (code === 'parked-on-lot') setParkedOnLotVehicle(vehicleInfo);
              else {
                // Default: Open the base RO modal for any other workflow stage
                setRoVehicle(vehicleInfo);
              }
            }}
            onDelete={() => refreshSnapshot()}
          />
        ) : viewMode === 'ai-insights' ? (
          <AIIntelligenceHub snapshot={snapshot} />
        ) : isRefreshing ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            {[1, 2].map((group) => (
              <div key={group} className="space-y-3">
                <div className="flex justify-center">
                  <div className="h-2 w-32 bg-white/5 rounded-full animate-pulse" />
                </div>
                <div className="space-y-1">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="w-full h-[52px] bg-white/5 rounded-xl border border-[#E0E0E0] flex items-center px-6 animate-pulse">
                      <div className="w-[35%] h-3 bg-white/10 rounded-full" />
                      <div className="flex-1 flex justify-center">
                        <div className="w-12 h-4 bg-white/10 rounded-full" />
                      </div>
                      <div className="w-[35%] flex justify-end gap-6">
                        <div className="w-10 h-3 bg-white/10 rounded-full" />
                        <div className="w-7 h-7 bg-white/10 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            {filteredStageGroups.length > 0 ? (
              filteredStageGroups.map((group) => (
                <div key={group.code} className="space-y-3">
                  <div className="flex justify-center">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em] mb-2">{group.label}</h3>
                  </div>
                  <div className="space-y-1">
                    {group.rows.map((row) => (
                      <StageRow
                        key={row.code}
                        row={row}
                        isExpanded={expandedStageCode === row.code}
                        onToggle={() => setExpandedStageCode(expandedStageCode === row.code ? null : row.code)}
                        onInfoClick={() => {
                          // Restrict access to manager stages for advisors
                          if (user?.role === 'advisor' && row.code === 'finalize-approval') {
                            alert("MANAGER AUTHORIZATION REQUIRED: You do not have permission to access the Final Approval stage.");
                            return;
                          }
                          setSelectedStage(row);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-medium">No active work found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>


      {selectedStage && (
        <VehicleListPopup
          key={refreshKey}
          refreshKey={refreshKey}
          lastDeletedId={lastDeletedId}
          stage={selectedStage}
          onClose={() => setSelectedStage(null)}
          onSuccess={(deletedId) => {
            if (deletedId) setLastDeletedId(deletedId);
            setTimeout(refreshSnapshot, 100);
          }}
          onROOpen={(v) => {
            setRoVehicle(v);
            setSelectedStage(null);
          }}
          onAuthRequired={(v) => {
            setAuthVehicle(v);
            setSelectedStage(null);
          }}
          onWorkCompleted={(v) => {
            setWorkVehicle(v);
            setSelectedStage(null);
          }}
          onDetailIntake={(v) => {
            setDetailIntakeVehicle(v);
            setSelectedStage(null);
          }}
          onDetailCompleted={(v) => {
            setDetailCompletedVehicle(v);
            setSelectedStage(null);
          }}
          onDetailInspection={(v) => {
            setDetailInspectionVehicle(v);
            setSelectedStage(null);
          }}
          onParkedOnLot={(v) => {
            setParkedOnLotVehicle(v);
            setSelectedStage(null);
          }}
        />
      )}

      <WorkflowSettings
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          refreshSnapshot();
        }}
      />

      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSuccess={() => {
          setIsIntakeOpen(false);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <ROOpenModal
        isOpen={!!roVehicle}
        vehicle={roVehicle}
        onClose={() => setRoVehicle(null)}
        onSuccess={() => {
          setRoVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <AuthorizationModal
        isOpen={!!authVehicle}
        vehicle={authVehicle}
        onClose={() => setAuthVehicle(null)}
        onSuccess={() => {
          setAuthVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <WorkCompletedModal
        isOpen={!!workVehicle}
        vehicle={workVehicle}
        onClose={() => setWorkVehicle(null)}
        onSuccess={() => {
          setWorkVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <DetailIntakeModal
        isOpen={!!detailIntakeVehicle}
        vehicle={detailIntakeVehicle}
        onClose={() => setDetailIntakeVehicle(null)}
        onSuccess={() => {
          setDetailIntakeVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <DetailCompletedModal
        isOpen={!!detailCompletedVehicle}
        vehicle={detailCompletedVehicle}
        onClose={() => setDetailCompletedVehicle(null)}
        onSuccess={() => {
          setDetailCompletedVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <DetailInspectionModal
        isOpen={!!detailInspectionVehicle}
        vehicle={detailInspectionVehicle}
        onClose={() => setDetailInspectionVehicle(null)}
        onSuccess={() => {
          setDetailInspectionVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      <ParkedOnLotModal
        isOpen={!!parkedOnLotVehicle}
        vehicle={parkedOnLotVehicle}
        onClose={() => setParkedOnLotVehicle(null)}
        onSuccess={() => {
          setParkedOnLotVehicle(null);
          setTimeout(refreshSnapshot, 500);
        }}
      />

      {/* Foreground Notification Toast Queue */}
      <div className="fixed bottom-10 right-10 z-[500] flex flex-col gap-4 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className="bg-white border border-[#E0E0E0] backdrop-blur-xl rounded-2xl p-6 shadow-lg max-w-sm flex gap-5 items-start animate-in slide-in-from-right-10 duration-500 pointer-events-auto"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FF6B6B] flex items-center justify-center shrink-0 shadow-lg shadow-[#FF6B6B]/20">
              <Clock className="w-6 h-6 text-[#333333]" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-black text-[#333333] uppercase tracking-tight">{toast.title}</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed line-clamp-2">{toast.body}</p>
              <div className="pt-3 flex gap-3">
                <button 
                  onClick={() => markAsRead(toast.id)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => {
                    markAsRead(toast.id);
                    refreshSnapshot();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#FF6B6B] hover:bg-[#ff5e5e] text-[10px] font-black uppercase tracking-widest text-[#333333] shadow-lg shadow-[#FF6B6B]/20 transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
            <button onClick={() => markAsRead(toast.id)} className="text-gray-500 hover:text-[#333333] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </OpsShell>
  );
}

function StageRow({
  row,
  onInfoClick,
  isExpanded,
  onToggle
}: {
  row: QueueStageRow;
  onInfoClick: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isWarning = row.avgHours > row.targetHours && row.vehicles > 0;

  const taglines: Record<string, string> = {
    'ro-open': "Initiating service records and vehicle intake protocols.",
    'approval-sent': "Awaiting customer authorization for identified repairs.",
    'finalize-approval': "Manager review of authorized work orders.",
    'work-completed': "Technician completion and quality check-off.",
    'detail-received': "Vehicle transfer to the detailing and aesthetics bay.",
    'detail-completed': "Final aesthetic refinement and protection application.",
    'detail-inspection': "Showroom-standard quality assurance audit.",
    'parked-on-lot': "Ready for customer collection or inventory display.",
    'completed': "Workflow finalized and record archived."
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onClick={onInfoClick}
        className={`group relative flex items-center px-8 py-3 rounded-2xl transition-all duration-500 cursor-pointer border shadow-xl ${isExpanded
          ? "bg-[#FF5252] border-[#FF5252]/20 shadow-[0_20px_50px_rgba(255,82,82,0.4)] scale-[1.02] z-10"
          : "glass-morphism hover:bg-white/60 hover:border-white/80 hover:-translate-y-0.5"
          }`}
      >
        {/* Label (Left) */}
        <div className="w-[35%]">
          <span className={`text-sm font-black tracking-tight uppercase ${isExpanded ? "text-white" : "text-[#1A1C1E]"}`}>
            {row.label}
          </span>
        </div>

        {/* Count (Center) */}
        <div className="flex-1 flex justify-center">
          <div className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all duration-500 shadow-inner ${isExpanded
            ? "bg-black/20 text-white"
            : row.vehicles > 0
              ? "bg-[#00142E] text-white shadow-[0_10px_20px_rgba(0,20,46,0.3)]"
              : "bg-black/5 text-gray-400"
            }`}>
            {row.vehicles} <span className={`text-[8px] opacity-70 ml-1 ${isExpanded ? 'text-white' : ''}`}>UNITS</span>
          </div>
        </div>

        {/* Avg Hours (Right) */}
        <div className="w-[35%] flex items-center justify-end gap-8">
          {row.code !== 'completed' && (
            <div className="text-right">
              <span className={`text-xs font-black ${isExpanded ? "text-white" : "text-blue-600"}`}>
                {row.targetHours >= 24 ? `${Math.floor(row.targetHours / 24)}d` :
                  row.targetHours >= 1 
                    ? `${Math.floor(row.targetHours)}h${Math.round((row.targetHours % 1) * 60) > 0 ? ` ${Math.round((row.targetHours % 1) * 60)}m` : ''}`
                    : `${Math.round(row.targetHours * 60)}m`}
              </span>
              <div className={`text-[8px] uppercase tracking-[0.2em] font-black mt-0.5 ${isExpanded ? "text-white/60" : "text-gray-400"}`}>PLANNED</div>
            </div>
          )}
        </div>
        
        {/* Progress Line */}
        {!isExpanded && row.vehicles > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-black/5 rounded-b-2xl overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isWarning 
                ? 'bg-[#FF5252] shadow-[0_0_12px_rgba(255,82,82,0.8)]' 
                : 'bg-[#10B981]'}`}
              style={{ width: `${Math.min(100, (row.avgHours / row.targetHours) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Dropdown Tagline */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-10 py-4 flex justify-center items-center">
          <p className="text-[11px] font-black text-[#FF5252] uppercase tracking-[0.5em] text-center animate-in fade-in slide-in-from-top-2 duration-700">
            {taglines[row.code] || "Standard workflow stage protocol."}
          </p>
        </div>
      </div>
    </div>
  );
}

function VehicleListPopup({
  stage,
  refreshKey,
  lastDeletedId,
  onClose,
  onSuccess,
  onROOpen,
  onAuthRequired,
  onWorkCompleted,
  onDetailIntake,
  onDetailCompleted,
  onDetailInspection,
  onParkedOnLot
}: {
  stage: QueueStageRow;
  refreshKey: number;
  lastDeletedId: string | null;
  onClose: () => void;
  onSuccess: (deletedId?: string) => void;
  onROOpen: (vehicle: { id: string; label: string; reconJobId: string }) => void;
  onAuthRequired: (vehicle: { id: string; label: string; reconJobId: string; current_stage_code?: string }) => void;
  onWorkCompleted: (vehicle: { id: string; label: string; reconJobId: string }) => void;
  onDetailIntake: (vehicle: { id: string; label: string; reconJobId: string }) => void;
  onDetailCompleted: (vehicle: { id: string; label: string; reconJobId: string }) => void;
  onDetailInspection: (vehicle: { id: string; label: string; reconJobId: string }) => void;
  onParkedOnLot: (vehicle: { id: string; label: string; reconJobId: string }) => void;
}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      setIsLoading(true);
      const { data: jobs } = await supabase
        .from('recon_jobs')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('current_stage_code', stage.code)
        .or('status.eq.active,status.eq.completed');

      const targetMinutes = (stage.targetHours || 24) * 60;

      let mappedVehicles = (jobs || []).map(j => {
        const ageMins = Math.floor((new Date().getTime() - new Date(j.updated_at || j.started_at).getTime()) / 60000);
        let formattedAge = "";

        if (ageMins < 60) formattedAge = `${ageMins}m`;
        else if (ageMins < 1440) formattedAge = `${Math.floor(ageMins / 60)}h ${ageMins % 60}m`;
        else formattedAge = `${Math.floor(ageMins / 1440)}d ${Math.floor((ageMins % 1440) / 60)}h`;

        const delayMins = ageMins - targetMinutes;
        let delayLabel = "";
        if (delayMins > 0) {
          if (delayMins < 60) delayLabel = `${delayMins}m delay`;
          else delayLabel = `${Math.floor(delayMins / 60)}h delay`;
        }

        return {
          ...j,
          vehicle_id: j.vehicle?.id,
          stock_number: j.vehicle?.stock_number || 'N/A',
          vehicle_label: `${j.vehicle?.year} ${j.vehicle?.make} ${j.vehicle?.model}`,
          vin: j.vehicle?.vin || 'N/A',
          current_stage_code: j.current_stage_code,
          stage_age_minutes: ageMins,
          formatted_age: formattedAge,
          delay_label: delayLabel,
          is_delayed: delayMins > 0,
          sla_status: delayMins > 0 ? 'critical' : (ageMins > targetMinutes * 0.8 ? 'warning' : 'healthy')
        };
      });

      // HARD SUPPRESSION: Ensure recently deleted vehicle doesn't reappear
      if (lastDeletedId) {
        mappedVehicles = mappedVehicles.filter(v => v.id !== lastDeletedId);
      }

      setVehicles(mappedVehicles);
      setIsLoading(false);
    }
    fetchVehicles();
  }, [stage.code, refreshKey, lastDeletedId]);

  const handleMoveStage = async (v: any) => {
    // 1. Stage-specific logic
    if (stage.code === 'ro-open') {
      onROOpen({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id
      });
      return;
    }

    if (stage.code === 'finalize-approval' || stage.code === 'approval-sent') {
      onAuthRequired({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id,
        current_stage_code: v.current_stage_code
      });
      return;
    }

    if (stage.code === 'work-completed') {
      onWorkCompleted({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id
      });
      return;
    }

    if (stage.code === 'detail-received') {
      onDetailIntake({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id
      });
      return;
    }

    if (stage.code === 'detail-completed') {
      onDetailCompleted({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id
      });
      return;
    }

    if (stage.code === 'detail-inspection') {
      onDetailInspection({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id
      });
      return;
    }

    if (stage.code === 'parked-on-lot') {
      onParkedOnLot({
        id: v.vehicle_id,
        label: v.vehicle_label,
        reconJobId: v.id
      });
      return;
    }

    // 2. Sequential movement logic
    const workflowOrder = ['ro-open', 'approval-sent', 'finalize-approval', 'work-completed', 'detail-received', 'detail-completed', 'detail-inspection', 'parked-on-lot', 'completed'];
    const currentIndex = workflowOrder.indexOf(stage.code);
    const nextStage = workflowOrder[currentIndex + 1];

    if (nextStage) {
      const { error } = await supabase.from('recon_jobs').update({
        current_stage_code: nextStage,
        updated_at: new Date().toISOString()
      }).eq('id', v.id);

      if (!error) {
        // 3. Trigger App Notification for critical transitions
        if (nextStage === 'approval-sent' || nextStage === 'detail-received') {
          try {
            await supabase.from('app_notifications').insert({
              title: nextStage === 'approval-sent' ? "Approval Required" : "Vehicle Ready for Detailing",
              body: `Unit ${v.vehicle_label} has moved to ${nextStage === 'approval-sent' ? 'Approval' : 'Detailing'}.`,
              stage_code: nextStage,
              job_id: v.id
            });
          } catch (notifErr) {
            console.error("Failed to insert notification:", notifErr);
          }
        }
        
        onSuccess();
        onClose();
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredVehicles = vehicles.filter(v => 
    v.vehicle_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.stock_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this vehicle record? This will remove all associated stage data.")) return;

    try {
      setIsLoading(true);
      console.log("Initiating server-side delete for job:", jobId);
      
      const { deleteReconJob } = await import("@/app/actions/delete-vehicle");
      const result = await deleteReconJob(jobId);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("Server-side deletion successful");
      
      // Update local list instantly
      setVehicles(prev => prev.filter(v => v.id !== jobId));
      
      // Force global refresh and pass the deleted ID to suppress it
      onSuccess(jobId);
    } catch (err: any) {
      console.error("Full deletion failure context:", err);
      alert("Error deleting vehicle: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
      <div className="glass-modal rounded-3xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 bg-white flex flex-col gap-6 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1A1C1E] tracking-tight uppercase leading-none">{stage.label}</h2>
              <p className="text-[#FF5252] font-black mt-2 uppercase tracking-[0.3em] text-[9px]">{stage.vehicles} UNITS CURRENTLY IN STAGE</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-[#FF5252] hover:text-white transition-all active:scale-90 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Per-Stage Search Bar */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5252] transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`SEARCH WITHIN ${stage.label.toUpperCase()}...`}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-black text-[#1A1C1E] outline-none focus:ring-4 focus:ring-[#FF5252]/5 focus:border-[#FF5252]/30 transition-all placeholder:text-gray-400 shadow-inner uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-[#FF5252]/20 border-t-[#FF5252] rounded-full animate-spin" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Retrieving Workflow Data...</p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            filteredVehicles.map((v) => {
              const isExpanded = expandedVehicleId === v.id;
              const isCritical = v.sla_status === 'critical';
              
              return (
                <div key={v.id} className="space-y-3">
                  <div
                    onClick={() => setExpandedVehicleId(isExpanded ? null : v.id)}
                    className={`glass-card rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer border-white/60 ${isExpanded
                      ? "bg-white/70 ring-2 ring-[#FF5252]/30 shadow-2xl scale-[1.01]"
                      : "hover:bg-white/60"
                      }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${isExpanded ? "bg-[#FF5252] text-white" : "bg-[#00142E] text-white"}`}>
                        <span className="text-xs font-black tracking-tighter">#{v.stock_number.slice(-4)}</span>
                      </div>
                      <div>
                        <div className={`text-base font-black transition-colors ${isExpanded ? "text-[#FF5252]" : "text-[#1A1C1E]"}`}>{v.vehicle_label}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">IDENTIFIER: <span className="text-[#1A1C1E]">{v.vin}</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <button 
                        onClick={(e) => handleDelete(v.id, e)}
                        className="w-10 h-10 rounded-xl glass-morphism border-red-200/50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all group/del"
                        title="Purge Record"
                      >
                        <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
                      </button>

                      <div className="text-right min-w-[100px]">
                        <div className={`text-sm font-black transition-colors ${v.is_delayed ? "text-[#FF5252]" : "text-blue-600"}`}>
                          {v.formatted_age}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] mt-1">
                          {v.is_delayed ? (
                            <span className="text-[#FF5252] animate-pulse">SLA BREACHED</span>
                          ) : <span className="text-gray-400">STAGE TIME</span>}
                        </div>
                      </div>

                      {stage.code !== 'completed' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveStage(v); }}
                          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${isExpanded
                            ? "bg-[#FF5252] text-white hover:bg-[#ff3b3b]"
                            : "bg-[#1A1C1E] text-white hover:bg-[#2a3b4f]"
                            }`}
                        >
                          Push Next
                        </button>
                      ) : (
                        <div className="px-5 py-2.5 rounded-xl glass-gold-strong border-[#10B981]/30 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em]">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="glass-morphism rounded-2xl p-8 mx-4 border-white/30 shadow-inner animate-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-2 gap-12">
                        <div>
                          <label className="text-[10px] font-black text-[#FF5252] uppercase tracking-[0.4em] block mb-5">Workflow Operations Log</label>
                          <div className="space-y-3">
                            {v.authorization_data ? (
                              v.authorization_data.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] font-bold bg-white/30 backdrop-blur-md p-4 rounded-xl border border-white/40 shadow-sm transition-all hover:bg-white/50">
                                  <span className="text-[#1A1C1E] uppercase tracking-tight">{item.description}</span>
                                  <span className={`px-3 py-1 rounded-lg ${item.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#FF5252]/10 text-[#FF5252]'}`}>
                                    {item.status === 'approved' ? `$${(item.finalCost || item.cost).toLocaleString()}` : 'DECLINED'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest py-4 border border-dashed border-gray-200 rounded-xl text-center">No service records found.</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#FF5252] uppercase tracking-[0.4em] block mb-5">Command Intelligence</label>
                          {v.final_decision ? (
                            <div className="bg-white/30 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-sm">
                              <div className="text-[10px] font-black text-[#1A1C1E] mb-3 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                FINAL DETERMINATION: <span className="text-blue-600">{v.final_decision}</span>
                              </div>
                              <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                                {v.final_decision_notes || "Operational notes not logged."}
                              </p>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest py-10 border border-dashed border-gray-200 rounded-xl text-center">Awaiting command authorization...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="w-10 h-10 mb-4 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">No units found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


