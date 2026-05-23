"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { db } from "@/lib/db";

export default function MorePage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

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

  return (
    <div className="space-y-6">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Mở Rộng</h2>
        <p className="font-body-md text-on-surface-variant">Cài đặt và Quản trị hệ thống.</p>
      </header>

      <div className="grid gap-4">
        {/* Sync Master Data */}
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

      <div className="grid grid-cols-2 gap-4 w-full mt-4">
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
      </div>
    </div>
  );
}
