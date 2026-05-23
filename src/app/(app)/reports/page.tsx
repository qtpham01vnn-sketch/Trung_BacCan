"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
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

export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("week");
  const [projectIdFilter, setProjectIdFilter] = useState<string>("all");

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

    // Filter by project
    if (projectIdFilter !== "all") {
      result = result.filter(f => f.project_id === projectIdFilter);
    }

    // Filter by time
    const now = new Date();
    let startDate: Date;
    if (timeFilter === "today") {
      startDate = startOfDay(now);
    } else if (timeFilter === "week") {
      // Week starting from Monday
      startDate = startOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(now);
    }

    result = result.filter(f => isAfter(parseISO(f.created_at), startDate));

    return result;
  }, [forms, timeFilter, projectIdFilter]);

  const { totalTrips, totalHours, chartData } = useMemo(() => {
    let trips = 0;
    let hours = 0;
    const dailyData: Record<string, { date: string; trips: number; hours: number }> = {};

    filteredForms.forEach(form => {
      const dateKey = form.created_at.substring(0, 10);
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, trips: 0, hours: 0 };
      }

      if (form.type === "transport") {
        const num = Number(form.form_data?.trips) || 0;
        trips += num;
        dailyData[dateKey].trips += num;
      } else if (form.type === "machine_hours") {
        const num = Number(form.form_data?.hours) || 0;
        hours += num;
        dailyData[dateKey].hours += num;
      }
    });

    return {
      totalTrips: trips,
      totalHours: hours,
      chartData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
    };
  }, [filteredForms]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Báo Cáo Tổng Hợp</h2>
        <p className="font-body-md text-on-surface-variant">Phân tích số liệu hiện trường</p>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-label-sm uppercase tracking-widest text-on-surface-variant mb-1 block">Thời gian</label>
          <select 
            value={timeFilter} 
            onChange={e => setTimeFilter(e.target.value as any)}
            className="w-full h-12 px-3 border-2 border-on-surface bg-surface-container-lowest focus:outline-none"
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
            className="w-full h-12 px-3 border-2 border-on-surface bg-surface-container-lowest focus:outline-none"
          >
            <option value="all">Tất cả dự án</option>
            <option value="default-project">Dự án mặc định (Chưa gán)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center py-10 font-bold animate-pulse">Đang tải dữ liệu...</p>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary text-on-primary p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-80">local_shipping</span>
              <span className="font-headline-lg text-4xl font-black">{totalTrips}</span>
              <span className="font-label-md uppercase tracking-widest mt-1 opacity-90">Chuyến Xe</span>
            </div>
            <div className="bg-[#006a60] text-white p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-80">precision_manufacturing</span>
              <span className="font-headline-lg text-4xl font-black">{totalHours}</span>
              <span className="font-label-md uppercase tracking-widest mt-1 opacity-90">Giờ Máy</span>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-surface-container-lowest border-2 border-on-surface p-4 mt-8">
            <h3 className="font-headline-sm mb-4 uppercase tracking-tight text-primary">Biểu đồ Chuyến Xe (Cột)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.1)'}} contentStyle={{fontWeight: 'bold', border: '2px solid black'}} />
                  <Bar dataKey="trips" fill="#00639a" name="Số chuyến" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-container-lowest border-2 border-on-surface p-4 mt-4">
            <h3 className="font-headline-sm mb-4 uppercase tracking-tight text-[#006a60]">Biểu đồ Giờ Máy (Đường)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{fontWeight: 'bold', border: '2px solid black'}} />
                  <Line type="monotone" dataKey="hours" stroke="#006a60" strokeWidth={4} name="Số giờ" dot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Recent Logs List */}
          <div className="mt-8 mb-20">
            <h3 className="font-headline-sm mb-4 uppercase tracking-tight">Khai báo gần nhất</h3>
            <div className="space-y-3">
              {filteredForms.slice(-10).reverse().map(form => (
                <div key={form.id} className="p-3 bg-surface-container-high border-2 border-on-surface">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold uppercase text-sm">
                      {form.type === 'transport' ? '🚛 Chuyến Xe' : form.type === 'machine_hours' ? '🚜 Giờ Máy' : '📸 Hình Ảnh'}
                    </span>
                    <span className="text-xs text-on-surface-variant">{new Date(form.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="text-sm">
                    {form.type === 'transport' && <span className="text-primary font-bold">{form.form_data.trips} chuyến</span>}
                    {form.type === 'transport' && ` - Xe: ${form.form_data.vehicleId} (VL: ${form.form_data.material})`}
                    
                    {form.type === 'machine_hours' && <span className="text-[#006a60] font-bold">{form.form_data.hours} giờ</span>}
                    {form.type === 'machine_hours' && ` - Máy: ${form.form_data.machineId}`}
                    
                    {form.type === 'photo' && `Ảnh báo cáo: ${form.form_data.description || 'Không có ghi chú'}`}
                  </div>
                </div>
              ))}
              {filteredForms.length === 0 && <p className="text-on-surface-variant italic p-4 text-center border-2 border-dashed border-on-surface">Chưa có dữ liệu nào khớp với bộ lọc</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
