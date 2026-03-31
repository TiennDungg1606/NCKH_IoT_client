"use client";

import { useEffect, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import DeviceCard from "@/components/DeviceCard";
import VoiceControl from "@/components/VoiceControl";
import { Lightbulb } from "lucide-react";
// Assuming you have NextAuth session, we'd normally get devices from DB
// For this demo, we'll manage local state mapped to DB devices eventually

export default function Dashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [feedbackText, setFeedbackText] = useState("🎙️ Nhấn micro và nói lệnh (bật/tắt đèn...)");
  
  // Dummy device states matching HTML
  const [devices, setDevices] = useState({
    light: false,
    door: false,
    auxLight: false,
    fan: false
  });

  useEffect(() => {
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
    } else if (cmd.includes("bật đèn phụ") || cmd.includes("mở đèn phụ")) {
      if (!devices.auxLight) toggleDevice('auxLight', false);
      else response = "Đèn phụ đã bật sẵn rồi";
    } else if (cmd.includes("tắt đèn phụ")) {
      if (devices.auxLight) toggleDevice('auxLight', true);
      else response = "Đèn phụ đã tắt";
    } else if (cmd.includes("bật đèn") || cmd.includes("mở đèn")) {
      if (!devices.light) toggleDevice('light', false);
      else response = "Đèn chính đã bật sẵn rồi";
    } else if (cmd.includes("tắt đèn")) {
      if (devices.light) toggleDevice('light', true);
      else response = "Đèn chính đã tắt";
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
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col p-4 md:p-8 font-sans pb-24 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto relative z-10 space-y-8">
        {/* Header section */}
        <div className="flex justify-between items-center sm:mt-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ngôi Nhà</h1>
              <p className="text-zinc-400 text-sm mt-1">Xin chào, Quản trị viên</p>
            </div>
            
            <div className="flex items-center gap-3 bg-zinc-800/40 rounded-full pl-3 pr-4 py-2 border border-white/5 backdrop-blur-md text-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-red-500 shadow-[0_0_10px_#ef4444]"}`}></div>
                <span className="font-medium">{isConnected ? "Connected" : "Offline"}</span>
            </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Controls - Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
             <div>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-semibold text-zinc-100">Thiết bị</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   <DeviceCard id="light" name="Đèn chính" state={devices.light} type="light" onToggle={toggleDevice} />
                   <DeviceCard id="door" name="Cửa" state={devices.door} type="door" onToggle={toggleDevice} />
                   <DeviceCard id="auxLight" name="Đèn phụ" state={devices.auxLight} type="aux" onToggle={toggleDevice} />
                   <DeviceCard id="fan" name="Quạt" state={devices.fan} type="fan" onToggle={toggleDevice} />
                </div>
             </div>

          </div>

          {/* Sidebar - Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
             <VoiceControl onCommand={handleVoiceCommand} statusText={feedbackText} />

             {/* AI Tips */}
             <div className="bg-zinc-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                 <div className="flex items-center gap-2 mb-3">
                     <Lightbulb className="w-4 h-4 text-amber-400" />
                     <span className="text-sm font-semibold text-zinc-100">Gợi ý lệnh</span>
                 </div>
                 <div className="text-sm leading-relaxed text-zinc-400">
                     "bật/tắt đèn", "mở/đóng cửa", "bật/tắt đèn phụ", "bật/tắt quạt"
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
