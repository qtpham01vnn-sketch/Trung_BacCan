"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { db } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function MorePage() {
  const role = useAuthStore((state) => state.role);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSyncMasterData = async () => {
    try {
      setIsSyncing(true);
      const { data, error } = await supabase.from("master_data").select("*");
      if (error) throw error;
      
      if (data) {
        // Clear old data and insert new
        await db.masterData.clear();
        await db.masterData.bulkAdd(data);
        alert(`Đã đồng bộ ${data.length} danh mục về máy!`);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi đồng bộ danh mục");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm("Hành động này sẽ xóa toàn bộ dữ liệu tạm trên máy, bao gồm cả các phiếu chưa đồng bộ. Bạn có chắc chắn muốn xóa?")) {
      try {
        await Promise.all([
          db.fieldForms.clear(),
          db.syncQueue.clear(),
          db.masterData.clear(),
          db.projects.clear()
        ]);
        alert("Đã xóa bộ nhớ tạm thành công!");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Lỗi khi xóa bộ nhớ tạm");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi đăng xuất");
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Mở Rộng</h2>
        <p className="font-body-md text-on-surface-variant">Cài đặt và Quản trị hệ thống.</p>
      </header>

      <div className="space-y-8 mt-6">
        
        {/* Nhóm Quản Trị */}
        {role === "admin" && (
        <section>
          <h3 className="font-headline-sm font-bold uppercase mb-4 text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            Nhóm Quản Trị
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/more/master-data"
              className="group bg-primary text-on-primary p-6 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-none bg-white/20 border-2 border-white/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">database</span>
              </div>
              <span className="font-label-lg font-bold uppercase tracking-wider">Danh Mục</span>
            </Link>
            <Link 
              href="/projects"
              className="group bg-[#006a60] text-white p-6 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-none bg-white/20 border-2 border-white/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">domain</span>
              </div>
              <span className="font-label-lg font-bold uppercase tracking-wider">Dự Án</span>
            </Link>
            <Link 
              href="/approvals"
              className="group bg-secondary text-on-secondary p-6 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200 col-span-2"
            >
              <div className="w-16 h-16 rounded-none bg-white/20 border-2 border-white/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">fact_check</span>
              </div>
              <span className="font-label-lg font-bold uppercase tracking-wider">Phê Duyệt</span>
            </Link>
          </div>
        </section>
        )}

        {/* Nhóm Hệ Thống */}
        <section>
          <h3 className="font-headline-sm font-bold uppercase mb-4 text-error flex items-center gap-2">
            <span className="material-symbols-outlined">settings_system_daydream</span>
            Nhóm Hệ Thống
          </h3>
          <div className="grid gap-4">
            <button 
              onClick={handleSyncMasterData}
              disabled={isSyncing}
              className="p-6 flex items-center gap-4 text-left bg-surface-container-highest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200 group"
            >
              <span className={`material-symbols-outlined text-4xl ${isSyncing ? 'animate-spin' : 'text-primary'} group-hover:scale-110 transition-transform`}>sync</span>
              <div>
                <h3 className="font-headline-sm uppercase font-bold">Tải Danh Mục Mới</h3>
                <p className="font-body-sm text-on-surface-variant font-medium">Đồng bộ Mã xe, Máy xúc, Vật liệu từ máy chủ về điện thoại</p>
              </div>
            </button>

            <button 
              onClick={handleClearCache}
              className="p-6 flex items-center gap-4 text-left bg-[#ffdad6] text-[#410002] border-4 border-error shadow-[6px_6px_0px_0px_#ba1a1a] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_#ba1a1a] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200 group"
            >
              <span className="material-symbols-outlined text-4xl text-error group-hover:scale-110 transition-transform">delete_sweep</span>
              <div>
                <h3 className="font-headline-sm uppercase font-bold text-error">Xóa Bộ Nhớ Tạm</h3>
                <p className="font-body-sm font-medium">Xóa dữ liệu Offline (dùng khi App bị kẹt)</p>
              </div>
            </button>

            <button 
              onClick={handleLogout}
              className="p-6 mt-4 flex items-center justify-center gap-4 text-center bg-error text-on-error border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-none bg-white/20 border-2 border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">logout</span>
              </div>
              <span className="font-label-lg font-bold uppercase tracking-wider">Đăng Xuất</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

