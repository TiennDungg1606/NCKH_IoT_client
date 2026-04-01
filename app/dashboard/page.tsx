"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";
import DeviceCard from "@/components/DeviceCard";
import VoiceControl from "@/components/VoiceControl";
import { Lightbulb, UserRound, Settings, LogOut } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
// Assuming you have NextAuth session, we'd normally get devices from DB
// For this demo, we'll manage local state mapped to DB devices eventually

export default function Dashboard() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [feedbackText, setFeedbackText] = useState("🎙️ Nhấn micro và nói lệnh (bật/tắt đèn...)");
// Responsive states for mobile/desktop layout adjustments  
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isCompactWidth, setIsCompactWidth] = useState(false);
  const [mobileShrink, setMobileShrink] = useState(false);

  // User state từ Cookie
  const [userName, setUserName] = useState("Người dùng");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Dummy device states matching HTML
  const [devices, setDevices] = useState({
    light: false,
    door: false,
    auxLight: false,
    fan: false
  });

  useEffect(() => {
    // Lấy thông tin user từ cookie khi load trang
    const savedUserName = Cookies.get("userName");
    if (savedUserName) {
      setUserName(savedUserName);
    } else {
      // Nếu không có cookie userName (chưa đăng nhập hoặc đăng xuất), đẩy về trang đăng nhập ngay lập tức
      router.replace('/login');
      return;
    }

    // Connect to Node.js backend
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    const newSocket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000, // wait 2s before retry
      reconnectionDelayMax: 5000 
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendDeviceCommand = useCallback((deviceId: string, action: string) => {
    if (socket) {
      // Payload matching the requirements
      socket.emit('send_command', { device_id: deviceId, action });
    }
  }, [socket]);

  const toggleDevice = useCallback((id: string, currentState: boolean) => {
    const REAL_MAC_ADDRESS = "D4:E9:F4:E9:53:DC"; // Thay địa chỉ MAC thực tế của ESP32 vào đây
    
    if (id === 'light') {
      const newState = !currentState;
      setDevices(prev => ({ ...prev, light: newState }));
      sendDeviceCommand(REAL_MAC_ADDRESS, newState ? 'L1_ON' : 'L1_OFF');
    } else if (id === 'door') {
      const newState = !currentState;
      setDevices(prev => ({ ...prev, door: newState }));
      sendDeviceCommand(REAL_MAC_ADDRESS, newState ? 'M1_ON' : 'M1_OFF');
    } else if (id === 'auxLight') {
      const newState = !currentState;
      setDevices(prev => ({ ...prev, auxLight: newState }));
      sendDeviceCommand(REAL_MAC_ADDRESS, newState ? 'L2_ON' : 'L2_OFF');
    } else if (id === 'fan') {
      const newState = !currentState;
      setDevices(prev => ({ ...prev, fan: newState }));
      sendDeviceCommand(REAL_MAC_ADDRESS, newState ? 'M2_ON' : 'M2_OFF');
    }
  }, [sendDeviceCommand, socket]);

  const handleVoiceCommand = (transcript: string) => {
    const cmd = transcript.toLowerCase().trim();
    let response = "";

    if (cmd.includes("bật tất cả") || cmd.includes("mở tất cả")) {
      if (!devices.light) toggleDevice('light', false);
      if (!devices.auxLight) toggleDevice('auxLight', false);
      if (!devices.fan) toggleDevice('fan', false);
      if (!devices.door) toggleDevice('door', false);
      response = "Đã bật tất cả thiết bị";
    } else if (cmd.includes("tắt tất cả")) {
      if (devices.light) toggleDevice('light', true);
      if (devices.auxLight) toggleDevice('auxLight', true);
      if (devices.fan) toggleDevice('fan', true);
      if (devices.door) toggleDevice('door', true); // Maybe close door too when turning off all
      response = "Đã tắt tất cả thiết bị";
    } else if (cmd.includes("bật đèn trong nhà") || cmd.includes("mở đèn trong nhà")) {
      if (!devices.auxLight) toggleDevice('auxLight', false);
      else response = "Đèn trong nhà đã bật sẵn rồi";
    } else if (cmd.includes("tắt đèn trong nhà")) {
      if (devices.auxLight) toggleDevice('auxLight', true);
      else response = "Đèn trong nhà đã tắt";
    } else if (cmd.includes("bật đèn ngoài sân") || cmd.includes("mở đèn ngoài sân") || cmd.includes("bật đèn ngoài sân")) {
      if (!devices.light) toggleDevice('light', false);
      else response = "Đèn ngoài sân đã bật sẵn rồi";
    } else if (cmd.includes("tắt đèn ngoài sân")) {
      if (devices.light) toggleDevice('light', true);
      else response = "Đèn ngoài sân đã tắt";
    } else if (cmd.includes("mở cửa") || cmd.includes("bật cửa")) {
      if (!devices.door) toggleDevice('door', false);
      else response = "Cửa đã mở sẵn";
    } else if (cmd.includes("đóng cửa") || cmd.includes("tắt cửa")) {
      if (devices.door) toggleDevice('door', true);
      else response = "Cửa đã đóng";
    } else if (cmd.includes("bật quạt") || cmd.includes("mở quạt")) {
      if (!devices.fan) toggleDevice('fan', false);
      else response = "Quạt đã bật sẵn";
    } else if (cmd.includes("tắt quạt")) {
      if (devices.fan) toggleDevice('fan', true);
      else response = "Quạt đã tắt";
    } else {
      response = "Lệnh không hợp lệ. Hãy thử: bật đèn, tắt đèn, mở cửa, bật quạt...";
    }

    if (response) {
      setFeedbackText(`🤖 ${response}`);
    } else {
      setFeedbackText(`✅ Đã thực thi: "${transcript}"`);
    }

    setTimeout(() => {
      setFeedbackText("🎙️ Nhấn micro và nói lệnh (bật/tắt đèn...)");
    }, 7000);
  };

  const handleLogout = () => {
    // Xóa tất cả dấu vết của user khỏi cookie
    Cookies.remove("userId");
    Cookies.remove("userName");
    Cookies.remove("userEmail");
    
    // Đẩy văng về trang chủ
    router.push("/");
  };

  return (
    <div className={`min-h-screen bg-[#070709] text-zinc-100 flex flex-col ${mobileShrink1 ? 'p-3' : 'p-4 md:p-8'} font-sans pb-24 relative overflow-hidden`}>
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className={`w-full max-w-5xl mx-auto relative z-10 ${mobileShrink1 ? 'space-y-4' : 'space-y-8'}`}>
        {/* Header section */}
        <div className={`flex justify-between items-center ${mobileShrink1 ? 'sm:mt-2' : 'sm:mt-4'}`}>
            <div>
              <h1 className={`${mobileShrink1 ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>Ngôi Nhà</h1>
              <p className={`text-zinc-400 ${mobileShrink1 ? 'text-xs mt-0.5' : 'text-sm mt-1'}`}>Xin chào, {userName}</p>
            </div>
            
            <div className={`flex items-center relative ${mobileShrink1 ? 'gap-2' : 'gap-4'}`}>
              <div className={`flex items-center bg-zinc-800/40 rounded-full border border-white/5 backdrop-blur-md ${mobileShrink1 ? 'gap-2 pl-2 pr-3 py-1.5 text-xs' : 'gap-3 pl-3 pr-4 py-2 text-sm'}`}>
                  <div className={`rounded-full ${mobileShrink1 ? 'w-2 h-2' : 'w-2.5 h-2.5'} ${isConnected ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-red-500 shadow-[0_0_10px_#ef4444]"}`}></div>
                  <span className="font-medium">{isConnected ? "Connected" : "Offline"}</span>
              </div>
              
              {/* User Avatar Menu */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  className={`rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center hover:border-blue-500/50 transition-colors focus:outline-none ${mobileShrink1 ? 'w-8 h-8' : 'w-10 h-10'}`}
                >
                  <UserRound className={`${mobileShrink1 ? 'w-4 h-4' : 'w-5 h-5'} text-zinc-300`} />
                </button>
                
                {/* Fallback Menu Dropdown */}
                {isAvatarMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => setIsAvatarMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <UserRound className="w-4 h-4" />
                      Hồ sơ của tôi
                    </button>
                    <button 
                      onClick={() => setIsAvatarMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Cài đặt
                    </button>
                    <div className="w-full h-px bg-white/5 my-1"></div>
                    <button 
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors group"
                    >
                      <LogOut className="w-4 h-4 group-hover:pl-0.5 transition-all" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Main Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 ${mobileShrink1 ? 'gap-4' : 'gap-6'}`}>
          
          {/* Main Controls - Left Column (8 cols) */}
          <div className={`lg:col-span-8 ${mobileShrink1 ? 'space-y-4' : 'space-y-6'}`}>
             <div>
                <div className={`flex items-center justify-between ${mobileShrink1 ? 'mb-2' : 'mb-4'}`}>
                   <h2 className={`${mobileShrink1 ? 'text-lg' : 'text-xl'} font-semibold text-zinc-100`}>Thiết bị</h2>
                </div>
                <div className={`grid grid-cols-2 md:grid-cols-3 ${mobileShrink1 ? 'gap-2.5' : 'gap-4'}`}>
                   <DeviceCard id="light" name="Đèn ngoài sân" state={devices.light} type="light" onToggle={toggleDevice} mobileShrink1={mobileShrink1} />
                   <DeviceCard id="door" name="Cửa" state={devices.door} type="door" onToggle={toggleDevice} mobileShrink1={mobileShrink1} />
                   <DeviceCard id="auxLight" name="Đèn trong nhà" state={devices.auxLight} type="light" onToggle={toggleDevice} mobileShrink1={mobileShrink1} />
                   <DeviceCard id="fan" name="Quạt" state={devices.fan} type="fan" onToggle={toggleDevice} mobileShrink1={mobileShrink1} />
                </div>
             </div>

          </div>

          {/* Sidebar - Right Column (4 cols) */}
          <div className={`lg:col-span-4 space-y-6`}>
             <div>
               <VoiceControl onCommand={handleVoiceCommand} statusText={feedbackText} mobileShrink1={mobileShrink1} />
             </div>

             {/* AI Tips */}
             <div className={`bg-zinc-800/40 backdrop-blur-xl border border-white/5 rounded-3xl ${mobileShrink1 ? 'p-4' : 'p-6'}`}>
                 <div className={`flex items-center gap-2 ${mobileShrink1 ? 'mb-2' : 'mb-3'}`}>
                     <Lightbulb className={`${mobileShrink1 ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-400`} />
                     <span className={`${mobileShrink1 ? 'text-xs' : 'text-sm'} font-semibold text-zinc-100`}>Gợi ý lệnh</span>
                 </div>
                 <div className={`${mobileShrink1 ? 'text-xs' : 'text-sm'} leading-relaxed text-zinc-400`}>
                     "sử dụng lệnh bật/tắt/mở/đóng [thiết bị]"
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
