"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export default function ExpensesPage() {
  const supabase = createClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_forms')
        .select('*')
        .eq('type', 'expense')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Tất cả chi phí</h2>
        <p className="font-body-md text-on-surface-variant">
          Lịch sử các khoản chi phí đã ghi nhận từ hiện trường.
        </p>
      </header>

      <div className="bg-white p-4 rugged-border min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-center p-8 text-on-surface-variant italic">Chưa có dữ liệu chi phí nào.</p>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense: any) => {
              const data = expense.form_data || {};
              return (
                <div key={expense.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-2 border-surface-variant hover:border-primary transition-colors gap-2">
                  <div>
                    <h3 className="font-label-lg font-bold text-on-surface">{data.category || 'Chi phí khác'}</h3>
                    <p className="font-body-md text-on-surface-variant">{data.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-on-surface-variant mt-1 opacity-70">
                      {new Date(expense.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="font-headline-sm text-error font-bold">{data.amount} VNĐ</span>
                    {expense.approval_status && (
                      <p className="text-xs font-bold uppercase mt-1">
                        {expense.approval_status === 'approved' ? (
                          <span className="text-[#10b981]">Đã duyệt</span>
                        ) : expense.approval_status === 'rejected' ? (
                          <span className="text-error">Từ chối</span>
                        ) : (
                          <span className="text-[#f59e0b]">Chờ duyệt</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
