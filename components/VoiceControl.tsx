"use client";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Mic, MicOff } from "lucide-react";

interface VoiceControlProps {
  onCommand: (command: string) => void;
  statusText: string;
}

export default function VoiceControl({ onCommand, statusText }: VoiceControlProps) {
  const { isListening, error, startListening, stopListening, hasSupport } = useSpeechRecognition((transcript) => {
    onCommand(transcript);
  });

  const toggleListen = () => {
    if (isListening) stopListening();
    else startListening();
  };

  if (!hasSupport) {
    return (
      <div className="bg-zinc-800/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center">
        <p className="text-red-400 text-sm">Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">Trợ lý giọng nói</h3>
            <p className="text-sm font-medium text-zinc-400 h-6">
                {error ? <span className="text-red-400">⚠️ {error}</span> : isListening ? "Đang lắng nghe..." : "Nhấn để ra lệnh"}
            </p>
        </div>

        <button 
          onClick={toggleListen}
          className={`relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-500 outline-none
            ${isListening 
                ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)] scale-105' 
                : 'bg-zinc-700/50 hover:bg-zinc-700 border border-white/10'}`}
        >
          {isListening ? (
             <Mic className="w-10 h-10 text-white" />
          ) : (
             <MicOff className="w-10 h-10 text-zinc-400" />
          )}
          {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75 duration-1000"></span>
          )}
        </button>
        
        <div className="mt-8 text-center max-w-[220px]">
            <p className="text-xs text-zinc-500 leading-relaxed font-medium min-h-[40px]">
                {statusText}
            </p>
        </div>
    </div>
  );
}
