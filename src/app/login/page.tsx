"use client";

import { useState } from "react";
import { clsx } from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const [tab, setTab] = useState<"field" | "office">("field");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Phân quyền theo Email: Chứa 'admin' thì là Sếp (admin), còn lại là Công nhân (field_worker)
      const userRole = email.toLowerCase().includes("admin") ? "admin" : "field_worker";
      setAuth(data.session, userRole);

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {/* Brand Header */}
      <header className="w-full pt-12 pb-8 flex flex-col items-center justify-center px-gutter">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            construction
          </span>
          <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-primary uppercase">
            Trung Bắc Cạn
          </h1>
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase opacity-70">
          Hạ tầng & San lấp
        </p>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md bg-surface-container-lowest border-4 border-on-surface p-8 shadow-[12px_12px_0px_0px_rgba(25,28,30,1)]">
          {/* Login Type Selector */}
          <div className="flex border-b-2 border-surface-container-high mb-8">
            <button
              type="button"
              className={clsx(
                "flex-1 py-4 font-label-lg text-label-lg transition-all duration-200",
                tab === "field"
                  ? "border-b-4 border-primary text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
              style={tab === "field" ? { borderBottom: "4px solid var(--color-primary)" } : {}}
              onClick={() => {
                setTab("field");
                setError(null);
              }}
            >
              CÔNG NHÂN
            </button>
            <button
              type="button"
              className={clsx(
                "flex-1 py-4 font-label-lg text-label-lg transition-all duration-200",
                tab === "office"
                  ? "border-b-4 border-primary text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
              style={tab === "office" ? { borderBottom: "4px solid var(--color-primary)" } : {}}
              onClick={() => {
                setTab("office");
                setError(null);
              }}
            >
              VĂN PHÒNG
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-label-md">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant block">
                {tab === "field" ? "EMAIL CÔNG NHÂN (TEST)" : "ĐỊA CHỈ EMAIL"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">
                  {tab === "field" ? "smartphone" : "mail"}
                </span>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] font-body-lg text-body-lg focus:outline-none focus:ring-0 focus:border-primary focus:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] transition-all cursor-pointer"
                  placeholder={tab === "field" ? "congnhan@test.com" : "name@trungbaccan.vn"}
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-lg text-label-lg text-on-surface-variant block">
                {tab === "field" ? "MẬT KHẨU (THAY OTP)" : "MẬT KHẨU"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">
                  {tab === "field" ? "pin" : "lock"}
                </span>
                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] font-body-lg text-body-lg focus:outline-none focus:ring-0 focus:border-primary focus:shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] transition-all cursor-pointer"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-primary text-white font-bold text-label-lg border-4 border-on-surface flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(25,28,30,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
            </div>

            {tab === "office" && (
              <p className="text-center font-label-md text-label-md text-primary font-bold cursor-pointer hover:underline">
                Quên mật khẩu?
              </p>
            )}
          </form>
        </div>
      </main>

      {/* Visual Anchor / Hero Image (Industrial Vibe) */}
      <section className="hidden lg:block fixed right-0 top-0 h-full w-1/3 z-[-1]">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjT-7DywBItj8bcnyez3F9KtwpvcBo9F8MjNQS4dQ5UG-j3fi_y7-UzSTs2sGYik8kDOxktprLtUAj1jBve-1Oh-eaGl0XjmT2CiiE46xmltRpjzsRFg5BeuqxpuMJYyQQDb-8u-ejRV2BCvWifiB_JxAtebhVfAp9ZOpAGIYXxZHryK2Egeu7JU5enGDW8QXZ_1CpPTrQP8n3gtkNqaADJTwAnva-TAIrUQ9ewNki7Z_r-E13TRtT9R-bPe9nKZN2fTxNiLMwhWo"
          alt="Site Overview"
          fill
          className="object-cover opacity-20 grayscale contrast-125"
          unoptimized
        />
      </section>

      {/* Footer - Offline Indicator */}
      <footer className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-center bg-surface-container-low border-t-2 border-on-surface">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse border border-on-surface"></span>
          <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-tight">
            HỆ THỐNG SẴN SÀNG
          </span>
        </div>
        <div className="flex items-center gap-2 group cursor-help">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            cloud_off
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase">
            CHẾ ĐỘ NGOẠI TUYẾN
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">info</span>
        </div>
      </footer>
    </div>
  );
}
