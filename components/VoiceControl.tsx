"use client";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Mic, MicOff } from "lucide-react";
import DeviceCard from "./DeviceCard";

interface VoiceControlProps {
  onCommand: (command: string) => void;
  statusText: string;
  mobileShrink1?: boolean;
}

export default function VoiceControl({ onCommand, statusText, mobileShrink1 }: VoiceControlProps) {
  const { isListening, error, startListening, stopListening, hasSupport } = useSpeechRecognition((transcript) => {
    onCommand(transcript);
  });

  const toggleListen = () => {
    if (isListening) stopListening();
    else startListening();
  };

  if (!hasSupport) {
    return (
      <div className="bg-white dark:bg-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
        <p className="text-red-500 dark:text-red-400 text-sm">Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.</p>
      </div>
    );
  }

  return (
    <div className={`${mobileShrink1 ? 'p-4' : 'p-3'} bg-white dark:bg-zinc-800/40 backdrop-blur-xl rounded-3xl p-1 border border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center shadow-sm dark:shadow-none`}>
        <div className="text-center mb-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Trợ lý giọng nói</h3>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 h-6">
                {error ? <span className="text-red-500 dark:text-red-400">⚠️ {error}</span> : isListening ? "Đang lắng nghe..." : "Nhấn để ra lệnh"}
            </p>
        </div>

        <button 
          onClick={toggleListen}
          className={`relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-500 outline-none
            ${isListening 
                ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)] scale-105' 
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/10'}`}
        >
          {isListening ? (
             <Mic className="w-10 h-10 text-white" />
          ) : (
             <MicOff className="w-10 h-10 text-zinc-500 dark:text-zinc-400" />
          )}
          {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75 duration-1000"></span>
          )}
        </button>
        
        <div className="mt-3 text-center max-w-[220px]">
            <p className="text-xs text-zinc-600 dark:text-zinc-500 leading-relaxed font-medium min-h-[40px]">
                {statusText}
            </p>
        </div>
    </div>
  );
}
