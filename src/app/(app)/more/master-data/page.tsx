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

  const [filterType, setFilterType] = useState<string>("all");

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("master_data").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) {
      fetchData();
    }
  };

  const filteredData = data.filter(item => filterType === "all" || item.type === filterType);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-stack-lg flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="w-12 h-12 bg-surface-container-high border-4 border-on-surface flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline-md text-on-surface mb-1 uppercase tracking-tight font-bold">Quản Lý Danh Mục</h2>
          <p className="font-label-md text-on-surface-variant">Thêm sửa mã xe, máy xúc, vật liệu</p>
        </div>
      </header>

      <form onSubmit={handleAdd} className="p-4 bg-surface-container-lowest border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(25,28,30,1)] transition-all duration-300 space-y-4">
        <h3 className="font-label-lg uppercase tracking-widest font-bold">THÊM MỚI</h3>
        <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full h-14 px-3 bg-white border-4 border-on-surface font-body-lg shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] transition-all appearance-none rounded-none cursor-pointer focus:outline-none focus:border-primary">
          <option value="vehicle">Xe Ben / Tải</option>
          <option value="machine">Máy Xúc / Thiết Bị</option>
          <option value="material">Loại Vật Liệu</option>
          <option value="expense_category">Hạng Mục Chi Phí</option>
          <option value="worker">Danh Sách Công Nhân</option>
        </select>
        <input placeholder="Mã viết tắt (VD: MX-05)" value={formValue} onChange={(e) => setFormValue(e.target.value)} className="w-full h-14 px-3 bg-white border-4 border-on-surface font-body-lg shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] transition-all focus:outline-none focus:border-primary" />
        <input placeholder="Tên hiển thị (VD: Máy Xúc 05 - CAT)" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} className="w-full h-14 px-3 bg-white border-4 border-on-surface font-body-lg shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] transition-all focus:outline-none focus:border-primary" />
        <button type="submit" className="w-full h-14 bg-primary text-white font-bold border-4 border-on-surface uppercase shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer">Thêm Danh Mục</button>
      </form>

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 pt-2">
        {[
          { id: "all", label: "Tất cả" },
          { id: "vehicle", label: "Xe cộ" },
          { id: "machine", label: "Máy móc" },
          { id: "material", label: "Vật liệu" },
          { id: "expense_category", label: "Chi phí" },
          { id: "worker", label: "Công nhân" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 font-bold whitespace-nowrap border-4 border-on-surface transition-all duration-200 uppercase text-sm ${
              filterType === tab.id 
              ? 'bg-primary text-white shadow-none translate-y-1 translate-x-1' 
              : 'bg-surface-container-lowest text-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center font-bold">Đang tải...</p> : (
        <div className="space-y-3 pb-20">
          {filteredData.length === 0 ? (
             <p className="text-center text-on-surface-variant font-bold italic py-8 border-4 border-dashed border-on-surface/30">Chưa có danh mục nào</p>
          ) : (
            filteredData.map(item => (
              <div key={item.id} className={`flex justify-between items-center p-4 bg-surface-container-lowest border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] transition-all duration-200 ${item.is_active === false ? 'opacity-60 bg-surface-variant' : ''}`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 mr-2 inline-block mb-1 border border-on-surface ${
                    item.type === 'vehicle' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' :
                    item.type === 'machine' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                    item.type === 'expense_category' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' :
                    item.type === 'worker' ? 'bg-[#06b6d4]/20 text-[#06b6d4]' :
                    'bg-[#10b981]/20 text-[#10b981]'
                  }`}>{item.type}</span>
                  {item.is_active === false && <span className="text-[10px] font-bold uppercase bg-error/20 text-error px-2 py-1 border border-error mb-1 inline-block">ĐÃ ẨN</span>}
                  
                  <span className={`font-bold block text-lg ${item.is_active === false ? 'line-through' : ''}`}>{item.label}</span>
                  <div className="text-sm text-on-surface-variant mt-1 font-mono">Mã: {item.value}</div>
                </div>
                
                <div className="flex gap-2 flex-col sm:flex-row">
                  <button 
                    onClick={() => handleToggleActive(item.id, item.is_active)} 
                    title={item.is_active ? "Ẩn khỏi danh sách nhập" : "Hiện lại trên danh sách nhập"}
                    className={`w-12 h-12 flex items-center justify-center border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer ${item.is_active ? 'bg-secondary text-on-secondary' : 'bg-primary text-white'}`}
                  >
                    <span className="material-symbols-outlined">{item.is_active ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    title="Xoá hoàn toàn"
                    className="w-12 h-12 bg-error text-white flex items-center justify-center border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
