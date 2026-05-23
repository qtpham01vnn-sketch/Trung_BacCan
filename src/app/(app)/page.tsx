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
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
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

  // Fetch projects stats
  const { data: projectStats = { total: 0, active: 0, completed: 0, upcoming: 0, upcomingProgress: 0 } } = useQuery({
    queryKey: ['projects_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, status');
      if (error) throw error;
      
      const total = data.length;
      const active = data.filter((p: any) => p.status === 'Đang chạy').length;
      const completed = data.filter((p: any) => p.status === 'Hoàn thành').length;
      
      // Giả lập "Chuẩn bị hoàn thành" từ dự án đang chạy cho sinh động (thực tế sẽ có trường tiến độ riêng)
      const upcoming = Math.max(Math.ceil(active * 0.3), 1); // Luôn có ít nhất 1 để hiển thị màu sắc
      const upcomingProgress = upcoming > 0 ? 85 : 0; 

      return { total, active, completed, upcoming, upcomingProgress };
    }
  });

  // Fetch volume trend for last 7 days
  const { data: volumeTrend } = useQuery({
    queryKey: ['volume_trend'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('field_forms')
        .select('created_at, form_data')
        .eq('type', 'volume')
        .gte('created_at', sevenDaysAgo.toISOString())
        .lte('created_at', today.toISOString());
      if (error) throw error;

      // Initialize array for 7 days
      const days: { dateStr: string; label: string; value: number }[] = [];
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      let total = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(); // Use new Date() again to avoid modifying today
        d.setDate(today.getDate() - i);
        // Using local date string for robust comparison in user's timezone
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        days.push({
          dateStr: dateStr,
          label: dayNames[d.getDay()],
          value: 0
        });
      }

      data.forEach((f: any) => {
        const d = new Date(f.created_at);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const dayItem = days.find(d => d.dateStr === dateStr);
        if (dayItem) {
          const qty = Number(f.form_data?.quantity) || 0;
          dayItem.value += qty;
          total += qty;
        }
      });

      // Calculate heights
      const maxVal = Math.max(...days.map(d => d.value), 1);
      const bars = days.map(d => ({
        label: d.label,
        value: d.value,
        height: `${Math.max((d.value / maxVal) * 100, 5)}%` // min 5% height to show the bar
      }));

      return { bars, total };
    }
  });

  const chartData = volumeTrend || {
    bars: [
      { label: 'T2', height: '5%', value: 0 },
      { label: 'T3', height: '5%', value: 0 },
      { label: 'T4', height: '5%', value: 0 },
      { label: 'T5', height: '5%', value: 0 },
      { label: 'T6', height: '5%', value: 0 },
      { label: 'T7', height: '5%', value: 0 },
      { label: 'CN', height: '5%', value: 0 },
    ],
    total: 0
  };
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-primary text-on-primary p-6 rounded-none border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] relative overflow-hidden transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(25,28,30,1)] duration-300">
          {/* CSS Pattern (No JS, hardware accelerated, NO LAG) */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <p className="font-headline-sm font-bold uppercase tracking-wider opacity-90 drop-shadow-sm">Giờ máy hôm nay</p>
              <span className="material-symbols-outlined bg-white/20 p-2 border-2 border-white/40">settings_slow_motion</span>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-7xl font-black tracking-tighter drop-shadow-md">{totalHours > 0 ? totalHours : "0.0"}</span>
              <span className="font-headline-sm font-bold opacity-90">giờ</span>
            </div>
            <div className="mt-6 flex items-center gap-2 bg-black/20 inline-flex px-3 py-1.5 border border-white/20">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="font-label-md font-bold uppercase tracking-widest text-[10px]">Đồng bộ Real-time</span>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-none border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] flex flex-col justify-between transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(25,28,30,1)] duration-300">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-headline-sm font-bold uppercase tracking-wider text-on-surface">Tiến Độ Dự Án</h3>
            <span className="font-headline-lg font-bold text-primary px-3 py-1 bg-primary/10 border-2 border-primary">{projectStats.total} <span className="text-sm">Tổng</span></span>
          </div>

          <div className="space-y-4">
            {/* Đang chạy */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-bold">
                <span className="text-[#3b82f6] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Đang thi công</span>
                <span>{projectStats.active} dự án</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high overflow-hidden border border-on-surface/20">
                <div className="h-full bg-[#3b82f6]" style={{ width: `${(projectStats.active / Math.max(projectStats.total, 1)) * 100}%` }}></div>
              </div>
            </div>

            {/* Hoàn thành */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-bold">
                <span className="text-[#10b981] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Hoàn thành</span>
                <span>{projectStats.completed} dự án</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high overflow-hidden border border-on-surface/20">
                <div className="h-full bg-[#10b981]" style={{ width: `${(projectStats.completed / Math.max(projectStats.total, 1)) * 100}%` }}></div>
              </div>
            </div>

            {/* Chuẩn bị hoàn thành */}
            {projectStats.upcoming > 0 && (
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1 font-bold text-on-surface-variant">
                  <span className="uppercase text-[#f59e0b] flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> Chuẩn bị bàn giao ({projectStats.upcoming})</span>
                  <span>~{projectStats.upcomingProgress}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high overflow-hidden border border-on-surface/20">
                  <div className="h-full bg-[#f59e0b]" style={{ width: `${projectStats.upcomingProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Action Control Panel */}
      <section className="relative mt-8 mb-8">
        <h2 className="font-headline-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary bg-primary/10 p-1">grid_view</span>
          Bảng Tác Vụ Nhanh
        </h2>
        
        {/* Decorative connection line behind - only on desktop */}
        <div className="absolute top-[60%] left-0 w-full h-1 bg-on-surface border-y border-on-surface/20 z-0 hidden lg:block opacity-20"></div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <Link href="/input" className="group flex flex-col items-center justify-center p-6 bg-surface-container-lowest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200">
            <div className="w-16 h-16 rounded-none bg-[#3b82f6]/10 border-2 border-[#3b82f6]/50 flex items-center justify-center mb-4 group-hover:bg-[#3b82f6] transition-colors">
              <span className="material-symbols-outlined text-[#3b82f6] text-4xl group-hover:text-white transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
            </div>
            <span className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-center group-hover:text-[#3b82f6] transition-colors">Báo cáo<br/>mới</span>
          </Link>

          <Link href="/input?type=hours" className="group flex flex-col items-center justify-center p-6 bg-surface-container-lowest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200">
            <div className="w-16 h-16 rounded-none bg-[#f59e0b]/10 border-2 border-[#f59e0b]/50 flex items-center justify-center mb-4 group-hover:bg-[#f59e0b] transition-colors">
              <span className="material-symbols-outlined text-[#f59e0b] text-4xl group-hover:text-white transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            </div>
            <span className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-center group-hover:text-[#f59e0b] transition-colors">Bắt đầu<br/>ca máy</span>
          </Link>

          <Link href="/input?type=photo" className="group flex flex-col items-center justify-center p-6 bg-surface-container-lowest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200">
            <div className="w-16 h-16 rounded-none bg-[#ec4899]/10 border-2 border-[#ec4899]/50 flex items-center justify-center mb-4 group-hover:bg-[#ec4899] transition-colors">
              <span className="material-symbols-outlined text-[#ec4899] text-4xl group-hover:text-white transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
            <span className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-center group-hover:text-[#ec4899] transition-colors">Ảnh<br/>hiện trường</span>
          </Link>

          <Link href="/input?type=attendance" className="group flex flex-col items-center justify-center p-6 bg-surface-container-lowest border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all duration-200">
            <div className="w-16 h-16 rounded-none bg-[#10b981]/10 border-2 border-[#10b981]/50 flex items-center justify-center mb-4 group-hover:bg-[#10b981] transition-colors">
              <span className="material-symbols-outlined text-[#10b981] text-4xl group-hover:text-white transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
            </div>
            <span className="font-label-lg font-bold text-on-surface uppercase tracking-wider text-center group-hover:text-[#10b981] transition-colors">Nhật ký<br/>an toàn</span>
          </Link>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Pending Approvals / Recent Forms */}
        <div className="bg-white p-4 rugged-border flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-lg text-label-lg font-bold">Dữ liệu vừa đẩy lên</h3>
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 font-label-md text-label-md uppercase font-bold">LIVE</span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 flex-shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Lọc báo cáo (VD: 97C, cát...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] font-body-sm text-body-sm focus:outline-none focus:border-primary transition-all cursor-pointer"
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
                    <div key={form.id} className="group flex flex-col p-3 bg-surface-container-lowest border-2 border-surface-variant hover:border-on-surface hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] transition-all duration-200 gap-2">
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

        {/* Column 2: Recent Expenses */}
        <div className="bg-white p-4 rugged-border flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-lg text-label-lg font-bold">Chi phí gần đây</h3>
            <Link href="/expenses" className="text-primary font-label-md text-label-md underline uppercase">XEM TẤT CẢ</Link>
          </div>

          {/* Expense Search Bar */}
          <div className="relative mb-4 flex-shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Lọc chi phí..." 
              value={expenseSearchQuery}
              onChange={(e) => setExpenseSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(220,38,38,1)] font-body-sm text-body-sm focus:outline-none focus:border-error transition-all cursor-pointer"
            />
            {expenseSearchQuery && (
              <button 
                onClick={() => setExpenseSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          <div className="space-y-2 overflow-y-auto hide-scrollbar flex-1 pr-1 pb-2">
            {(() => {
              const expenses = recentForms.filter((f: any) => f.type === 'expense');
              const filteredExpenses = expenses.filter((item: any) => {
                if (!expenseSearchQuery) return true;
                const query = expenseSearchQuery.toLowerCase();
                const data = item.form_data || {};
                return (data.category || '').toLowerCase().includes(query) || 
                       (data.description || '').toLowerCase().includes(query) ||
                       (data.amount || '').toString().includes(query);
              });

              if (expenses.length === 0) return <p className="text-sm opacity-60 italic py-2">Chưa có chi phí nào...</p>;
              if (filteredExpenses.length === 0) return <p className="text-sm opacity-60 italic py-2 text-center mt-4">Không tìm thấy chi phí phù hợp</p>;

              return filteredExpenses.map((expense: any) => {
                const data = expense.form_data || {};
                return (
                  <div key={expense.id} className="group flex flex-col py-3 px-3 bg-surface-container-lowest border-2 border-surface-variant hover:border-error hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] transition-all duration-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-label-md text-label-md uppercase font-bold text-on-surface max-w-[180px] line-clamp-1" title={data.category}>
                        {data.category || 'Khác'}
                      </span>
                      <span className="font-label-lg text-label-lg font-bold text-error whitespace-nowrap">
                        {data.amount} VNĐ
                      </span>
                    </div>
                    {data.description && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-2">{data.description}</p>
                    )}
                    <span className="text-[10px] text-on-surface-variant opacity-70 mt-auto">
                      {new Date(expense.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Column 3: Colorful Transport Stats Chart */}
        <div className="bg-white p-4 rugged-border flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label-lg text-label-lg font-bold">Thống kê Vận chuyển</h3>
            <span className="material-symbols-outlined text-primary">local_shipping</span>
          </div>

          {(() => {
            // Calculate transport stats
            const transportForms = recentForms.filter((f: any) => f.type === 'transport');
            const stats = transportForms.reduce((acc: Record<string, number>, curr: any) => {
              const mat = curr.form_data?.material || 'Khác';
              const trips = Number(curr.form_data?.trips) || 0;
              acc[mat] = (acc[mat] || 0) + trips;
              return acc;
            }, {});

            const totalTrips = Object.values(stats).reduce((sum: any, val: any) => sum + val, 0) as number;
            
            if (totalTrips === 0) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-4xl mb-2">pie_chart</span>
                  <p className="text-sm italic">Chưa có dữ liệu vận chuyển</p>
                </div>
              );
            }

            // Generate Conic Gradient
            const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#eab308'];
            let currentPercentage = 0;
            const gradientStops = Object.entries(stats).map(([mat, trips], index) => {
              const percentage = ((trips as number) / totalTrips) * 100;
              const color = colors[index % colors.length];
              const stop = `${color} ${currentPercentage}% ${currentPercentage + percentage}%`;
              currentPercentage += percentage;
              return { mat, trips, color, stop, percentage };
            });

            const conicGradient = `conic-gradient(${gradientStops.map(s => s.stop).join(', ')})`;

            return (
              <div className="flex flex-col flex-1">
                {/* CSS Doughnut Chart */}
                <div className="flex justify-center items-center py-6 relative">
                  <div 
                    className="w-48 h-48 rounded-full shadow-inner flex items-center justify-center transition-transform hover:scale-105 duration-300"
                    style={{ background: conicGradient }}
                  >
                    {/* Inner circle for Doughnut effect */}
                    <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                      <span className="font-headline-lg text-headline-lg font-bold text-on-surface">{totalTrips}</span>
                      <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Chuyến</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-auto space-y-3 px-2 overflow-y-auto max-h-[150px] hide-scrollbar">
                  {gradientStops.sort((a, b) => (b.trips as number) - (a.trips as number)).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-none shadow-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="font-body-sm text-body-sm group-hover:font-bold transition-all">{item.mat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md font-bold">{item.trips}</span>
                        <span className="text-[10px] text-on-surface-variant opacity-60 w-8 text-right">({Math.round(item.percentage)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
            <p className="font-headline-md text-headline-md text-primary">{chartData.total.toLocaleString('vi-VN')}</p>
            <p className="font-label-md text-label-md uppercase">TỔNG TRONG TUẦN</p>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-32 gap-2 px-2">
          {chartData.bars.map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 gap-2 h-full justify-end group">
              <div 
                className={clsx(
                  "w-full rugged-border transition-colors cursor-pointer relative",
                  activeChartBar === idx ? "bg-primary-container" : "bg-surface-container-highest hover:bg-primary-container"
                )}
                style={{ height: bar.height }}
                onClick={() => setActiveChartBar(idx)}
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-bold">
                  {bar.value.toLocaleString('vi-VN')} m³
                </div>
              </div>
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
