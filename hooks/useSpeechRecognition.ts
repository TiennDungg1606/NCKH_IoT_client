import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const onResultRef = useRef(onResult);

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
        };
        rec.onerror = (event: any) => {
          let errMsg = "Lỗi nhận diện, thử lại";
          if(event.error === 'not-allowed') errMsg = "Quyền mic bị từ chối";
          else if(event.error === 'no-speech') errMsg = "Không nghe thấy giọng nói";
          
          setError(errMsg);
          setIsListening(false);
        };
        rec.onend = () => setIsListening(false);

        setRecognition(rec);
      } else {
        setError("Trình duyệt không hỗ trợ nhận diện giọng nói");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        setError(null);
        recognition.start();
      } catch (e) {
        // Tránh vòng lặp vô tận, chỉ dừng nếu có lỗi chứ không cố gắng khởi động lại liên tục
        recognition.stop();
        setIsListening(false);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  return { isListening, error, startListening, stopListening, hasSupport: !!recognition };
};
