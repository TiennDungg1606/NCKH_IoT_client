"use client";

import React, { memo } from "react";
import { Lightbulb, DoorOpen, DoorClosed, Sparkles, Fan } from "lucide-react";

interface DeviceCardProps {
  id: string;
  name: string;
  state: boolean;
  type: 'light' | 'door' | 'aux' | 'fan';
  onToggle: (id: string, currentState: boolean) => void;
  mobileShrink1?: boolean;
}

const DeviceCard = memo(function DeviceCard({ id, name, state, type, onToggle, mobileShrink1 }: DeviceCardProps) {
  
  const getIcon = () => {
    const iconSize = mobileShrink1 ? "w-4 h-4" : "w-6 h-6";
    switch (type) {
      case 'light':
        return <Lightbulb className={iconSize} />;
      case 'door':
        return state ? <DoorOpen className={iconSize} /> : <DoorClosed className={iconSize} />;
      case 'aux':
        return <Sparkles className={iconSize} />;
      case 'fan':
        return <Fan className={`${iconSize} ${state ? "animate-spin" : ""}`} />;
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
      className={`${mobileShrink1 ? 'rounded-2xl p-3 h-[120px] gap-4' : 'rounded-3xl p-5 aspect-square justify-between'} flex flex-col w-full text-left origin-center active:scale-95 ${bgClass}`}
    >
      <div className={`${mobileShrink1 ? 'w-8 h-8' : 'w-12 h-12'} rounded-full flex items-center justify-center ${iconBg} transition-colors duration-300 shrink-0`}>
        {getIcon()}
      </div>
      <div>
        <h3 className={`font-semibold ${mobileShrink1 ? 'text-sm' : 'text-lg'} leading-tight truncate`}>{name}</h3>
        <p className={`${mobileShrink1 ? 'text-[11px] mt-0.5' : 'text-sm mt-1'} font-medium ${state ? "text-zinc-500" : "text-zinc-400"}`}>
          {state ? (type === 'door' ? 'Đã mở' : 'Đang bật') : (type === 'door' ? 'Đã đóng' : 'Đang tắt')}
        </p>
      </div>
    </button>
  );
});

export default DeviceCard;
