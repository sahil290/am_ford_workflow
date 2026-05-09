"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OpsShell } from "@/components/app-shell/ops-shell";
import { Sidebar } from "@/components/navbar/sidebar";
import { Navbar } from "@/components/navbar/navbar";
import { 
  Users, 
  UserPlus, 
  Mail, 
  User, 
  Key, 
  Shield, 
  Search,
  MoreVertical,
  Trash2,
  CheckCircle2,
  X,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { WorkflowSettings } from "@/components/control-tower/workflow-settings";

export default function AdminPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("advisor");

  useEffect(() => {
    // Role protection
    const userJson = localStorage.getItem('recon_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role !== 'admin') {
        router.replace('/control-tower');
        return;
      }
    } else {
      router.replace('/login');
      return;
    }

    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('schema cache')) {
          console.warn("Profiles table not found. Please create it in Supabase SQL Editor.");
          setUsers([]);
        } else {
          throw error;
        }
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      console.error("Database error:", err.message);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd call a server action to create the user in Supabase Auth
    // and then save the profile. For now, we'll save to 'profiles' table.
    const { data, error } = await supabase.from('profiles').insert([
      { email, username, password, role, created_at: new Date().toISOString() }
    ]);

    if (!error) {
      alert("User created successfully!");
      setIsAddModalOpen(false);
      fetchUsers();
      // Reset form
      setEmail(""); setUsername(""); setPassword("");
    } else {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <OpsShell>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} onIntakeClick={() => {}} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
          
          <main className="max-w-[1600px] mx-auto px-6 py-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-black tracking-tight uppercase text-[#1A1C1E] leading-none">
                  User Management
                </h1>
                <p className="text-[#FF5252] font-black mt-2 uppercase tracking-[0.3em] text-[10px]">
                  MANAGE SYSTEM ACCESS & PROTOCOLS
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-4 bg-[#1A1C1E] hover:bg-[#FF5252] text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-95"
              >
                <UserPlus className="w-5 h-5" />
                Enroll New Staff
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { label: "Staff Strength", value: users.length, color: "text-blue-600" },
                { label: "Active Roles", value: "3 Tiers", color: "text-[#10B981]" },
                { label: "System Status", value: "Optimal", color: "text-[#FF5252]" }
              ].map((stat, i) => (
                <div key={i} className="glass-morphism border-white/40 rounded-[2rem] p-8 shadow-xl transition-transform hover:scale-105 duration-300">
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-3">{stat.label}</div>
                  <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="glass-morphism border-white/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-white/20 flex items-center justify-between bg-white/20">
                <div className="flex items-center gap-6 flex-1 max-w-xl">
                  <Search className="w-6 h-6 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="SCAN PERSONNEL DATABASE..." 
                    className="bg-transparent border-none outline-none text-sm font-black text-[#1A1C1E] w-full placeholder:text-gray-400 uppercase tracking-widest"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/20 border-b border-white/10">
                      <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Personnel Identity</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Credentials</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Operational Access</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Directives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {isLoading ? (
                      <tr><td colSpan={4} className="px-10 py-24 text-center text-gray-500 italic uppercase text-xs font-black tracking-[0.5em]">Syncing Human Capital Telemetry...</td></tr>
                    ) : users.length > 0 ? (
                      users.map((user, i) => (
                        <tr key={i} className="hover:bg-white/40 transition-all group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 glass-morphism rounded-2xl flex items-center justify-center border-white/60 shadow-inner group-hover:bg-[#1A1C1E] transition-all">
                                <User className="w-6 h-6 text-blue-500 group-hover:text-white" />
                              </div>
                              <span className="font-black text-base text-[#1A1C1E] tracking-tight uppercase">{user.username}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 font-bold text-sm text-gray-500">{user.email}</td>
                          <td className="px-10 py-8">
                            <span className="px-4 py-1.5 bg-[#1A1C1E] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg group-hover:bg-[#FF5252] transition-all">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-10 h-10 glass-morphism border-red-200/50 flex items-center justify-center text-red-400 hover:bg-[#FF5252] hover:text-white transition-all shadow-sm active:scale-90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="px-10 py-24 text-center text-gray-400 font-black uppercase tracking-[0.4em] italic">No active personnel files found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </OpsShell>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="glass-morphism rounded-[2.5rem] w-full max-w-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border-white/40">
            <div className="p-8 border-b border-white/20 bg-white/20 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1A1C1E] tracking-tight uppercase leading-none">Personnel Enrollment</h2>
                <p className="text-[#FF5252] font-black mt-2 uppercase tracking-[0.4em] text-[9px]">ENROLL NEW OPERATIVE INTO SYSTEM</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-12 h-12 glass-morphism rounded-2xl flex items-center justify-center hover:bg-[#FF5252] hover:text-white border-white/60 transition-all active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-10 space-y-8 bg-white/10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-[0.3em] ml-1 opacity-60">Callsign / Username</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1C1E] opacity-40" />
                    <input 
                      type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="E.G. ALPHA_ONE"
                      className="w-full command-input pl-16 h-[64px] uppercase tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-[0.3em] ml-1 opacity-60">Access Credentials (Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1C1E] opacity-40" />
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="JOHN@AMFORD.COM"
                      className="w-full command-input pl-16 h-[64px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-[0.3em] ml-1 opacity-60">Secure Passkey</label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1C1E] opacity-40" />
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full command-input pl-16 h-[64px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-[0.3em] ml-1 opacity-60">Operational Tier (Role)</label>
                  <div className="relative">
                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1C1E] opacity-40" />
                    <select 
                      value={role} onChange={(e) => setRole(e.target.value)}
                      className="w-full command-input pl-16 pr-12 h-[64px] appearance-none cursor-pointer uppercase tracking-widest"
                    >
                      <option value="advisor">Service Advisor</option>
                      <option value="manager">Workshop Manager</option>
                      <option value="detailer">Detailing Team</option>
                      <option value="admin">System Administrator</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1C1E] opacity-30 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/20">
                <button 
                  type="button" onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-[#FF5252] glass-morphism transition-all active:scale-95"
                >
                  ABORT
                </button>
                <button 
                  type="submit"
                  className="flex-2 px-12 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] text-white bg-[#1A1C1E] hover:bg-[#FF5252] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <UserPlus className="w-5 h-5" />
                  CONFIRM ENROLLMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        select option {
          background-color: #0f172a;
          color: white;
        }
      `}</style>

      {isSettingsOpen && (
        <WorkflowSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}
