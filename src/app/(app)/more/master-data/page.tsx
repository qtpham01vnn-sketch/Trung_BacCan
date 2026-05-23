"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { db } from "@/lib/db";

interface MasterData {
  id: string;
  type: string;
  value: string;
  label: string;
  is_active: boolean;
}

export default function MasterDataPage() {
  const [data, setData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [formType, setFormType] = useState("vehicle");
  const [formValue, setFormValue] = useState("");
  const [formLabel, setFormLabel] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: dbData } = await supabase.from("master_data").select("*").order("created_at", { ascending: false });
    if (dbData) {
      setData(dbData);
      // Auto-sync to local Dexie for offline usage
      try {
        await db.masterData.clear();
        await db.masterData.bulkAdd(dbData);
      } catch (err) {
        console.error("Local sync error:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue || !formLabel) return;
    
    const { error } = await supabase.from("master_data").insert([{
      type: formType,
      value: formValue,
      label: formLabel,
      is_active: true
    }]);

    if (!error) {
      setFormValue("");
      setFormLabel("");
      fetchData();
      alert("Đã thêm thành công!");
    } else {
      console.error("Supabase Error:", error);
      alert("Lỗi khi thêm: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá danh mục này?")) return;
    const { error } = await supabase.from("master_data").delete().eq("id", id);
    if (!error) {
      fetchData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-stack-lg flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="w-12 h-12 bg-surface-container-high border-2 border-on-surface flex items-center justify-center active:bg-surface-container-highest transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline-md text-on-surface mb-1 uppercase tracking-tight">Quản Lý Danh Mục</h2>
          <p className="font-label-md text-on-surface-variant">Thêm sửa mã xe, máy xúc, vật liệu</p>
        </div>
      </header>

      <form onSubmit={handleAdd} className="p-4 bg-surface-container-lowest border-2 border-on-surface space-y-4">
        <h3 className="font-label-lg uppercase tracking-widest font-bold">THÊM MỚI</h3>
        <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full h-14 px-3 bg-white border-2 border-on-surface font-body-lg">
          <option value="vehicle">Xe Ben / Tải</option>
          <option value="machine">Máy Xúc / Thiết Bị</option>
          <option value="material">Loại Vật Liệu</option>
        </select>
        <input placeholder="Mã viết tắt (VD: MX-05)" value={formValue} onChange={(e) => setFormValue(e.target.value)} className="w-full h-14 px-3 bg-white border-2 border-on-surface font-body-lg" />
        <input placeholder="Tên hiển thị (VD: Máy Xúc 05 - CAT)" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} className="w-full h-14 px-3 bg-white border-2 border-on-surface font-body-lg" />
        <button type="submit" className="w-full h-14 bg-primary text-white font-bold border-2 border-on-surface uppercase shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none">Thêm Danh Mục</button>
      </form>

      {loading ? <p className="text-center font-bold">Đang tải...</p> : (
        <div className="space-y-3 pb-20">
          {data.map(item => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-surface-container-high border-2 border-on-surface">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 mr-2 inline-block mb-1">{item.type}</span>
                <span className="font-bold block text-lg">{item.label}</span>
                <div className="text-sm text-on-surface-variant mt-1">Mã: {item.value}</div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="w-12 h-12 bg-error text-white flex items-center justify-center border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
