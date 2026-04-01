"use client";
import Link from "next/link";
import { ArrowRight, Home, ShieldCheck, Zap, Mic } from "lucide-react";
import Cookies from "js-cookie";


import { useEffect, useState } from "react";

export default function LandingPage() {
  const [userName, setUserName] = useState<string | null>(null);

  // Responsive states for mobile/desktop layout adjustments  
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isCompactWidth, setIsCompactWidth] = useState(false);
  const [mobileShrink, setMobileShrink] = useState(false);

  useEffect(() => {
    function checkDevice() {
      const mobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      const viewportWidth = window.innerWidth;
      const enableMobileLayout = mobile && viewportWidth >= 768;
      setIsMobileDevice(mobile);
      setIsMobile(enableMobileLayout);
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(mobile ? portrait : false);
      setMobileShrink(false);
      setIsMobileLandscape(mobile && !portrait);
    }
    if (typeof window !== 'undefined') {
      checkDevice();
      window.addEventListener('resize', checkDevice);
      window.addEventListener('orientationchange', checkDevice);
      return () => {
        window.removeEventListener('resize', checkDevice);
        window.removeEventListener('orientationchange', checkDevice);
      };
    }
  }, []);

  const mobileShrink1 = isPortrait || isCompactWidth;


  useEffect(() => {
    // Kiểm tra xem đã đăng nhập chưa
    const savedUserName = Cookies.get("userName");
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Background gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-[40%] left-[20%] w-[20%] h-[20%] bg-purple-600/10 blur-[90px] rounded-full pointer-events-none" />

      {/* Header / Navbar */}
      <header className={`relative ${mobileShrink1 ? 'z-50 px-3 py-3' : 'z-50 px-6 py-6'} mx-auto flex items-center justify-between`}>
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
        <div className={`flex items-center ${mobileShrink1 ? 'gap-2' : 'gap-4'}`}>
          {userName ? (
            <Link 
              href="/dashboard" 
              className={`${mobileShrink1 ? 'text-[13px] px-3 py-1.5' : 'text-sm px-5 py-2.5'} font-medium bg-blue-600 hover:bg-blue-500 border border-transparent text-white rounded-full transition-all flex items-center gap-2`}
            >
              <span>Vào Dashboard</span>
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className={`${mobileShrink1 ? 'text-[13px]' : 'text-sm'} font-medium text-zinc-300 hover:text-white transition-colors`}
              >
                Đăng nhập
              </Link>
              <Link 
                href="/register" 
                className={`${mobileShrink1 ? 'text-[13px] px-3 py-1.5' : 'text-sm px-5 py-2.5'} font-medium bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-full transition-all`}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className={`relative z-10 max-w-7xl mx-auto ${mobileShrink1 ? 'px-4 pt-1 pb-4' : 'px-6 pt-2 pb-5'} flex flex-col items-center justify-center text-center`}>
        <div className={`inline-flex items-center gap-2 ${mobileShrink1 ? 'px-2 py-1 mb-4' : 'px-3 py-1.5 mb-3'} rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium p-1`}>
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          Thế hệ nhà thông minh mới
        </div>
        
        <h1 className={`${mobileShrink1 ? 'text-4xl px-1' : 'text-5xl md:text-7xl'} font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600 max-w-4xl leading-tight`}>
          Sáng tạo không gian sống, điều khiển bằng giọng nói.
        </h1>

        {/* Feature Highlights List */}
        <div className={`${mobileShrink1 ? 'mt-6 gap-3 flex flex-wrap justify-center px-4' : 'mt-10 gap-8 grid grid-cols-3'} w-full max-w-5xl`}>
          <div className={`${mobileShrink1 ? 'w-[calc(50%-0.375rem)] p-1 aspect-square justify-center' : 'p-6'} rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center text-center`}>
            <div className={`${mobileShrink1 ? 'w-10 h-10 mb-2' : 'w-12 h-12 mb-4'} rounded-2xl bg-blue-500/10 flex items-center justify-center`}>
              <Zap className={`${mobileShrink1 ? 'w-5 h-5' : 'w-6 h-6'} text-blue-400`} />
            </div>
            <div>
              <h3 className={`${mobileShrink1 ? 'text-[14px] leading-tight mb-1' : 'text-lg mb-2'} font-semibold text-zinc-200`}>Độ trễ thấp</h3>
              <p className={`${mobileShrink1 ? 'text-[11px] leading-snug px-1 line-clamp-3' : 'text-sm'} text-zinc-500 leading-relaxed`}>Kết nối trực tiếp thiết bị qua Socket.io siêu nhẹ, phản hồi lệnh ngay lập tức.</p>
            </div>
          </div>
          
          <div className={`${mobileShrink1 ? 'w-[calc(50%-0.375rem)] p-1 aspect-square justify-center' : 'p-6'} rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center text-center`}>
            <div className={`${mobileShrink1 ? 'w-10 h-10 mb-2' : 'w-12 h-12 mb-4'} rounded-2xl bg-purple-500/10 flex items-center justify-center`}>
              <Mic className={`${mobileShrink1 ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400`} />
            </div>
            <div>
              <h3 className={`${mobileShrink1 ? 'text-[14px] leading-tight mb-1' : 'text-lg mb-2'} font-semibold text-zinc-200`}>Giọng nói</h3>
              <p className={`${mobileShrink1 ? 'text-[11px] leading-snug px-1 line-clamp-3' : 'text-sm'} text-zinc-500 leading-relaxed`}>Tích hợp Web Speech API, hỗ trợ tiếng Việt mượt mà rảnh tay hoàn toàn.</p>
            </div>
          </div>

          <div className={`${mobileShrink1 ? 'w-[calc(50%-0.375rem)] p-1 aspect-square justify-center' : 'p-6'} rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center text-center`}>
            <div className={`${mobileShrink1 ? 'w-10 h-10 mb-2' : 'w-12 h-12 mb-4'} rounded-2xl bg-emerald-500/10 flex items-center justify-center`}>
              <ShieldCheck className={`${mobileShrink1 ? 'w-5 h-5' : 'w-6 h-6'} text-emerald-400`} />
            </div>
            <div>
              <h3 className={`${mobileShrink1 ? 'text-[14px] leading-tight mb-1' : 'text-lg mb-2'} font-semibold text-zinc-200`}>Bảo mật</h3>
              <p className={`${mobileShrink1 ? 'text-[11px] leading-snug px-1 line-clamp-3' : 'text-sm'} text-zinc-500 leading-relaxed`}>Cơ chế quản lý đăng nhập an toàn, phân quyền rõ ràng qua NextAuth.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/20 mt-5 mb-3">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4">
          <div className="text-zinc-500 text-sm">
            &copy; 2026 NCKH Smart Home Team.
          </div>
        </div>
      </footer>
    </div>
  );
}
