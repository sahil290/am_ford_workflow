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
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    setMounted(true);
    const userJson = localStorage.getItem('recon_user');
    if (userJson) setUser(JSON.parse(userJson));
  }, []);

  if (!mounted) return null;

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
        className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-100 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-none shadow-2xl ${isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}`}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="pt-10 pb-8 px-6 flex items-center justify-start relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4325C]/5 to-transparent opacity-50" />
            <div className="flex flex-col items-center gap-6 relative z-10 group w-full">
              <div className="bg-white p-3.5 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-500 border border-gray-100 shrink-0">
                <img
                  src="https://di-uploads-pod45.dealerinspire.com/amford/uploads/2025/08/am-ford-mobile-logo.png"
                  className="h-10 w-auto"
                  alt="AM Ford Logo"
                />
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[#1A1C1E] font-black tracking-[0.2em] text-xl uppercase group-hover:text-[#D4325C] transition-all duration-500 leading-none">User Management</span>
                <span className="text-[9px] font-black text-[#D4325C] uppercase tracking-[0.5em] mt-3 opacity-80">Operations Unit</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar">

            <div className="px-4 space-y-3">
              <button
                onClick={() => setIsWorkshopOpen(!isWorkshopOpen)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all group relative overflow-hidden ${isWorkshopOpen ? 'bg-gray-50 text-[#1A1C1E] border border-gray-100' : 'text-gray-400 hover:text-[#1A1C1E] hover:bg-gray-50'}`}
              >
                {isWorkshopOpen && <div className="absolute inset-0 bg-gradient-to-r from-[#D4325C]/5 to-transparent opacity-50" />}
                <div className="flex items-center gap-3 relative z-10">
                  <Activity className={`w-4 h-4 ${isWorkshopOpen ? 'text-[#D4325C] animate-pulse' : 'text-gray-300 group-hover:text-[#D4325C]'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fleet Management</span>
                </div>
                <div className="relative z-10">
                  {isWorkshopOpen ? <ChevronDown className="w-3 h-3 opacity-40" /> : <ChevronRight className="w-3 h-3 opacity-40" />}
                </div>
              </button>

              {isWorkshopOpen && (
                <div className="pl-4 space-y-2 mt-2 animate-in slide-in-from-top-2 duration-300">
                  {workshopItems.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all group cursor-pointer relative overflow-hidden ${active
                          ? 'bg-[#D4325C] text-white shadow-lg'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A1C1E]'
                          }`}
                      >
                        <item.icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#D4325C]'}`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 my-12 mx-4" />

            <div className="px-4 space-y-3">
              {mainItems.map((item) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all group cursor-pointer relative overflow-hidden ${active
                      ? 'bg-gradient-to-r from-[#D4325C] to-[#E84D76] text-white shadow-lg'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A1C1E]'
                      }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#D4325C]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 mt-auto border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 px-5 py-4 w-full rounded-xl text-gray-700 bg-gray-50 hover:bg-[#D4325C] hover:text-white transition-all group border border-gray-100 shadow-sm active:scale-95"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#D4325C] group-hover:text-white" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Emergency Exit</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
