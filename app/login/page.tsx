"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, Mail, X } from "lucide-react";
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

  // Forgot Password Modal States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      
      setForgotMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setForgotMessage({ type: 'error', text: err.message });
    } finally {
      setForgotLoading(false);
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
              <div className="flex justify-end mt-2">
                <button 
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  Quên mật khẩu?
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

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotMessage(null);
                setForgotEmail("");
              }}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Khôi phục mật khẩu</h3>
                <p className="text-sm text-zinc-400">Nhập email để nhận liên kết đặt lại</p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input 
                  type="email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/10 focus:border-blue-500/50 text-white rounded-xl py-3 px-4 outline-none transition-colors"
                  placeholder="Nhập email của bạn..."
                  required
                />
              </div>

              {forgotMessage && (
                <div className={`p-3 rounded-lg text-sm font-medium text-center ${forgotMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {forgotMessage.text}
                </div>
              )}

              <button 
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {forgotLoading ? 'Đang gửi...' : 'Gửi liên kết'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
