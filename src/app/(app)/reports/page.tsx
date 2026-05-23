"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, parseISO, isAfter } from "date-fns";

type FieldForm = {
  id: string;
  project_id: string;
  type: string;
  form_data: any;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
};

const COLORS = ['#00639a', '#006a60', '#ba1a1a', '#6750a4', '#b3261e', '#f9a825'];

export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("week");
  const [projectIdFilter, setProjectIdFilter] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<any>(null);

  const supabase = createClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects_list'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name');
      return (data || []) as Project[];
    }
  });

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['field_forms_reports'],
    queryFn: async () => {
      // Only get synced data from server
      const { data } = await supabase
        .from('field_forms')
        .select('*')
        .order('created_at', { ascending: true });
      return (data || []) as FieldForm[];
    }
  });

  const filteredForms = useMemo(() => {
    let result = forms;

    if (projectIdFilter !== "all") {
      result = result.filter(f => f.project_id === projectIdFilter);
    }

    const now = new Date();
    let startDate: Date;
    if (timeFilter === "today") {
      startDate = startOfDay(now);
    } else if (timeFilter === "week") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(now);
    }

    result = result.filter(f => isAfter(parseISO(f.created_at), startDate));

    return result;
  }, [forms, timeFilter, projectIdFilter]);

  const { 
    totalTrips, totalHours, totalWorkers, totalExpense, 
    chartData, expenseData 
  } = useMemo(() => {
    let trips = 0;
    let hours = 0;
    let workers = 0;
    let expenses = 0;
    
    const dailyData: Record<string, { date: string; trips: number; hours: number }> = {};
    const categoryExpenses: Record<string, number> = {};

    filteredForms.forEach(form => {
      const dateKey = form.created_at.substring(0, 10);
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, trips: 0, hours: 0 };
      }

      if (form.type === "transport") {
        const num = Number(form.form_data?.trips) || 0;
        trips += num;
        dailyData[dateKey].trips += num;
      } else if (form.type === "hours") {
        const num = Number(form.form_data?.hours) || 0;
        hours += num;
        dailyData[dateKey].hours += num;
      } else if (form.type === "attendance") {
        const num = Number(form.form_data?.workerCount) || 0;
        workers += num;
      } else if (form.type === "expense") {
        const amountStr = String(form.form_data?.amount || "0").replace(/[^0-9]/g, "");
        const amount = Number(amountStr) || 0;
        expenses += amount;
        
        const cat = form.form_data?.category || "Khác";
        if (!categoryExpenses[cat]) categoryExpenses[cat] = 0;
        categoryExpenses[cat] += amount;
      }
    });

    const expData = Object.entries(categoryExpenses).map(([name, value]) => ({ name, value }));

    return {
      totalTrips: trips,
      totalHours: hours,
      totalWorkers: workers,
      totalExpense: expenses,
      chartData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      expenseData: expData
    };
  }, [filteredForms]);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1 uppercase tracking-tight">Báo Cáo Tổng Hợp</h2>
        <p className="font-body-md text-on-surface-variant">Phân tích số liệu hiện trường</p>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-label-sm uppercase tracking-widest text-on-surface-variant mb-1 block">Thời gian</label>
          <select 
            value={timeFilter} 
            onChange={e => setTimeFilter(e.target.value as any)}
            className="w-full h-12 px-3 border-4 border-on-surface bg-surface-container-lowest focus:outline-none shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] transition-all cursor-pointer appearance-none rounded-none font-bold"
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
        <div>
          <label className="font-label-sm uppercase tracking-widest text-on-surface-variant mb-1 block">Dự án / Trạm</label>
          <select 
            value={projectIdFilter} 
            onChange={e => setProjectIdFilter(e.target.value)}
            className="w-full h-12 px-3 border-4 border-on-surface bg-surface-container-lowest focus:outline-none shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] transition-all cursor-pointer appearance-none rounded-none font-bold"
          >
            <option value="all">Tất cả dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <span className="material-symbols-outlined text-4xl animate-spin mb-4">sync</span>
          <p className="font-bold uppercase tracking-widest">Đang phân tích dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-4 bg-tertiary text-on-tertiary p-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] transition-all flex flex-col justify-center">
              <span className="font-label-md uppercase tracking-widest opacity-90 font-bold mb-1">TỔNG CHI PHÍ</span>
              <span className="font-headline-lg text-4xl md:text-5xl font-black drop-shadow-md">{formatVND(totalExpense)}</span>
            </div>

            <div className="bg-primary text-on-primary p-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] transition-all flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-80">local_shipping</span>
              <span className="font-headline-lg text-4xl font-black drop-shadow-md">{totalTrips}</span>
              <span className="font-label-sm uppercase tracking-widest mt-1 opacity-90 font-bold">Chuyến Xe</span>
            </div>

            <div className="bg-[#006a60] text-white p-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] transition-all flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-80">precision_manufacturing</span>
              <span className="font-headline-lg text-4xl font-black drop-shadow-md">{totalHours}</span>
              <span className="font-label-sm uppercase tracking-widest mt-1 opacity-90 font-bold">Giờ Máy</span>
            </div>

            <div className="col-span-2 bg-secondary text-on-secondary p-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] transition-all flex items-center justify-between">
              <div>
                <span className="font-label-md uppercase tracking-widest opacity-90 font-bold block mb-1">NHÂN CÔNG ĐIỂM DANH</span>
                <span className="font-headline-lg text-4xl font-black drop-shadow-md">{totalWorkers}</span>
              </div>
              <span className="material-symbols-outlined text-5xl opacity-50">groups</span>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6 mt-8">
            {expenseData.length > 0 && (
              <div className="bg-surface-container-lowest border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] p-4 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(25,28,30,1)] transition-all">
                <h3 className="font-headline-sm mb-4 uppercase tracking-tight text-tertiary">Chi Phí Theo Hạng Mục</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatVND(Number(value))} contentStyle={{fontWeight: 'bold', border: '4px solid black', borderRadius: 0}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {expenseData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-sm font-bold">
                      <div className="w-3 h-3" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] p-4 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(25,28,30,1)] transition-all">
              <h3 className="font-headline-sm mb-4 uppercase tracking-tight text-primary">Biểu đồ Chuyến Xe & Giờ Máy</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <YAxis yAxisId="left" tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.1)'}} contentStyle={{fontWeight: 'bold', border: '4px solid black', borderRadius: 0}} />
                    <Bar yAxisId="left" dataKey="trips" fill="#006a60" name="Chuyến xe" barSize={30} />
                    <Bar yAxisId="right" dataKey="hours" fill="#191c1e" name="Giờ máy" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Recent Logs List */}
          <div className="mt-8 mb-20">
            <h3 className="font-headline-sm mb-4 uppercase tracking-tight">Khai báo gần nhất</h3>
            <div className="space-y-4">
              {filteredForms.slice(-15).reverse().map(form => (
                <div 
                  key={form.id} 
                  onClick={() => setSelectedForm(form)}
                  className="p-4 bg-surface-container-high border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                      {form.type === 'transport' && <><span className="material-symbols-outlined text-primary">local_shipping</span>Chuyến Xe</>}
                      {form.type === 'hours' && <><span className="material-symbols-outlined text-[#006a60]">precision_manufacturing</span>Giờ Máy</>}
                      {form.type === 'attendance' && <><span className="material-symbols-outlined text-secondary">groups</span>Điểm Danh</>}
                      {form.type === 'expense' && <><span className="material-symbols-outlined text-error">payments</span>Chi Phí</>}
                      {form.type === 'volume' && <><span className="material-symbols-outlined text-tertiary">architecture</span>Sản Lượng</>}
                      {form.type === 'photo' && <><span className="material-symbols-outlined text-on-surface-variant">photo_camera</span>Hình Ảnh</>}
                    </span>
                    <span className="text-xs font-bold text-on-surface-variant">{new Date(form.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                  
                  <div className="text-body-md font-medium">
                    {form.type === 'transport' && (
                      <div className="flex justify-between items-end">
                        <span>Xe: <strong>{form.form_data.vehicleId}</strong> (VL: {form.form_data.material})</span>
                        <span className="text-xl font-black text-primary">{form.form_data.trips} chuyến</span>
                      </div>
                    )}
                    
                    {form.type === 'hours' && (
                      <div className="flex justify-between items-end">
                        <span>Máy: <strong>{form.form_data.machineId}</strong></span>
                        <span className="text-xl font-black text-[#006a60]">{form.form_data.hours} giờ</span>
                      </div>
                    )}

                    {form.type === 'attendance' && (
                      <div className="flex justify-between items-end">
                        <span>Ghi chú: {form.form_data.notes || 'Không có'}</span>
                        <span className="text-xl font-black text-secondary">{form.form_data.workerCount} người</span>
                      </div>
                    )}

                    {form.type === 'volume' && (
                      <div className="flex justify-between items-end">
                        <span>Vị trí: <strong>{form.form_data.location}</strong></span>
                        <span className="text-xl font-black text-tertiary">{form.form_data.quantity} {form.form_data.unit}</span>
                      </div>
                    )}

                    {form.type === 'expense' && (
                      <div className="flex flex-col">
                        <span>Hạng mục: <strong>{form.form_data.category}</strong></span>
                        <span className="text-sm opacity-80 mt-1">{form.form_data.description}</span>
                        <span className="text-2xl font-black text-error mt-2">{formatVND(Number(String(form.form_data.amount || "0").replace(/[^0-9]/g, "")))}</span>
                      </div>
                    )}
                    
                    {form.type === 'photo' && (
                      <div className="flex gap-4 items-start">
                        {form.form_data.photoUrl && (
                          <div className="w-24 h-24 border-2 border-on-surface relative overflow-hidden bg-black flex-shrink-0">
                            <img src={form.form_data.photoUrl} alt="Field Photo" className="object-cover w-full h-full" />
                          </div>
                        )}
                        <span className="italic mt-1">"{form.form_data.notes || 'Không có ghi chú'}"</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredForms.length === 0 && (
                <div className="p-8 border-4 border-dashed border-on-surface-variant flex flex-col items-center justify-center opacity-60">
                  <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
                  <p className="font-bold uppercase tracking-widest">Chưa có dữ liệu nào</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Chi tiết */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedForm(null)}>
          <div className="bg-surface w-full max-w-lg border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b-4 border-on-surface bg-surface-container-high flex justify-between items-center">
              <h3 className="font-title-lg font-black uppercase">Chi tiết báo cáo</h3>
              <button onClick={() => setSelectedForm(null)} className="material-symbols-outlined hover:text-error">close</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 pb-6 border-b-2 border-dashed border-outline-variant">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-label-lg px-2 py-1 bg-primary text-on-primary font-bold uppercase">{selectedForm.type}</span>
                </div>
                <div className="text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {new Date(selectedForm.created_at).toLocaleString('vi-VN')}
                  <span className="mx-1">•</span>
                  <span className="material-symbols-outlined text-sm">construction</span>
                  <span>{projects.find((p: any) => p.id === selectedForm.project_id)?.name || selectedForm.project_id}</span>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(selectedForm.form_data).map(([key, value]) => {
                  if (key === 'photoUrl') return (
                    <div key={key} className="mt-4">
                      <p className="font-bold mb-2">Ảnh đính kèm:</p>
                      <img src={value as string} alt="Đính kèm" className="w-full border-4 border-on-surface object-cover max-h-[400px]" />
                    </div>
                  );
                  return (
                    <div key={key} className="flex justify-between items-center border-b border-outline-variant pb-2">
                      <span className="text-on-surface-variant font-medium capitalize">{key}</span>
                      <span className="font-black text-lg text-right break-words">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t-4 border-on-surface bg-surface-container flex justify-end">
              <button 
                onClick={() => setSelectedForm(null)}
                className="px-6 py-3 font-label-lg font-bold uppercase border-4 border-on-surface hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] transition-all bg-white"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
