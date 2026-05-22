"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { SyncManager } from "@/components/SyncManager";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <SyncManager />
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface border-b-2 border-on-surface">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-high rounded-full transition-all active:scale-95">
            menu
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Trung Bắc Cạn</h1>
        </div>
        <button className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-high rounded-full transition-all active:scale-95">
          sync
        </button>
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
