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
          className="rugged-card p-6 flex items-center gap-4 text-left bg-surface-container-high hover:bg-secondary-fixed transition-colors active:scale-95"
        >
          <span className={`material-symbols-outlined text-3xl ${isSyncing ? 'animate-spin' : 'text-primary'}`}>sync</span>
          <div>
            <h3 className="font-headline-sm uppercase">Tải Danh Mục Mới</h3>
            <p className="font-body-sm text-on-surface-variant">Đồng bộ Mã xe, Máy xúc, Vật liệu từ máy chủ về điện thoại</p>
          </div>
        </button>

      <div className="grid grid-cols-2 gap-4 w-full mt-4">
        <Link 
          href="/more/master-data"
          className="bg-primary text-on-primary p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center active:translate-y-1 active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined text-3xl mb-2">database</span>
          <span className="font-label-lg font-bold uppercase">Danh Mục</span>
        </Link>
        <Link 
          href="/projects"
          className="bg-[#006a60] text-white p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center active:translate-y-1 active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined text-3xl mb-2">domain</span>
          <span className="font-label-lg font-bold uppercase">Dự Án</span>
        </Link>
        <Link 
          href="/approvals"
          className="bg-secondary text-on-secondary p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center active:translate-y-1 active:shadow-none transition-all col-span-2"
        >
          <span className="material-symbols-outlined text-3xl mb-2">fact_check</span>
          <span className="font-label-lg font-bold uppercase">Phê Duyệt</span>
        </Link>
      </div>
      </div>
    </div>
  );
}
