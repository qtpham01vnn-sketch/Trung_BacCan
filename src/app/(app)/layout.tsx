"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { SyncManager } from "@/components/SyncManager";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/utils/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const [onlineCount, setOnlineCount] = useState(18);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else if (!user) {
        const userRole = session.user.email?.toLowerCase().includes("admin") ? "admin" : "field_worker";
        setAuth(session, userRole);
      }
      setMounted(true);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const userRole = session.user.email?.toLowerCase().includes("admin") ? "admin" : "field_worker";
        setAuth(session, userRole);
      } else {
        setAuth(null, null);
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simulate online users to increase credibility
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        let newCount = prev + change;
        if (newCount < 15) newCount = 15 + Math.floor(Math.random() * 3);
        if (newCount > 45) newCount = 45 - Math.floor(Math.random() * 3);
        return newCount;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Protect routes based on role
  useEffect(() => {
    if (mounted && role === "field_worker") {
      const restrictedRoutes = ["/reports", "/projects", "/approvals"];
      if (restrictedRoutes.some(r => pathname.startsWith(r))) {
        router.replace("/input");
      }
    }
  }, [mounted, pathname, role, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <SyncManager />
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface border-b-2 border-on-surface shadow-sm">
        <div className="flex items-center gap-4">
          {pathname !== "/" ? (
            <button 
              onClick={() => router.back()} 
              className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-high rounded-full transition-all active:scale-95"
            >
              arrow_back
            </button>
          ) : (
            <button className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-high rounded-full transition-all active:scale-95">
              menu
            </button>
          )}
          <div className="flex items-baseline gap-2">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">Trung Bắc Cạn</h1>
            <span className="text-[10px] font-bold text-on-surface-variant opacity-60 tracking-wider hidden sm:inline">v1.0.1</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Online Counter & Avatars */}
          <div className="flex items-center bg-surface-container-low border border-on-surface/20 rounded-full pl-1 pr-3 py-1 cursor-pointer hover:bg-surface-container transition-colors" title="Người đang trực tuyến">
            <div className="flex -space-x-2 mr-2">
              <img className="w-6 h-6 rounded-full border border-surface object-cover shadow-sm" src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
              <img className="w-6 h-6 rounded-full border border-surface object-cover shadow-sm" src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" />
              <img className="w-6 h-6 rounded-full border border-surface object-cover shadow-sm" src="https://randomuser.me/api/portraits/men/46.jpg" alt="User" />
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            <span className="text-xs font-bold text-on-surface-variant">+{onlineCount}</span>
          </div>

          {role === "field_worker" && (
            <span className="bg-surface-container-high text-xs px-2 py-1 font-bold text-on-surface-variant uppercase tracking-wider hidden sm:inline">
              CÔNG NHÂN
            </span>
          )}
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="material-symbols-outlined text-error p-2 hover:bg-error-container hover:text-on-error-container rounded-full transition-all active:scale-95"
            title="Đăng xuất"
          >
            logout
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-grow pt-20 pb-24 px-4 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 pb-safe bg-surface border-t-2 border-on-surface">
        <Link
          href="/"
          className={clsx(
            "flex flex-col items-center justify-center duration-150 group",
            pathname === "/" ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
          )}
        >
          <span className="material-symbols-outlined group-hover:scale-110">dashboard</span>
          <span className="font-label-md text-label-md">Bảng tin</span>
        </Link>

        {role === "admin" && (
          <Link
            href="/projects"
            className={clsx(
              "flex flex-col items-center justify-center duration-150 group",
              pathname === "/projects" ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
            )}
          >
            <span className="material-symbols-outlined group-hover:scale-110">construction</span>
            <span className="font-label-md text-label-md">Dự án</span>
          </Link>
        )}

        <Link
          href="/input"
          className={clsx(
            "flex flex-col items-center justify-center font-bold rounded-full px-4 py-1 scale-110 duration-150",
            pathname === "/input" ? "text-primary bg-primary-container" : "text-on-surface bg-surface-container-high hover:bg-secondary-container"
          )}
        >
          <span className="material-symbols-outlined filled-icon">add_box</span>
          <span className="font-label-md text-label-md">Nhập liệu</span>
        </Link>

        {role === "admin" && (
          <Link
            href="/reports"
            className={clsx(
              "flex flex-col items-center justify-center duration-150 group",
              pathname === "/reports" ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
            )}
          >
            <span className="material-symbols-outlined group-hover:scale-110">assessment</span>
            <span className="font-label-md text-label-md">Báo cáo</span>
          </Link>
        )}

        <Link
          href="/more"
          className={clsx(
            "flex flex-col items-center justify-center duration-150 group",
            pathname === "/more" ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
          )}
        >
          <span className="material-symbols-outlined group-hover:scale-110">more_horiz</span>
          <span className="font-label-md text-label-md">Thêm</span>
        </Link>
      </nav>
    </div>
  );
}
