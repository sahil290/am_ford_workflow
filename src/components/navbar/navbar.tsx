"use client";

import { useState , useEffect} from "react";
import Link from "next/link";
import { LogOut, User, Settings, ChevronDown, Mail, Shield } from "lucide-react";

export function Navbar({
  onSearch,
  onIntakeClick,
  onMenuClick
}: {
  onSearch?: (query: string) => void;
  onIntakeClick?: () => void;
  onMenuClick?: () => void;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const userJson = localStorage.getItem('recon_user');
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    localStorage.removeItem('recon_user');
    window.location.href = '/login';
  };

  return (
    <nav className="glass-morphism py-4 px-6 sticky top-0 z-50 border-x-0 border-t-0 rounded-none shadow-none">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left: Hamburger Menu */}
        <div className="flex-1 flex justify-start">
          <button
            onClick={onMenuClick}
            className="w-12 h-12 glass-morphism rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/60 transition-all active:scale-95 group shadow-sm border-white/60"
          >
            <div className="h-[2px] w-6 bg-[#1A1C1E] group-hover:bg-[#FF5252] transition-colors rounded-full"></div>
            <div className="h-[2px] w-4 bg-[#1A1C1E] group-hover:bg-[#FF5252] transition-colors rounded-full ml-auto mr-3"></div>
            <div className="h-[2px] w-6 bg-[#1A1C1E] group-hover:bg-[#FF5252] transition-colors rounded-full"></div>
          </button>
        </div>

        {/* Center: Logo */}
        <div className="flex-[2] flex justify-center px-4">
          <Link href="/control-tower" className="flex items-center gap-4 group">
            <div className="glass-morphism p-2 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 border-white/80">
              <img
                src="https://di-uploads-pod45.dealerinspire.com/amford/uploads/2025/08/am-ford-mobile-logo.png"
                className="h-9 w-auto"
                alt="AM Ford Logo"
              />
            </div>
            <span className="text-[#1A1C1E] font-black text-xl tracking-tighter uppercase group-hover:text-[#FF5252] transition-colors whitespace-nowrap">User Management</span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="relative hidden lg:block">
            <input
              type="text"
              placeholder="SEARCH STAGES..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="glass-morphism rounded-xl px-5 py-2.5 text-[10px] uppercase font-black tracking-widest text-[#1A1C1E] placeholder-gray-400 w-56 focus:outline-none focus:ring-2 focus:ring-[#FF5252]/20 focus:border-[#FF5252]/50 transition-all border-white/60 shadow-inner"
            />
            <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={onIntakeClick}
            className="bg-[#1A1C1E] hover:bg-[#FF5252] rounded-xl px-8 py-3 text-white text-[11px] font-black tracking-[0.3em] uppercase transition-all shadow-xl hover:shadow-[#FF5252]/20 active:scale-95"
          >
            INTAKE
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 w-12 h-12 glass-morphism rounded-xl items-center justify-center hover:bg-white/60 transition-all border-white/60 shadow-sm ${isProfileOpen ? 'ring-2 ring-[#FF5252]/50 border-transparent shadow-lg shadow-[#FF5252]/10' : ''}`}
            >
              <User className={`w-5 h-5 transition-colors ${isProfileOpen ? 'text-[#FF5252]' : 'text-[#1A1C1E]'}`} />
            </button>

            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  {/* User Header */}
                  <div className="p-6 border-b border-[#E0E0E0] bg-[#F5F5F5]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FF6B6B] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                        <span className="text-lg font-black text-white uppercase">
                          {(user?.full_name || user?.username || user?.display_name || user?.name || 'U').charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#333333] uppercase tracking-tight">
                          {user?.full_name || user?.username || user?.display_name || user?.name || 'USER NAME'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user?.email || 'USER@EXAMPLE.COM'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details & Role */}
                  <div className="p-4">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0]">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-[#FF6B6B]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CURRENT ROLE</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-[#FF6B6B]/10 text-[#FF6B6B] text-[10px] font-black tracking-widest uppercase">
                        {user?.role || 'STAFF'}
                      </span>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="p-4 bg-[#F5F5F5] border-t border-[#E0E0E0]">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">SIGN OUT SYSTEM</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}



