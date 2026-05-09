"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  BarChart3,
  Settings,
  LogOut,
  X,
  ClipboardList,
  Users,
  Clock,
  ChevronDown,
  ChevronRight,
  Activity,
  Sparkles
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick?: () => void;
  onNavigate?: (view: 'tower' | 'insights' | 'tat-settings' | 'workflow-queue' | 'ai-insights') => void;
  currentView?: 'tower' | 'insights' | 'tat-settings' | 'workflow-queue' | 'ai-insights';
};

export function Sidebar({ isOpen, onClose, onSettingsClick, onNavigate, currentView }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isWorkshopOpen, setIsWorkshopOpen] = useState(true);

  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const userJson = localStorage.getItem('recon_user');
    if (userJson) setUser(JSON.parse(userJson));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isDetailer = user?.role === 'detailer';

  const workshopItems = [
    { icon: LayoutDashboard, label: "Control Tower", href: "/control-tower" },
    { icon: ClipboardList, label: "Workflow Queue", href: "/workflow-queue" },
    { icon: BarChart3, label: "Insights", href: "/insights", hide: isDetailer },
    { icon: Clock, label: "TAT Settings", href: "/tat-settings", hide: !isAdmin && !isManager },
  ].filter(item => !item.hide);

  const mainItems = [
    { icon: Sparkles, label: "AI Intelligence", href: "/ai-insights" },
    { icon: Users, label: "Admin Panel", href: "/admin", hide: !isAdmin },
  ].filter(item => !item.hide);

  const isItemActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = () => {
    localStorage.removeItem('recon_user');
    router.replace('/login');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 opacity-100 animate-in fade-in pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-80 glass-morphism-dark border-r-0 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-none shadow-none ${isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}`}
      >
        <div className="flex flex-col h-full bg-[#1A1C1E]/40 backdrop-blur-3xl">
          {/* Header */}
          <div className="pt-10 pb-8 px-6 flex items-center justify-start relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5252]/5 to-transparent opacity-50" />
            <div className="flex flex-col items-center gap-6 relative z-10 group w-full">
              <div className="bg-white p-3.5 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all duration-500 border-white/40 shrink-0">
                <img
                  src="https://di-uploads-pod45.dealerinspire.com/amford/uploads/2025/08/am-ford-mobile-logo.png"
                  className="h-10 w-auto"
                  alt="AM Ford Logo"
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-white font-black tracking-[0.2em] text-xl uppercase group-hover:text-[#FF5252] transition-all duration-500 leading-none">User Management</span>
                <span className="text-[9px] font-black text-[#FF5252] uppercase tracking-[0.5em] mt-3 opacity-80">Operations Unit</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">

            <div className="px-3 space-y-1">
              <button
                onClick={() => setIsWorkshopOpen(!isWorkshopOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${isWorkshopOpen ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                {isWorkshopOpen && <div className="absolute inset-0 bg-gradient-to-r from-[#FF5252]/10 to-transparent opacity-50" />}
                <div className="flex items-center gap-3 relative z-10">
                  <Activity className={`w-4 h-4 ${isWorkshopOpen ? 'text-[#FF5252] animate-pulse' : 'text-white/40 group-hover:text-[#FF5252]'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fleet Management</span>
                </div>
                <div className="relative z-10">
                  {isWorkshopOpen ? <ChevronDown className="w-3 h-3 opacity-40" /> : <ChevronRight className="w-3 h-3 opacity-40" />}
                </div>
              </button>

              {isWorkshopOpen && (
                <div className="pl-3 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                  {workshopItems.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group cursor-pointer relative overflow-hidden ${active
                          ? 'bg-[#FF5252] text-white shadow-md'
                          : 'text-white/40 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <item.icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-white/40 group-hover:text-[#FF5252]'}`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-white/5 my-10 mx-2" />

            <div className="px-3 mt-10 space-y-2">
              {mainItems.map((item) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group cursor-pointer relative overflow-hidden ${active
                      ? 'bg-gradient-to-r from-[#FF5252] to-[#FF6B6B] text-white shadow-lg'
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-white/40 group-hover:text-[#FF5252]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 mt-auto border-t border-white/5">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 px-4 py-3.5 w-full rounded-xl text-white bg-white/5 hover:bg-[#FF5252] transition-all group border border-white/10 shadow-sm active:scale-95"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#FF5252] group-hover:text-white" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Emergency Exit</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
