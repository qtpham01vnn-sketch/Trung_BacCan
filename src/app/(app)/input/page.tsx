"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { db, FieldForm } from "@/lib/db";
import { useAuthStore } from "@/stores/authStore";

import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

type FormType = "attendance" | "hours" | "transport" | "volume" | "expense" | null;

export default function InputHubPage() {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [photos, setPhotos] = useState<{ id: string; preview: string; note: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const role = useAuthStore((state) => state.role);

  const supabase = createClient();
  const { data: projects = [] } = useQuery({
    queryKey: ['projects_list_input'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name');
      return (data || []) as { id: string; name: string }[];
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      if (type && ["attendance", "hours", "transport", "volume", "expense", "photo"].includes(type)) {
        if (type === "photo") {
          // If type is photo, just scroll to photo section since it doesn't have an active form state
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 300);
        } else {
          setActiveForm(type as FormType);
        }
      }
    }
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load pending sync count reactively
  const pendingCount = useLiveQuery(
    () => db.fieldForms.where("status").equals("pending_sync").count(),
    [],
    0 // default value
  );

  // Load Master Data offline
  const masterDataList = useLiveQuery(() => db.masterData.toArray(), []) || [];
  const machines = masterDataList.filter((m) => m.type === "machine");
  const vehicles = masterDataList.filter((m) => m.type === "vehicle");
  const materials = masterDataList.filter((m) => m.type === "material");

  const triggerVibration = () => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("div");
    ripple.classList.add("absolute", "bg-white", "opacity-20", "rounded-full", "animate-ping");
    ripple.style.width = "100px";
    ripple.style.height = "100px";
    
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 50;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleOpenForm = (e: React.MouseEvent<HTMLButtonElement>, type: FormType) => {
    createRipple(e);
    triggerVibration();
    setTimeout(() => {
      setActiveForm(type);
    }, 200);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Compress image before saving
          const img = new window.Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1000; // max width for field photos
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Export as JPEG with 0.7 quality to significantly reduce base64 size
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            
            setPhotos(prev => [...prev, {
              id: uuidv4(),
              preview: compressedBase64,
              note: ""
            }]);
          };
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUpdatePhotoNote = (id: string, note: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, note } : p));
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePhotos = async () => {
    if (photos.length === 0) return;
    
    for (const photo of photos) {
      const newForm: FieldForm = {
        id: uuidv4(),
        workspace_id: "default-workspace",
        project_id: "default-project",
        type: "photo", // Use photo as type
        title: `Ảnh hiện trường - ${new Date().toLocaleDateString('vi-VN')}`,
        form_data: {
          photoUrl: photo.preview, 
          notes: photo.note
        },
        status: "pending_sync",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await db.fieldForms.add(newForm);
    }
    
    triggerVibration();
    alert(`Đã lưu offline ${photos.length} ảnh! Chờ đồng bộ.`);
    setPhotos([]);
  };

  const onSubmit = async (data: any) => {
    if (!activeForm) return;
    
    const typeNames = {
      "attendance": "Điểm danh",
      "hours": "Giờ máy",
      "transport": "Chuyến xe",
      "volume": "Sản lượng",
      "expense": "Chi phí"
    };
    const titleName = typeNames[activeForm as keyof typeof typeNames] || activeForm;
    
    const newForm: FieldForm = {
      id: uuidv4(),
      workspace_id: "default-workspace", // Hardcode tạm
      project_id: "default-project",
      type: activeForm,
      title: `${titleName} - ${new Date().toLocaleDateString('vi-VN')}`,
      form_data: data,
      status: "pending_sync",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await db.fieldForms.add(newForm);
      triggerVibration();
      alert("Đã lưu Offline! Chờ đồng bộ khi có mạng.");
      reset();
      setActiveForm(null);
    } catch (error) {
      console.error("Lỗi lưu offline:", error);
      alert("Lỗi khi lưu offline");
    }
  };

  if (activeForm) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <header className="mb-stack-lg flex items-center gap-4">
          <button 
            onClick={() => { setActiveForm(null); reset(); }}
            className="w-12 h-12 bg-surface-container-high border-2 border-on-surface flex items-center justify-center active:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-1 uppercase tracking-tight">
              {activeForm === "hours" ? "Ghi giờ máy" : 
               activeForm === "attendance" ? "Điểm danh" : "Nhập liệu"}
            </h2>
            <p className="font-label-md text-on-surface-variant uppercase tracking-widest">
              LƯU OFFLINE TRỰC TIẾP
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Default Project ID field (Temporary until full offline project sync) */}
          <div className="space-y-2">
            <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
              THUỘC DỰ ÁN / TRẠM
            </label>
            <select
              {...register("project_id", { required: true })}
              defaultValue="default-project"
              className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
            >
              <option value="default-project">Dự án mặc định (Tạm thời)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {activeForm === "hours" && (
            <>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  MÃ MÁY XÚC / THIẾT BỊ
                </label>
                <select
                  {...register("machineId", { required: true })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
                >
                  <option value="">-- Chọn Máy Xúc / Thiết Bị --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {errors.machineId && <span className="text-error text-sm">Bắt buộc nhập mã máy</span>}
              </div>

              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  SỐ GIỜ HOẠT ĐỘNG
                </label>
                <input
                  type="number"
                  step="0.5"
                  {...register("hours", { required: true, min: 0.5 })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  placeholder="0.0"
                />
                {errors.hours && <span className="text-error text-sm">Số giờ không hợp lệ</span>}
              </div>
            </>
          )}

          {activeForm === "attendance" && (
            <>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  SỐ LƯỢNG CÔNG NHÂN TỔ
                </label>
                <input
                  type="number"
                  {...register("workerCount", { required: true, min: 1 })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  GHI CHÚ / THIẾU VẮNG
                </label>
                <textarea
                  {...register("notes")}
                  className="w-full p-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  rows={4}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </>
          )}

          {activeForm === "transport" && (
            <>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  MÃ XE (XE BEN / TẢI)
                </label>
                <select
                  {...register("vehicleId", { required: true })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
                >
                  <option value="">-- Chọn Mã Xe --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.value}>{v.label}</option>
                  ))}
                </select>
                {errors.vehicleId && <span className="text-error text-sm">Bắt buộc nhập mã xe</span>}
              </div>

              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  SỐ CHUYẾN
                </label>
                <input
                  type="number"
                  {...register("trips", { required: true, min: 1 })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  LOẠI VẬT LIỆU
                </label>
                <select
                  {...register("material", { required: true })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
                >
                  <option value="">-- Chọn vật liệu --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.value}>{m.label}</option>
                  ))}
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  GHI CHÚ THÊM
                </label>
                <textarea
                  {...register("notes")}
                  className="w-full p-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  rows={2}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </>
          )}

          {activeForm === "volume" && (
            <>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  KHỐI LƯỢNG / SẢN LƯỢNG
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    {...register("quantity", { required: true, min: 0.1 })}
                    className="flex-1 h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                    placeholder="0.0"
                  />
                  <select
                    {...register("unit", { required: true })}
                    className="w-24 h-14 px-2 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none text-center"
                  >
                    <option value="m3">m³</option>
                    <option value="tấn">Tấn</option>
                    <option value="md">md</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  VỊ TRÍ THI CÔNG
                </label>
                <input
                  {...register("location", { required: true })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  placeholder="Ví dụ: Phân khu A, Kè Bắc..."
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  GHI CHÚ THÊM
                </label>
                <textarea
                  {...register("notes")}
                  className="w-full p-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  rows={2}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </>
          )}

          {activeForm === "expense" && (
            <>
              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  SỐ TIỀN CHI (VNĐ)
                </label>
                <input
                  type="text"
                  {...register("amount", { required: true })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  placeholder="Ví dụ: 500000"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  HẠNG MỤC
                </label>
                <select
                  {...register("category", { required: true })}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
                >
                  <option value="">-- Chọn hạng mục --</option>
                  <option value="Xăng dầu">Đổ xăng / dầu</option>
                  <option value="Sửa chữa">Sửa chữa / Bảo dưỡng</option>
                  <option value="Vật tư">Mua vật tư phụ</option>
                  <option value="Ăn uống">Ăn uống / Tiếp khách</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-label-lg text-label-lg text-on-surface-variant block uppercase tracking-widest">
                  MÔ TẢ CHI TIẾT
                </label>
                <textarea
                  {...register("description", { required: true })}
                  className="w-full p-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
                  rows={3}
                  placeholder="Chi tiết khoản chi..."
                />
              </div>
            </>
          )}

          <div className="pt-8">
            <button 
              type="submit"
              className="w-full h-[56px] bg-primary text-white font-bold text-label-lg border-2 border-on-surface flex items-center justify-center gap-2 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all shadow-[8px_8px_0px_0px_rgba(25,28,30,1)]"
            >
              LƯU OFFLINE
              <span className="material-symbols-outlined">save</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Trung tâm nhập liệu</h2>
        <p className="font-body-md text-on-surface-variant">
          Ghi nhận dữ liệu vận hành từ hiện trường.
        </p>
      </header>

      {/* Compact Grid for Entry Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Attendance */}
        <button 
          className="flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden focus:outline-none bg-primary-fixed border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
          onClick={(e) => handleOpenForm(e, "attendance")}
        >
          <span className="material-symbols-outlined text-primary text-2xl mb-1 filled-icon">groups</span>
          <span className="font-label-md text-label-md text-on-surface font-bold uppercase">Điểm danh</span>
        </button>

        {/* Machine Hours */}
        <button 
          className="flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden focus:outline-none bg-secondary-container border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
          onClick={(e) => handleOpenForm(e, "hours")}
        >
          <span className="material-symbols-outlined text-secondary text-2xl mb-1 filled-icon">settings_slow_motion</span>
          <span className="font-label-md text-label-md text-on-surface font-bold uppercase">Giờ máy</span>
        </button>

        {/* Vehicle Trips */}
        <button 
          className="flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden focus:outline-none bg-surface-container-highest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
          onClick={(e) => handleOpenForm(e, "transport")}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-1 group-hover:text-on-secondary-fixed">local_shipping</span>
          <span className="font-label-md text-label-md text-on-surface font-bold uppercase">Chuyến xe</span>
        </button>

        {/* Work Volume */}
        <button 
          className="flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden focus:outline-none bg-surface-container-highest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
          onClick={(e) => handleOpenForm(e, "volume")}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-1 group-hover:text-on-secondary-fixed">architecture</span>
          <span className="font-label-md text-label-md text-on-surface font-bold uppercase">Sản lượng</span>
        </button>

        {/* Expense Entry */}
        <button 
          className="flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden focus:outline-none bg-surface-container-highest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200"
          onClick={(e) => handleOpenForm(e, "expense")}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-1 group-hover:text-on-secondary-fixed">payments</span>
          <span className="font-label-md text-label-md text-on-surface font-bold uppercase">Chi phí</span>
        </button>
      </div>

      {/* Sync Indicator */}
      <div className={`mt-stack-lg p-4 rounded-xl border-2 border-on-surface flex items-center gap-3 transition-colors ${pendingCount > 0 ? 'bg-tertiary-fixed' : 'bg-primary-fixed'}`}>
        <span className={`material-symbols-outlined ${pendingCount > 0 ? 'text-on-tertiary-fixed animate-spin' : 'text-primary'}`} style={{ fontVariationSettings: "'wght' 700" }}>
          {pendingCount > 0 ? 'sync' : 'check_circle'}
        </span>
        <span className={`font-label-lg text-label-lg ${pendingCount > 0 ? 'text-on-tertiary-fixed' : 'text-primary'}`}>
          {pendingCount > 0 ? `${pendingCount} mục chờ đồng bộ` : 'Đã đồng bộ toàn bộ dữ liệu'}
        </span>
        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pendingCount > 0 ? 'bg-on-tertiary-fixed text-tertiary-fixed' : 'bg-primary text-white'}`}>
          {pendingCount > 0 ? 'ĐANG CHỜ' : 'HOÀN TẤT'}
        </div>
      </div>

      {/* Field Photos Gallery */}
      <div className="mt-stack-lg p-6 bg-surface-container-lowest rugged-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-headline-sm text-headline-sm uppercase tracking-tight">ẢNH CÔNG TRƯỜNG</h3>
            <p className="font-label-md text-label-md text-on-surface-variant">Thêm ảnh thực tế và ghi chú vị trí</p>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePhotoSelect}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-on-primary px-4 py-2 font-label-lg font-bold flex items-center gap-2 rugged-border hover:bg-primary/90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_a_photo</span>
            THÊM ẢNH
          </button>
        </div>

        {photos.length > 0 ? (
          <div className="space-y-4">
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {photos.map(photo => (
                <div key={photo.id} className="min-w-[280px] w-[280px] snap-center flex flex-col gap-2 bg-surface-container-high p-3 rugged-border relative">
                  <button 
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-error text-white flex items-center justify-center rounded-full shadow-lg z-10 hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <div className="w-full h-40 relative rugged-border overflow-hidden bg-black/5 flex items-center justify-center">
                    <img src={photo.preview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ghi chú vị trí / tình trạng..."
                    value={photo.note}
                    onChange={(e) => handleUpdatePhotoNote(photo.id, e.target.value)}
                    className="w-full h-10 px-3 bg-white border-2 border-on-surface font-body-md text-body-md focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={handleSavePhotos}
              className="w-full h-14 bg-secondary text-on-secondary font-bold text-label-lg border-2 border-on-surface flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
            >
              LƯU {photos.length} ẢNH OFFLINE
              <span className="material-symbols-outlined">cloud_upload</span>
            </button>
          </div>
        ) : (
          <div className="h-40 border-4 border-dashed border-on-surface-variant/30 flex flex-col items-center justify-center text-on-surface-variant/50 bg-black/5">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">image_search</span>
            <span className="font-label-lg font-bold uppercase tracking-widest opacity-50">CHƯA CÓ ẢNH NÀO</span>
          </div>
        )}
      </div>
    </>
  );
}
