import Link from "next/link";
import { ArrowRight, Home, ShieldCheck, Zap, Mic } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-[40%] left-[20%] w-[20%] h-[20%] bg-purple-600/10 blur-[90px] rounded-full pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative z-50 px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800/80 rounded-xl flex items-center justify-center border border-white/5 shadow-lg">
            <Home className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">
            NCKH
            <span className="text-blue-500 font-black">.</span>
            Smart
          </span>
        </div>

        {/* Auth Buttons Top Right */}
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Đăng nhập
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 text-white px-5 py-2.5 rounded-full transition-all"
          >
            Đăng ký
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-5 pb-10 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 p-1">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Thế hệ nhà thông minh mới
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600 max-w-4xl leading-tight">
          Sáng tạo không gian sống, điều khiển bằng giọng nói.
        </h1>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 text-zinc-300 px-8 py-4 rounded-full font-medium transition-all"
          >
            <span>Xem Dashboard Demo</span>
          </Link>
        </div>

        {/* Feature Highlights List */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Độ trễ mili-giây</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Kết nối trực tiếp thiết bị qua Socket.io siêu nhẹ, phản hồi lệnh ngay lập tức.</p>
          </div>
          
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Điều khiển Giọng nói</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Tích hợp Web Speech API, hỗ trợ tiếng Việt mượt mà rảnh tay hoàn toàn.</p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Bảo mật vượt trội</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Cơ chế quản lý đăng nhập an toàn, phân quyền rõ ràng qua NextAuth.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/20 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center justify-between gap-4">
          <div className="text-zinc-500 text-sm">
            &copy; 2026 Nghiên cứu Khoa học Smart Home Team. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
