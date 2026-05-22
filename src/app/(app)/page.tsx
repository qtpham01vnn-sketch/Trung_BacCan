"use client";

import { useState } from "react";
import { clsx } from "clsx";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const [activeChartBar, setActiveChartBar] = useState<number | null>(4); // default active T6
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch recent forms
  const { data: recentForms = [] } = useQuery({
    queryKey: ['recent_forms'],
    queryFn: async () => {
      // Fetch more so user can search and scroll
      const { data, error } = await supabase
        .from('field_forms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  // Fetch today's machine hours
  const { data: totalHours = 0 } = useQuery({
    queryKey: ['today_hours'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('field_forms')
        .select('form_data')
        .eq('type', 'hours')
        .gte('created_at', today.toISOString());
      if (error) throw error;
      return data.reduce((sum: number, f: any) => sum + (Number(f.form_data?.hours) || 0), 0);
    }
  });

  // Fetch active projects count
  const { data: activeProjectsCount = 0 } = useQuery({
    queryKey: ['active_projects_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Đang chạy');
      if (error) throw error;
      return count || 0;
    }
  });



  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert('Dữ liệu đã được đồng bộ thành công');
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Hero Section: Today Production & Active Projects */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary text-on-primary p-6 rounded-none rugged-border relative overflow-hidden">
          <div className="relative z-10">
            <p className="font-label-lg text-label-lg opacity-90">Giờ máy hôm nay</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-headline-lg text-headline-lg">{totalHours > 0 ? totalHours : "0.0"}</span>
              <span className="font-headline-sm text-headline-sm">giờ</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="font-label-md text-label-md">Dữ liệu lấy thực tế (Real-time)</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
          </div>
        </div>

        <div className="bg-surface-container-highest p-6 rounded-none rugged-border">
          <p className="font-label-lg text-label-lg text-on-surface-variant">Dự án đang chạy</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-headline-lg text-headline-lg text-on-surface">
              {activeProjectsCount < 10 ? `0${activeProjectsCount}` : activeProjectsCount}
            </span>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-on-secondary-fixed-variant flex items-center justify-center text-[10px] text-white">PJ</div>
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary flex items-center justify-center text-[10px] text-white">TB</div>
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-secondary flex items-center justify-center text-[10px] text-white">+6</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="bg-primary-container text-on-primary-container px-2 py-1 font-label-md text-label-md uppercase">ĐÚNG TIẾN ĐỘ</span>
            <span className="bg-error-container text-on-error-container px-2 py-1 font-label-md text-label-md uppercase">CẢNH BÁO</span>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <section>
        <h2 className="font-headline-sm text-headline-sm mb-4">Tác vụ nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/input" className="flex flex-col items-center justify-center p-4 bg-white rugged-border active:opacity-80 active:scale-95 transition-all gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">add_box</span>
            <span className="font-label-lg text-label-lg">Báo cáo mới</span>
          </Link>
          <Link href="/input?type=hours" className="flex flex-col items-center justify-center p-4 bg-white rugged-border active:opacity-80 active:scale-95 transition-all gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">play_circle</span>
            <span className="font-label-lg text-label-lg">Bắt đầu ca</span>
          </Link>
          <Link href="/input?type=photo" className="flex flex-col items-center justify-center p-4 bg-white rugged-border active:opacity-80 active:scale-95 transition-all gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
            <span className="font-label-lg text-label-lg">Ảnh hiện trường</span>
          </Link>
          <Link href="/input?type=attendance" className="flex flex-col items-center justify-center p-4 bg-white rugged-border active:opacity-80 active:scale-95 transition-all gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">engineering</span>
            <span className="font-label-lg text-label-lg">Nhật ký an toàn</span>
          </Link>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Approvals / Recent Forms */}
        <div className="bg-white p-4 rugged-border flex flex-col max-h-[600px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-lg text-label-lg font-bold">Dữ liệu vừa đẩy lên</h3>
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 font-label-md text-label-md uppercase font-bold">LIVE</span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 flex-shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Lọc báo cáo (VD: 97C, cát, tên người...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border border-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto hide-scrollbar flex-1 pr-1 pb-2">
            {recentForms.length === 0 ? (
              <p className="text-sm opacity-60 italic p-2">Chưa có dữ liệu nào...</p>
            ) : (
              (() => {
                // Apply search filter
                const filteredForms = recentForms.filter((item: any) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const dataStr = JSON.stringify(item.form_data).toLowerCase();
                  const titleStr = item.title.toLowerCase();
                  return titleStr.includes(query) || dataStr.includes(query);
                });

                if (filteredForms.length === 0) {
                  return <p className="text-sm opacity-60 italic p-2 text-center mt-4">Không tìm thấy báo cáo nào</p>;
                }

                return filteredForms.map((form: any) => {
                  // Render all details based on form type
                  const data = form.form_data || {};
                  
                  return (
                    <div key={form.id} className="flex flex-col p-3 bg-surface-container-lowest border-2 border-surface-variant hover:bg-surface-container-low transition-colors shadow-sm gap-2">
                      <div className="flex items-center gap-3 border-b border-surface-variant/50 pb-2">
                        <div className="h-8 w-8 bg-secondary-container flex items-center justify-center border border-on-surface flex-shrink-0">
                          <span className="material-symbols-outlined text-on-secondary-container text-sm">
                            {form.type === 'hours' ? 'settings_slow_motion' : 
                             form.type === 'attendance' ? 'groups' : 
                             form.type === 'transport' ? 'local_shipping' : 
                             form.type === 'volume' ? 'architecture' : 
                             form.type === 'expense' ? 'payments' : 
                             form.type === 'photo' ? 'photo_camera' : 'description'}
                          </span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md font-bold uppercase leading-tight text-primary">{form.title}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {new Date(form.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1 mt-1 font-body-sm text-on-surface">
                        {form.type === "hours" && (
                          <>
                            <p><span className="opacity-70">Mã máy:</span> <strong>{data.machineId}</strong></p>
                            <p><span className="opacity-70">Số giờ:</span> <strong>{data.hours} giờ</strong></p>
                            {data.notes && <p><span className="opacity-70">Ghi chú:</span> {data.notes}</p>}
                          </>
                        )}
                        {form.type === "attendance" && (
                          <>
                            <p><span className="opacity-70">Số công nhân:</span> <strong>{data.workerCount} người</strong></p>
                            {data.notes && <p><span className="opacity-70">Ghi chú:</span> {data.notes}</p>}
                          </>
                        )}
                        {form.type === "transport" && (
                          <>
                            <p><span className="opacity-70">Biển số xe:</span> <strong>{data.vehicleId}</strong></p>
                            <p><span className="opacity-70">Số chuyến:</span> <strong>{data.trips}</strong></p>
                            <p><span className="opacity-70">Vật liệu:</span> <strong>{data.material}</strong></p>
                            {data.notes && <p><span className="opacity-70">Ghi chú:</span> {data.notes}</p>}
                          </>
                        )}
                        {form.type === "volume" && (
                          <>
                            <p><span className="opacity-70">Sản lượng:</span> <strong>{data.quantity} {data.unit}</strong></p>
                            <p><span className="opacity-70">Vị trí:</span> <strong>{data.location}</strong></p>
                            {data.notes && <p><span className="opacity-70">Ghi chú:</span> {data.notes}</p>}
                          </>
                        )}
                        {form.type === "expense" && (
                          <>
                            <p><span className="opacity-70">Số tiền chi:</span> <strong className="text-error">{data.amount} VNĐ</strong></p>
                            <p><span className="opacity-70">Hạng mục:</span> <strong>{data.category}</strong></p>
                            <p><span className="opacity-70">Mô tả:</span> {data.description}</p>
                            {data.notes && <p><span className="opacity-70">Ghi chú:</span> {data.notes}</p>}
                          </>
                        )}
                        {form.type === "photo" && (
                          <>
                            <p><span className="opacity-70">Ghi chú ảnh:</span> <strong>{data.notes || "Không có"}</strong></p>
                            {data.photoUrl && (
                              <div className="w-20 h-20 border-2 border-on-surface overflow-hidden mt-2 relative group flex-shrink-0">
                                <img src={data.photoUrl} alt="Thumb" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setZoomedImage(data.photoUrl)}
                                  title="Xem ảnh lớn" 
                                  className="absolute inset-0 w-full h-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-zoom-in"
                                >
                                  <span className="material-symbols-outlined text-white">zoom_in</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-4 rugged-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-lg text-label-lg font-bold">Chi phí gần đây</h3>
            <button className="text-primary font-label-md text-label-md underline uppercase">XEM TẤT CẢ</button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-surface-variant">
              <span className="font-body-md text-body-md">Đổ dầu Diesel (500L)</span>
              <span className="font-label-lg text-label-lg font-bold">12.4M VND</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-surface-variant">
              <span className="font-body-md text-body-md">Sửa ống thủy lực</span>
              <span className="font-label-lg text-label-lg font-bold">1.2M VND</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-body-md text-body-md">Dụng cụ bảo trì</span>
              <span className="font-label-lg text-label-lg font-bold">0.8M VND</span>
            </div>
          </div>
        </div>
      </section>

      {/* Volume Trend Chart */}
      <section className="bg-white p-6 rugged-border">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-headline-sm text-headline-sm">Xu hướng sản lượng</h3>
            <p className="font-label-md text-label-md text-on-surface-variant">Sản lượng 7 ngày qua (m³)</p>
          </div>
          <div className="text-right">
            <p className="font-headline-md text-headline-md text-primary">8.4k</p>
            <p className="font-label-md text-label-md uppercase">TỔNG TRONG TUẦN</p>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-32 gap-2 px-2">
          {[
            { label: 'T2', height: '40%' },
            { label: 'T3', height: '60%' },
            { label: 'T4', height: '85%' },
            { label: 'T5', height: '70%' },
            { label: 'T6', height: '95%' },
            { label: 'T7', height: '30%' },
            { label: 'CN', height: '20%' },
          ].map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
              <div 
                className={clsx(
                  "w-full rugged-border transition-colors cursor-pointer",
                  activeChartBar === idx ? "bg-primary-container" : "bg-surface-container-highest hover:bg-primary-container"
                )}
                style={{ height: bar.height }}
                onClick={() => setActiveChartBar(idx)}
              ></div>
              <span className="text-[10px] font-bold">{bar.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Fullscreen Image Modal (Lightbox) */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setZoomedImage(null)}>
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            onClick={() => setZoomedImage(null)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed Field Photo" 
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 border-4 border-white/10" 
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking the image itself
          />
        </div>
      )}
    </div>
  );
}
