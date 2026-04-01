"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Cookies from "js-cookie";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Nếu cookie còn tồn tại, tức là đang đăng nhập hợp lệ => Chuyển thẳng tới dashboard
    if (Cookies.get("userName")) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password
      });

      if (res?.error) {
        setErrorMsg(res.error);
        setIsLoading(false);
      } else {
        // Lấy session từ NextAuth/api thay vì response để có đủ data
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        // Lưu thông tin người dùng vô thời hạn (expires siêu lớn) vào Cokies
        if (sessionData?.user) {
          Cookies.set('userName', sessionData.user.name, { expires: 3650 }); // Lưu 10 năm
          Cookies.set('userEmail', sessionData.user.email, { expires: 3650 });
          Cookies.set('userId', sessionData.user.id || '', { expires: 3650 });
        }

        // Đăng nhập thành công
        router.push('/dashboard');
      }
    } catch (error) {
      setErrorMsg("Đã xảy ra lỗi, vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Nút trở về */}
      <Link href="/" className="absolute top-6 left-6 z-50 text-zinc-400 hover:text-white transition-colors flex items-center justify-center w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 rounded-full shadow-lg backdrop-blur-md">
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Vui lòng đăng nhập</h1>
          <p className="text-zinc-500 mt-2 text-sm">Hệ thống điều khiển trung tâm Smart Home</p>
        </div>

        <div className="bg-zinc-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                  placeholder="admin@smarthome.vn"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] mt-6 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
             Chưa có tài khoản? <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">Đăng ký ngay</Link>
          </div>
        </div>
        
        <p className="text-center text-xs text-zinc-600 mt-8">
            &copy; 2026 NCKH Smart Home Team
        </p>
      </div>
    </div>
  );
}
