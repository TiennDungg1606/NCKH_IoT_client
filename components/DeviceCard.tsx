"use client";

import React, { memo } from "react";
import { Lightbulb, DoorOpen, DoorClosed, Sparkles, Fan } from "lucide-react";

interface DeviceCardProps {
  id: string;
  name: string;
  state: boolean;
  type: 'light' | 'door' | 'aux' | 'fan';
  onToggle: (id: string, currentState: boolean) => void;
}

const DeviceCard = memo(function DeviceCard({ id, name, state, type, onToggle }: DeviceCardProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'light':
        return <Lightbulb className="w-6 h-6" />;
      case 'door':
        return state ? <DoorOpen className="w-6 h-6" /> : <DoorClosed className="w-6 h-6" />;
      case 'aux':
        return <Sparkles className="w-6 h-6" />;
      case 'fan':
        return <Fan className={`w-6 h-6 ${state ? "animate-spin" : ""}`} />;
    }
  };

  const bgClass = state 
    ? "bg-white text-zinc-900 shadow-xl shadow-white/5 border-transparent transition-all duration-300" // active
    : "bg-zinc-800/40 text-white backdrop-blur-xl border-white/5 border transition-all duration-300 hover:bg-zinc-700/50"; // inactive

  const iconBg = state
    ? "bg-amber-100 text-amber-600"
    : "bg-zinc-700/50 text-zinc-400";

  return (
    <button 
      onClick={() => onToggle(id, state)}
      className={`rounded-3xl p-5 flex flex-col justify-between aspect-square w-full text-left origin-center active:scale-95 ${bgClass}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg} transition-colors duration-300`}>
        {getIcon()}
      </div>
      <div>
        <h3 className="font-semibold text-lg leading-tight truncate">{name}</h3>
        <p className={`text-sm mt-1 font-medium ${state ? "text-zinc-500" : "text-zinc-400"}`}>
          {state ? (type === 'door' ? 'Đã mở' : 'Đang bật') : (type === 'door' ? 'Đã đóng' : 'Đang tắt')}
        </p>
      </div>
    </button>
  );
});

export default DeviceCard;
