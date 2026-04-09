"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage({ type: 'error', text: "Lỗi đường dẫn. Vui lòng bấm vào link gốc từ email của bạn." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Mật khẩu xác nhận không khớp!" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: "Mật khẩu quá yếu! Hãy điền ít nhất 6 ký tự." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Có lỗi khi đặt lại mật khẩu.');

      setMessage({ type: 'success', text: data.message });

      // Nếu thành công thì cho chuyển hướng sau 3 giây để người dùng đọc thông báo
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu không có token hiển thị lỗi ngay lập tức
  if (!token) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4 animate-in zoom-in" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Không tìm thấy mã Token</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Đường dẫn của bạn bị thiếu hoặc đã bị chỉnh sửa. Bạn cần dùng toàn bộ đường dẫn từ Email hệ thống gửi.
        </p>
        <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity">
          <ChevronLeft className="w-4 h-4" /> Về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <p>{message.text}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Mật khẩu mới</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={message?.type === 'success'}
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 text-zinc-900 dark:text-white rounded-2xl py-3.5 pl-11 pr-4 outline-none transition-colors"
            placeholder="Nhập mật khẩu mới..."
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Xác nhận mật khẩu</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={message?.type === 'success'}
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 text-zinc-900 dark:text-white rounded-2xl py-3.5 pl-11 pr-4 outline-none transition-colors"
            placeholder="Nhập lại để xác nhận..."
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || message?.type === 'success'}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-2xl py-4 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
      >
        {isLoading ? 'Đang cập nhật mật khẩu...' : 'Khôi phục mật khẩu'}
        {!isLoading && <ArrowRight className="w-5 h-5" />}
      </button>

      {message?.type !== 'success' && (
         <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-zinc-500 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
              Chợt nhớ ra mật khẩu?
            </Link>
         </div>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  useEffect(() => {
    // Basic Theme check - to keep light/dark consistency
    const savedTheme = Cookies.get('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#070709] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 relative">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl dark:shadow-2xl p-6 sm:p-10">
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 transform transition-transform duration-300">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Tạo Mật khẩu mới</h1>
          </div>

          <Suspense fallback={<div className="text-center py-10 animate-pulse text-zinc-500">Đang quét liên kết từ hệ thống...</div>}>
            <ResetPasswordForm />
          </Suspense>

        </div>
      </div>
    </div>
  );
}
