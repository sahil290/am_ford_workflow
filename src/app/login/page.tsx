"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User,
  Key,
  Car,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (dbError || !data) {
        throw new Error("Invalid username or password. Please contact your administrator.");
      }

      // Store session in localStorage (Simplified for demo, in production use proper Auth)
      localStorage.setItem('recon_user', JSON.stringify(data));

      // Redirect based on role
      router.push('/control-tower');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-[#FF6B6B]/30 font-sans">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white p-3 rounded-[20px] flex items-center justify-center shadow-2xl shadow-black/40 mb-6 border border-white/10">
            <img
              src="https://di-uploads-pod45.dealerinspire.com/amford/uploads/2025/08/am-ford-mobile-logo.png"
              className="h-10 w-auto"
              alt="AM Ford Logo"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase text-center">Workshop</h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-[0.3em] text-[10px]">Operations Command Center</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="mb-8 text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">System Access</h2>
            <p className="text-gray-500 text-[10px] mt-2 font-bold uppercase tracking-widest">Identify to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in shake duration-500">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-red-500 leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FF6B6B] transition-colors" />
                <input
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full bg-[#1e293b]/50 border border-white/5 rounded-2xl pl-14 pr-6 h-[60px] text-white font-bold text-sm outline-none focus:border-[#FF6B6B]/50 focus:bg-[#FF6B6B]/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FF6B6B] transition-colors" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-[#1e293b]/50 border border-white/5 rounded-2xl pl-14 pr-6 h-[60px] text-white font-bold text-sm outline-none focus:border-[#FF6B6B]/50 focus:bg-[#FF6B6B]/5 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B6B] hover:bg-[#ff5e5e] text-white h-[60px] rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-black/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Unlock Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p className="text-center mt-12 text-gray-600 text-[10px] font-bold uppercase tracking-widest animate-in fade-in duration-1000 delay-500">
          Automated Dealership Workflow Engine v2.4
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-in.shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
