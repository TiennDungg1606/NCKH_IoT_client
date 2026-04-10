"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";
import jsQR from "jsqr";
import DeviceCard from "@/components/DeviceCard";
import VoiceControl from "@/components/VoiceControl";
import { Lightbulb, UserRound, Settings, LogOut, Sun, Moon, Plus, QrCode, X, Cpu, CheckCircle2, AlarmClock } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
// Assuming you have NextAuth session, we'd normally get devices from DB
// For this demo, we'll manage local state mapped to DB devices eventually

export default function Dashboard() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [deviceStatuses, setDeviceStatuses] = useState<{ [key: string]: boolean }>({});
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

  // Dark/Light mode state
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check saved theme from Cookie
    if (typeof window !== 'undefined') {
      const savedTheme = Cookies.get('theme');
      if (savedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
        // Optional: you can manually force styles if Tailwind 'darkMode: class' is not set
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      Cookies.set('theme', 'dark', { expires: 365 }); // Lưu vào cookie 1 năm
    } else {
      document.documentElement.classList.remove('dark');
      Cookies.set('theme', 'light', { expires: 365 }); // Lưu vào cookie 1 năm
    }
  };

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

  // --- MỞ RỘNG (SCALABILITY) ---
  const [customDevices, setCustomDevices] = useState<any[]>([]);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newPortNames, setNewPortNames] = useState<{[key: number]: string}>({});
  const [newDeviceMac, setNewDeviceMac] = useState("");
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // States cho Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalView, setScheduleModalView] = useState<'list' | 'add' | 'custom'>('list');
  const [newSchedule, setNewSchedule] = useState<{ subId: number; timeOn: string; timeOff: string; repeat: string; customDays: number[] }>({
    subId: 0, timeOn: '', timeOff: '', repeat: 'Một lần', customDays: []
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [editingPortNames, setEditingPortNames] = useState<{ [key: string]: string }>({});
  const [isSavingDevice, setIsSavingDevice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // States cho tiến trình mới
  const [verifyingStep, setVerifyingStep] = useState<'enter_mac' | 'enter_name'>('enter_mac');
  const [deviceVerificationInfo, setDeviceVerificationInfo] = useState<any>(null);
  
  const qrFileRef = useRef<HTMLInputElement>(null);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Scale down image to avoid massive processing time while keeping readability
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          } else {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            setNewDeviceMac(code.data.trim());
          } else {
            alert("Không tìm thấy mã QR trong ảnh này. Dữ liệu mờ hoặc không hợp lệ.");
          }
        }
        
        // Reset file input
        if (qrFileRef.current) qrFileRef.current.value = "";
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchRegisteredDevices = async () => {
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCustomDevices(data.map(d => ({ ...d, states: {}, state: false })));
          }
        }
      } catch (err) {
        console.error("Lỗi tải thiết bị:", err);
      }
    };
    
    // Fetch thiết bị đã lưu từ DB khi load Dashboard
    if (Cookies.get("userName")) {
      fetchRegisteredDevices();
    }
  }, []);

  const resetModal = () => {
    setIsAddDeviceModalOpen(false);
    setNewDeviceMac('');
    setNewDeviceName('');
    setNewPortNames({});
    setVerifyingStep('enter_mac');
    setDeviceVerificationInfo(null);
    setIsAddingDevice(false);
  };
  // -----------------------------

  const handleVerifyMac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceMac) return;

    setIsAddingDevice(true);
    setFeedbackText('Đang kết nối Server để xác thực thiết bị...');

    try {
      if (!socket) throw new Error('Cần kết nối Server trước.');

      const deviceInfo: any = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.off('device_info_result');
          reject(new Error('Mất kết nối tới thiết bị (Timeout). Thiết bị có đang bật mạng không?'));
        }, 15000);

        socket.on('device_info_result', (data: any) => {
          if (data.device_id === newDeviceMac) {
            clearTimeout(timeout);
            socket.off('device_info_result');
            data.error ? reject(new Error(data.error)) : resolve(data);
          }
        });
        socket.emit('get_device_info', { device_id: newDeviceMac });
      });

      // Nếu thành công, lưu thông tin lại và chuyển qua bước đặt tên
      setDeviceVerificationInfo(deviceInfo);
      setVerifyingStep('enter_name');
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsAddingDevice(false);
      setFeedbackText('🎙️ Nhấn micro và nói lệnh (bật/tắt đèn...)');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !selectedDevice.deviceId) return;
    if (!newSchedule.timeOn && !newSchedule.timeOff) {
      showToast("Cần chọn ít nhất thời gian bật hoặc tắt!");
      return;
    }

    setIsSavingSchedule(true);
    try {
      const scheduleId = Date.now().toString();
      const currentSchedules = selectedDevice.schedules || [];
      const updatedSchedules = [...currentSchedules, { ...newSchedule, id: scheduleId, active: true }];

      const response = await fetch('/api/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.deviceId,
          schedules: updatedSchedules
        })
      });
      
      if (response.ok) {
        const updatedDevice = await response.json();
        setCustomDevices(prev => prev.map(d => 
          d.deviceId === updatedDevice.deviceId ? { ...d, schedules: updatedDevice.schedules } : d
        ));
        setSelectedDevice(updatedDevice);
        setScheduleModalView('list');
        showToast("Thêm lịch hẹn thành công!");
      } else {
        const { error } = await response.json();
        showToast("Lỗi: " + (error || "Unknown error"));
      }
    } catch (err: any) {
      showToast("Lỗi khi thêm lịch: " + err.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!selectedDevice || !selectedDevice.deviceId) return;
    try {
      const updatedSchedules = selectedDevice.schedules.filter((s:any) => s.id !== scheduleId);
      
      const response = await fetch('/api/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.deviceId,
          schedules: updatedSchedules
        })
      });
      
      if (response.ok) {
        const updatedDevice = await response.json();
        setCustomDevices(prev => prev.map(d => 
          d.deviceId === updatedDevice.deviceId ? { ...d, schedules: updatedDevice.schedules } : d
        ));
        setSelectedDevice(updatedDevice);
        showToast("Đã xóa lịch hẹn!");
      } else {
        showToast("Lỗi khi xóa lịch!");
      }
    } catch (err: any) {
      showToast("Lỗi: " + err.message);
    }
  };

  const handleSaveDeviceSettings = async () => {
    if (!selectedDevice || !selectedDevice.deviceId) return;
    setIsSavingDevice(true);
    try {
      const response = await fetch('/api/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.deviceId,
          portNames: editingPortNames
        })
      });
      
      if (response.ok) {
        const updatedDevice = await response.json();
        setCustomDevices(prev => prev.map(d => 
          d.deviceId === updatedDevice.deviceId ? { ...d, portNames: updatedDevice.portNames } : d
        ));
        setSelectedDevice(null);
        setIsSettingsModalOpen(false);
        showToast("Lưu thay đổi thành công!");
      } else {
        const { error } = await response.json();
        showToast("Lỗi khi lưu cài đặt: " + (error || "Unknown error"));
      }
    } catch (err: any) {
      showToast("Lỗi khi lưu cài đặt: " + err.message);
    } finally {
      setIsSavingDevice(false);
    }
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newDeviceMac || !deviceVerificationInfo) return;

    setIsAddingDevice(true);
    
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mac: newDeviceMac,
          name: newDeviceName,
          isMultiDevice: deviceVerificationInfo.isMultiDevice,
          subIds: deviceVerificationInfo.subIds,
          portNames: newPortNames,
          userId: Cookies.get("userId")
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Có lỗi khi kết nối Server lưu thiết bị');

      setCustomDevices(prev => [...prev, {
         _id: data._id || `custom_${Date.now()}`,
         name: newDeviceName,
         deviceId: newDeviceMac,
         isMultiDevice: deviceVerificationInfo.isMultiDevice,
         subIds: deviceVerificationInfo.subIds,
         portNames: newPortNames,
         type: 'light',
         states: {},
         state: false
      }]);
      
      resetModal();
      alert(`Đã thêm thành công!\nCác cổng điều khiển nhận được: ${deviceVerificationInfo.subIds.join(', ')}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsAddingDevice(false);
    }
  };

  const REAL_MAC_ADDRESS = "D4:E9:F4:E9:53:DC"; // Thay địa chỉ MAC thực tế của ESP32 vào đây

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

    // Khi Web Client kết nối tới Web Server Backend, gửi yêu cầu lấy trạng thái của ESP32 ngay lập tức
    newSocket.on("connect", () => {
      // check_device_status will be emitted per device in another effect
    });

    // Lắng nghe thông báo cập nhật kết nối từ ESP32 thông qua Server Backend
    newSocket.on("device_status", (payload) => {
      if (payload && payload.device_id) {
        setDeviceStatuses((prev) => ({
          ...prev,
          [payload.device_id]: payload.status === "online"
        }));
      }
    });

    // Nếu Web Client mất mạng tới Backend Server, coi như mất kết nối tới tất cả
    newSocket.on("disconnect", () => {
      setDeviceStatuses({});
    });

    return () => {
      newSocket.close();
    };
  }, [router]);

  useEffect(() => {
    if (socket && socket.connected && customDevices.length > 0) {
      customDevices.forEach(dev => {
        socket.emit("check_device_status", { device_id: dev.deviceId });
        
        if (dev.schedules) {
          socket.emit("update_schedules", { device_id: dev.deviceId, schedules: dev.schedules });
        }
      });
    }
  }, [socket, customDevices]);

  const sendDeviceCommand = useCallback((deviceId: string, action: string, subId?: number) => {
    if (socket) {
      // Payload matching the requirements
      socket.emit('send_command', { device_id: deviceId, action, sub_id: subId });
    }
  }, [socket]);

  const handleVoiceCommand = (transcript: string) => {
    const cmd = transcript.toLowerCase().trim();
    let response = "";
    let action = "";
    let targetName = "";

    // Parse the command and device name
    if (cmd.startsWith("bật ") || cmd.startsWith("mở ")) {
      action = "ON";
      targetName = cmd.replace(/^(bật|mở)\s+/, "").trim();
    } else if (cmd.startsWith("tắt ") || cmd.startsWith("đóng ")) {
      action = "OFF";
      targetName = cmd.replace(/^(tắt|đóng)\s+/, "").trim();
    }

    if (!action || !targetName) {
      response = "Lệnh không hợp lệ. Vui lòng nói 'bật/tắt/mở/đóng [tên thiết bị]'.";
    } else {
      let found = false;
      const newCustomDevices = [...customDevices];
      let deviceUpdated = false;

      // Unaccent function for better exact match comparison
      const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const normalizedTarget = normalizeStr(targetName);

      if (normalizedTarget === "tat ca" || normalizedTarget === "tat ca thiet bi" || normalizedTarget === "tat ca may") {
        for (let i = 0; i < newCustomDevices.length; i++) {
          const dev = newCustomDevices[i];
          if (dev.isMultiDevice && dev.subIds && dev.subIds.length > 0) {
            for (let subId of dev.subIds) {
              const uniqueId = `${dev.deviceId}_${subId}`;
              newCustomDevices[i] = { 
                ...newCustomDevices[i], 
                states: { ...(newCustomDevices[i].states || {}), [uniqueId]: action === "ON" } 
              };
              sendDeviceCommand(dev.deviceId, action, subId);
            }
          } else {
            newCustomDevices[i] = { ...newCustomDevices[i], state: action === "ON" };
            sendDeviceCommand(dev.deviceId, action);
          }
        }
        found = true;
        deviceUpdated = true;
        response = `Đã ${action === "ON" ? "bật" : "tắt"} tất cả các thiết bị.`;
      } else if (normalizedTarget.startsWith("tat ca ")) {
        // Tắt/bật tất cả một NHÓM thiết bị cụ thể (ví dụ: "tất cả đèn", "tất cả quạt")
        const typeQuery = normalizedTarget.replace("tat ca ", "").trim();
        let matchedCount = 0;

        for (let i = 0; i < newCustomDevices.length; i++) {
          const dev = newCustomDevices[i];
          
          // So sánh với "Loại thiết bị" (chính là trường name của device trong MongoDB)
          if (dev.name && normalizeStr(dev.name).includes(typeQuery)) {
            if (dev.isMultiDevice && dev.subIds && dev.subIds.length > 0) {
              for (let subId of dev.subIds) {
                const uniqueId = `${dev.deviceId}_${subId}`;
                newCustomDevices[i] = { 
                  ...newCustomDevices[i], 
                  states: { ...(newCustomDevices[i].states || {}), [uniqueId]: action === "ON" } 
                };
                sendDeviceCommand(dev.deviceId, action, subId);
                matchedCount++;
              }
              found = true;
              deviceUpdated = true;
            } else {
              newCustomDevices[i] = { ...newCustomDevices[i], state: action === "ON" };
              sendDeviceCommand(dev.deviceId, action);
              found = true;
              deviceUpdated = true;
              matchedCount++;
            }
          }
        }
        if (found) {
          // Bỏ chữ 'tất cả' ra cho câu phản hồi đẹp
          const categoryName = targetName.replace(/^(tất cả|tat ca)\s+/i, "");
          response = `Đã ${action === "ON" ? "bật" : "tắt"} ${matchedCount} thiết bị "${categoryName}".`;
        }
      } else {
        for (let i = 0; i < newCustomDevices.length; i++) {
          const dev = newCustomDevices[i];
          
          if (dev.isMultiDevice && dev.subIds && dev.subIds.length > 0) {
            for (let subId of dev.subIds) {
              const rawPortName = dev.portNames?.[String(subId)] || dev.portNames?.[subId] || `${dev.name} (Cổng ${subId})`;
              if (normalizeStr(rawPortName) === normalizedTarget || rawPortName.toLowerCase() === targetName.toLowerCase()) {
                const uniqueId = `${dev.deviceId}_${subId}`;
                newCustomDevices[i] = { 
                  ...dev, 
                  states: { ...(dev.states || {}), [uniqueId]: action === "ON" } 
                };
                sendDeviceCommand(dev.deviceId, action, subId);
                found = true;
                deviceUpdated = true;
                break;
              }
            }
          } else {
            const rawDeviceName = dev.portNames?.[0] || dev.name;
            if (normalizeStr(rawDeviceName) === normalizedTarget || rawDeviceName.toLowerCase() === targetName.toLowerCase()) {
              newCustomDevices[i] = { ...dev, state: action === "ON" };
              sendDeviceCommand(dev.deviceId, action);
              found = true;
              deviceUpdated = true;
              break;
            }
          }
          if (found) break;
        }
      }

      if (found) {
        if (deviceUpdated) setCustomDevices(newCustomDevices);
        // Leave response empty to signify success -> uses ✅
      } else {
        response = `Không tìm thấy thiết bị nào tên "${targetName}".`;
      }
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
    <div className={`min-h-screen bg-white text-zinc-900 dark:bg-[#070709] dark:text-zinc-100 flex flex-col ${mobileShrink1 ? 'p-3' : 'p-4 md:p-8'} font-sans pb-24 relative overflow-hidden transition-colors duration-300`}>
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-300" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-300" />

      <div className={`w-full max-w-5xl mx-auto relative z-10 ${mobileShrink1 ? 'space-y-4' : 'space-y-8'}`}>
        {/* Header section */}
        <div className={`flex justify-between items-center ${mobileShrink1 ? 'sm:mt-2' : 'sm:mt-4'}`}>
            <div>
              <h1 className={`${mobileShrink1 ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>Ngôi Nhà</h1>
              <p className={`text-zinc-500 dark:text-zinc-400 ${mobileShrink1 ? 'text-xs mt-0.5' : 'text-sm mt-1'}`}>Xin chào, {userName}</p>
            </div>
            
            <div className={`flex items-center relative ${mobileShrink1 ? 'gap-2' : 'gap-4'}`}>
              {/* User Avatar Menu */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  className={`rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-black/10 dark:border-white/10 flex items-center justify-center hover:border-blue-500/50 transition-colors focus:outline-none ${mobileShrink1 ? 'w-8 h-8' : 'w-10 h-10'}`}
                >
                  <UserRound className={`${mobileShrink1 ? 'w-4 h-4' : 'w-5 h-5'} text-zinc-600 dark:text-zinc-300`} />
                </button>
                
                {/* Fallback Menu Dropdown */}
                {isAvatarMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <UserRound className="w-4 h-4" />
                      Hồ sơ
                    </button>
                    <button 
                      onClick={() => {
                        toggleTheme();
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                    </button>
                    <div className="w-full h-px bg-zinc-200 dark:bg-white/5 my-1"></div>
                    <button 
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors group"
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
                   <h2 className={`${mobileShrink1 ? 'text-lg' : 'text-xl'} font-semibold text-zinc-900 dark:text-zinc-100`}>Thiết bị</h2>
                   <button 
                     onClick={() => setIsAddDeviceModalOpen(true)}
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-full font-medium text-sm transition-colors"
                   >
                     <Plus className="w-4 h-4" />
                     <span>Thêm thiết bị</span>
                   </button>
                </div>
                <div className={`grid grid-cols-2 md:grid-cols-3 ${mobileShrink1 ? 'gap-2.5' : 'gap-4'}`}>
                   
                   {/* Render Dynamic Custom Devices */}
                   {customDevices.length === 0 ? (
                     <div className="col-span-full py-10 text-center text-zinc-500 dark:text-zinc-400 italic">
                        Hiện chưa có thiết bị nào. 
                     </div>
                   ) : (
                     customDevices.map(dev => (
                       <div className="contents" key={dev.deviceId || dev._id}>
                         {/* Tiêu đề nhóm thiết bị */}
                         <div className="col-span-full flex items-center gap-3 mt-4 mb-1">
                           <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{dev.name}</h3>
                           
                           {/* Status Indicator */}
                           <div className={`flex items-center bg-zinc-200/50 dark:bg-zinc-800/40 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md px-2 py-1 gap-1.5 text-[10px] ml-1`}>
                               <div className={`rounded-full w-1.5 h-1.5 ${deviceStatuses[dev.deviceId] ? "bg-emerald-500 shadow-[0_0_8px_#34d399] dark:bg-emerald-400" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}></div>
                               <span className="font-medium text-zinc-600 dark:text-zinc-300">{deviceStatuses[dev.deviceId] ? "Online" : "Offline"}</span>
                           </div>

                           <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10"></div>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 setSelectedDevice(dev);
                                 setIsScheduleModalOpen(true);
                                 setScheduleModalView('list');
                               }}
                               className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                               title="Lên lịch hẹn"
                             >
                               <AlarmClock className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => {
                                 setSelectedDevice(dev);
                                 setEditingPortNames(dev.portNames || {});
                                 setIsSettingsModalOpen(true);
                               }}
                               className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                               title="Cài đặt thiết bị"
                             >
                               <Settings className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         
                         {/* Render các card con */}
                         {dev.isMultiDevice && dev.subIds && dev.subIds.length > 0 ? (
                           dev.subIds.map((subId: number) => {
                             const uniqueId = `${dev.deviceId}_${subId}`;
                             return (
                               <DeviceCard 
                                 key={uniqueId} 
                                 id={uniqueId} 
                                 name={dev.portNames?.[String(subId)] || dev.portNames?.[subId] || `${dev.name} (Cổng ${subId})`} 
                                 state={dev.states?.[uniqueId] || false} 
                                 type="light" 
                                 portIndex={subId}
                                 onToggle={(id, currentState) => {
                                   setCustomDevices(prev => prev.map(d => 
                                     d.deviceId === dev.deviceId 
                                       ? { ...d, states: { ...(d.states || {}), [uniqueId]: !currentState } } 
                                       : d
                                   ));
                                   sendDeviceCommand(dev.deviceId, !currentState ? 'ON' : 'OFF', subId); 
                                 }} 
                                 mobileShrink1={mobileShrink1} 
                               />
                             );
                           })
                         ) : (
                           <DeviceCard 
                             key={dev.deviceId || dev._id} 
                             id={dev.deviceId || dev._id} 
                             name={dev.portNames?.[0] || dev.name} 
                             state={dev.state || false} 
                             type={dev.type || "light"} 
                             portIndex={1}
                             onToggle={(id, currentState) => {
                               setCustomDevices(prev => prev.map(d => d.deviceId === dev.deviceId ? { ...d, state: !currentState } : d));
                               sendDeviceCommand(dev.deviceId, !currentState ? 'ON' : 'OFF'); 
                             }} 
                             mobileShrink1={mobileShrink1} 
                           />
                         )}
                       </div>
                     ))
                   )}
                </div>
             </div>

          </div>

          {/* Sidebar - Right Column (4 cols) */}
          <div className={`lg:col-span-4 space-y-6`}>
             <div>
               <VoiceControl onCommand={handleVoiceCommand} statusText={feedbackText} mobileShrink1={mobileShrink1} />
             </div>

             {/* AI Tips */}
             <div className={`bg-white dark:bg-zinc-800/40 backdrop-blur-xl border bor    der-black/5 dark:border-white/5 rounded-3xl shadow-sm dark:shadow-none ${mobileShrink1 ? 'p-4' : 'p-6'}`}>
                 <div className={`flex items-center gap-2 ${mobileShrink1 ? 'mb-2' : 'mb-3'}`}>
                     <Lightbulb className={`${mobileShrink1 ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-500 dark:text-amber-400`} />
                     <span className={`${mobileShrink1 ? 'text-xs' : 'text-sm'} font-semibold text-zinc-900 dark:text-zinc-100`}>Gợi ý lệnh</span>
                 </div>
                 <div className={`${mobileShrink1 ? 'text-xs' : 'text-sm'} leading-relaxed text-zinc-500 dark:text-zinc-400`}>
                     "sử dụng lệnh bật/tắt/mở/đóng [thiết bị]"
                 </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- SCHEDULE MODAL --- */}
      {isScheduleModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            
            {scheduleModalView === 'list' && (
              <>
                <button 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                      <AlarmClock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Lên lịch hẹn</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {selectedDevice.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center justify-start mb-4">
                  <button 
                    onClick={() => {
                      // Init default newSchedule
                      let defSubId = selectedDevice.isMultiDevice && selectedDevice.subIds?.length > 0 ? selectedDevice.subIds[0] : 0;
                      setNewSchedule({ subId: defSubId, timeOn: '', timeOff: '', repeat: 'Một lần', customDays: [] });
                      setScheduleModalView('add');
                    }}
                    className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Thêm lịch hẹn mới
                  </span>
                </div>  

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {(!selectedDevice.schedules || selectedDevice.schedules.length === 0) ? (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm italic bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/5">
                      Chưa thiết lập lịch hẹn
                    </div>
                  ) : (
                    selectedDevice.schedules.map((sched: any, idx: number) => {
                      const portName = selectedDevice.isMultiDevice ? (selectedDevice.portNames?.[sched.subId] || `Cổng ${sched.subId}`) : (selectedDevice.portNames?.[0] || selectedDevice.name);
                      return (
                        <div key={sched.id || idx} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/10 flex justify-between items-center group">
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">{portName}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                              {sched.timeOn && <div><span className="text-emerald-500 font-medium">Bật:</span> {sched.timeOn}</div>}
                              {sched.timeOff && <div><span className="text-red-500 font-medium">Tắt:</span> {sched.timeOff}</div>}
                              <div className="text-blue-500">Lặp: {sched.repeat}</div>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteSchedule(sched.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}

            {scheduleModalView === 'add' && (
              <form onSubmit={handleAddSchedule} className="animate-in slide-in-from-right-4 fade-in duration-200">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Thêm lịch mới</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Thiết lập hẹn giờ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedDevice.isMultiDevice && selectedDevice.subIds && selectedDevice.subIds.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Thiết bị nào</label>
                      <select 
                        value={newSchedule.subId}
                        onChange={(e) => setNewSchedule({...newSchedule, subId: parseInt(e.target.value)})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors appearance-none"
                      >
                        {selectedDevice.subIds.map((sid: number) => (
                          <option key={sid} value={sid}>{selectedDevice.portNames?.[sid] || `Cổng ${sid}`}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Hẹn giờ bật</label>
                      <input 
                        type="time" 
                        value={newSchedule.timeOn}
                        onChange={(e) => setNewSchedule({...newSchedule, timeOn: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Hẹn giờ tắt</label>
                      <input 
                        type="time" 
                        value={newSchedule.timeOff}
                        onChange={(e) => setNewSchedule({...newSchedule, timeOff: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Lặp lại</label>
                    <select 
                      value={newSchedule.repeat}
                      onChange={(e) => setNewSchedule({...newSchedule, repeat: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="Một lần">Một lần</option>
                      <option value="Hàng ngày">Hàng ngày</option>
                      <option value="Tùy chỉnh">Tùy chỉnh</option>
                    </select>
                  </div>
                  
                  {newSchedule.repeat === 'Tùy chỉnh' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Chọn ngày</label>
                      <div className="flex gap-2 justify-between">
                        {[{label: 'T2', val: 1}, {label: 'T3', val: 2}, {label: 'T4', val: 3}, {label: 'T5', val: 4}, {label: 'T6', val: 5}, {label: 'T7', val: 6}, {label: 'CN', val: 0}].map(day => (
                          <button
                            key={day.val}
                            type="button"
                            onClick={() => {
                              const hasDay = newSchedule.customDays.includes(day.val);
                              setNewSchedule({
                                ...newSchedule,
                                customDays: hasDay 
                                  ? newSchedule.customDays.filter(d => d !== day.val) 
                                  : [...newSchedule.customDays, day.val]
                              });
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                              newSchedule.customDays.includes(day.val) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6 mt-2 border-t border-zinc-200 dark:border-white/10">
                  <button 
                    type="button"
                    onClick={() => setScheduleModalView('list')}
                    className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingSchedule}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                  >
                    {isSavingSchedule ? "Đang lưu..." : "Xác nhận"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* --- CÀI ĐẶT THIẾT BỊ MODAL --- */}
      {isSettingsModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setIsSettingsModalOpen(false);
                setSelectedDevice(null);
              }}
              className="absolute top-4 right-4 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="p-3 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 rounded-2xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Cài đặt thiết bị</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedDevice.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-white/10">
                 <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Địa chỉ MAC</div>
                 <div className="font-mono text-zinc-900 dark:text-zinc-100">{selectedDevice.deviceId}</div>
                 
                 <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 mb-1">Loại mạch</div>
                 <div className="font-medium text-zinc-900 dark:text-zinc-100">
                   {selectedDevice.isMultiDevice ? `Đa thiết bị (${selectedDevice.subIds?.length} cổng)` : 'Thiết bị đơn'}
                 </div>
               </div>

               {selectedDevice.isMultiDevice && selectedDevice.subIds && selectedDevice.subIds.length > 0 && (
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-white/10">
                   <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Đổi tên cổng điều khiển</div>
                   <div className="space-y-3">
                     {selectedDevice.subIds.map((subId: number) => (
                       <div key={subId} className="flex flex-col gap-1">
                         <label className="text-xs text-zinc-500 dark:text-zinc-400">Cổng {subId}</label>
                         <input 
                           type="text"
                           value={editingPortNames[String(subId)] || ''}
                           onChange={(e) => setEditingPortNames({
                             ...editingPortNames,
                             [String(subId)]: e.target.value
                           })}
                           className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-blue-500 text-zinc-900 dark:text-white rounded-lg py-2 px-3 text-sm outline-none transition-colors"
                           placeholder={`Tên thiết bị (Cổng ${subId})`}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {!selectedDevice.isMultiDevice && (
                 <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-white/10">
                   <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Đổi tên thiết bị</div>
                   <input 
                     type="text"
                     value={editingPortNames['0'] || ''}
                     onChange={(e) => setEditingPortNames({
                       ...editingPortNames,
                       ['0']: e.target.value
                     })}
                     className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-blue-500 text-zinc-900 dark:text-white rounded-lg py-2 px-3 text-sm outline-none transition-colors"
                     placeholder="Tên thiết bị..."
                   />
                 </div>
               )}

               <div className="pt-2 flex gap-3">
                 <button 
                   onClick={() => alert("Tính năng xóa thiết bị đang được phát triển")}
                   className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-medium rounded-xl transition-colors"
                 >
                   Xóa thiết bị
                 </button>
                 <button 
                   onClick={handleSaveDeviceSettings}
                   disabled={isSavingDevice}
                   className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                 >
                   {isSavingDevice ? "Đang lưu..." : "Lưu thay đổi"}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD DEVICE MODAL --- */}
      {isAddDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={resetModal}
              className="absolute top-4 right-4 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Thêm thiết bị mới</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {verifyingStep === 'enter_mac' ? 'Kết nối thiết bị & cảm biến mới' : 'Thiết lập tên cho thiết bị'}
                </p>
              </div>
            </div>

            {verifyingStep === 'enter_mac' ? (
              <form onSubmit={handleVerifyMac} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Địa chỉ MAC (ESP32)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newDeviceMac}
                      onChange={(e) => setNewDeviceMac(e.target.value)}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-blue-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                      placeholder="VD: D4:E9:F4:E9:53:DC"
                      required
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={qrFileRef}
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                    <button 
                      type="button"
                      title="Quét mã QR từ ảnh"
                      onClick={() => qrFileRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors font-medium border border-zinc-200 dark:border-white/5"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={resetModal}
                    className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={isAddingDevice || !newDeviceMac}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isAddingDevice ? 'Xác thực...' : 'Tiếp tục'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveDevice} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20 mb-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Xác thực thành công!
                  </p>
                  <div className="text-xs text-green-700/80 dark:text-green-400/80 mt-1">
                    Cấu hình: {deviceVerificationInfo?.isMultiDevice ? 'MẠCH ĐA THIẾT BỊ' : 'THIẾT BỊ ĐƠN'}<br/>
                    {deviceVerificationInfo?.isMultiDevice && `Hỗ trợ ${deviceVerificationInfo?.subIds?.length} cổng điều khiển`}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên nhóm thiết bị</label>
                  <input 
                    type="text" 
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-blue-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                    placeholder="VD: Nhóm đèn vườn..."
                    autoFocus
                    required
                  />
                </div>

                <div className="w-full h-px bg-zinc-200 dark:bg-white/10 my-4"></div>

                {deviceVerificationInfo?.isMultiDevice ? (
                  deviceVerificationInfo?.subIds?.map((subId: number, index: number) => (
                    <div key={subId} className="mb-3">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên thiết bị ở cổng {subId}</label>
                      <input 
                        type="text" 
                        value={newPortNames[subId] || ''}
                        onChange={(e) => setNewPortNames(prev => ({ ...prev, [subId]: e.target.value }))}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-blue-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                        placeholder={`VD: Đèn cổng ${subId}`}
                        required
                      />
                    </div>
                  ))
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tên thiết bị nhánh</label>
                    <input 
                      type="text" 
                      value={newPortNames[0] || ''}
                      onChange={(e) => setNewPortNames(prev => ({ ...prev, [0]: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-blue-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                      placeholder={`VD: Đèn phòng khách`}
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setVerifyingStep('enter_mac')}
                    className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                  >
                    Quay lại
                  </button>
                  <button 
                    type="submit"
                    disabled={isAddingDevice}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                  >
                    {isAddingDevice ? 'Đang lưu...' : 'Hoàn tất'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* --------------------------- */}

      {/* --- CUSTOM TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-white/10 animate-in slide-in-from-top-5 fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-500" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
