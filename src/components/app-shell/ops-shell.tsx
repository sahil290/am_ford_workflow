"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

type OpsShellProps = {
  children: React.ReactNode;
};

export function OpsShell({ children }: OpsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userJson = localStorage.getItem('recon_user');
    if (!userJson && pathname !== '/login') {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router, pathname]);

  if ((!mounted || !isAuthorized) && pathname !== '/login') {
    return (
      <div className="h-screen bg-[#F8F8F8] relative overflow-hidden flex items-center justify-center">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF5252]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#FF5252]/10 border-t-[#FF5252] rounded-full animate-spin shadow-[0_0_20px_rgba(255,82,82,0.2)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[11px] font-black text-[#1A1C1E] uppercase tracking-[0.4em] animate-pulse">Initializing Interface</p>
            <div className="h-[2px] w-12 bg-[#FF5252]/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF5252] w-1/2 animate-loading-slide" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ops-shell">
      <div className="relative mx-auto min-h-screen max-w-[1600px] px-3 py-3 text-sm md:px-5 lg:px-6">
        <main className="min-w-0">
          {isAuthorized || pathname === '/login' ? children : null}
        </main>
      </div>
    </div>
  );
}

function NavDot({ active = false }: { active?: boolean }) {
  return (
    <div
      className={[
        "h-11 w-11 rounded-2xl border transition-colors",
        active
          ? "border-[var(--border-strong)] bg-[rgba(60,140,255,0.18)]"
          : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)]",
      ].join(" ")}
    />
  );
}
