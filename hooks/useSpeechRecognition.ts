import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const onResultRef = useRef(onResult);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'vi-VN';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => setIsListening(true);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onResultRef.current(transcript);
          setIsListening(false);
          clearAutoStopRef();
        };
        rec.onerror = (event: any) => {
          let errMsg = "Lỗi nhận diện, thử lại";
          if(event.error === 'not-allowed') errMsg = "Quyền mic bị từ chối";
          else if(event.error === 'no-speech') errMsg = "Không nghe thấy giọng nói";
          
          setError(errMsg);
          setIsListening(false);
          clearAutoStopRef();
        };
        rec.onend = () => {
          setIsListening(false);
          clearAutoStopRef();
        };

        setRecognition(rec);
      } else {
        setError("Trình duyệt không hỗ trợ nhận diện giọng nói");
      }
    }
  }, []);

  const clearAutoStopRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        setError(null);
        clearAutoStopRef();
        recognition.start();

        // Tự động ngắt mic sau 8 giây nếu không có tín hiệu (Dành cho Mobile / trình duyệt không tự ngắt)
        timeoutRef.current = setTimeout(() => {
          if (recognition) {
            recognition.stop();
          }
          setError("Tự động ngắt (Không có giọng nói)");
          setIsListening(false);
        }, 8000);

      } catch (e) {
        // Tránh vòng lặp vô tận, chỉ dừng nếu có lỗi chứ không cố gắng khởi động lại liên tục
        recognition.stop();
        setIsListening(false);
        clearAutoStopRef();
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
    clearAutoStopRef();
    setIsListening(false);
  }, [recognition, isListening]);

  return { isListening, error, startListening, stopListening, hasSupport: !!recognition };
};
