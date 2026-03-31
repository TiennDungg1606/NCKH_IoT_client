import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const onResultRef = useRef(onResult);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const hasSentResultRef = useRef<boolean>(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'vi-VN';
        
        // KIỂM TRA MÔI TRƯỜNG IOS HẾT SỨC QUAN TRỌNG
        // Safari và Chrome trên iOS sử dụng chung engine WebKit rất nhiều lỗi. Nó bắt buộc phải tắt cả continuous và interim.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // 1. CHÌA KHÓA IOS: Safari/iOS không hỗ trợ continuous = true, sẽ gây lỗi đứng mic.
        rec.continuous = false;
        
        // 2. CHÌA KHÓA IOS 2: Với iOS, interimResults = true có tỉ lệ lớn trả về rỗng không chạy được. Phải ép bằng false.
        // Còn Android/Cốc Cốc thì cần bật true để có thể ép cắt tiếng ồn nhanh bằng code debounce 1.5s
        rec.interimResults = !isIOS; 

        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
          accumulatedTranscriptRef.current = '';
          hasSentResultRef.current = false;
        };
        
        rec.onresult = (event: any) => {
          let currentTranscript = '';
          let isFinalFound = false;
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              isFinalFound = true;
            }
          }

          if (currentTranscript.trim()) {
            accumulatedTranscriptRef.current = currentTranscript;
            
            // Nếu có độ trễ im lặng, reset bộ đếm liên tục
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

            // iOS (khi interim=false) sẽ luôn bay thẳng vào isFinalFound = true
            if (isFinalFound || isIOS) {
              if (!hasSentResultRef.current) {
                onResultRef.current(accumulatedTranscriptRef.current);
                hasSentResultRef.current = true;
              }
              try { rec.stop(); } catch(e) {}
              setIsListening(false);
              clearAutoStopRef();
            } else {
              // Thuật toán cho Android/Chrome: Xử lý tạp âm
              // Người dùng ngừng nói 1.5 giây thì tự ép xác nhận hết câu rồi tắt mic
              silenceTimerRef.current = setTimeout(() => {
                if (!hasSentResultRef.current && accumulatedTranscriptRef.current) {
                  onResultRef.current(accumulatedTranscriptRef.current);
                  hasSentResultRef.current = true;
                }
                try { rec.stop(); } catch(e) {}
                setIsListening(false);
                clearAutoStopRef();
              }, 1500);
            }
          }
        };
        rec.onerror = (event: any) => {
          // Bỏ qua lỗi "no-speech" nếu đã kịp lấy được lệnh (do iOS hay bị ngắt gắt gỏng)
          if (event.error === 'no-speech' && accumulatedTranscriptRef.current) {
             return; 
          }

          let errMsg = "Lỗi nhận diện, thử lại";
          if(event.error === 'not-allowed') errMsg = "Quyền mic bị từ chối";
          else if(event.error === 'no-speech') errMsg = "Không nghe thấy lệnh gì";
          else errMsg = `Lỗi hệ thống: ${event.error}`;
          
          setError(errMsg);
          setIsListening(false);
          clearAutoStopRef();
        };
        rec.onend = () => {
          // Phòng hờ iOS tự tắt mic ngang mà vẫn có text thì đẩy text lên xử lý
          if (accumulatedTranscriptRef.current && !hasSentResultRef.current) {
             onResultRef.current(accumulatedTranscriptRef.current);
             hasSentResultRef.current = true;
          }
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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        setError(null);
        clearAutoStopRef();
        accumulatedTranscriptRef.current = '';
        hasSentResultRef.current = false;
        recognition.start();

        // Tự động ngắt hoàn toàn mic sau 8 giây nếu KHÔNG CÓ BẤT CỨ TÍN HIỆU GIỌNG NÓI NÀO (onresult chưa từng được gọi)
        timeoutRef.current = setTimeout(() => {
          if (!hasSentResultRef.current && !accumulatedTranscriptRef.current) {
             try { recognition.stop(); } catch(e){}
             setError("Tự động ngắt (Không phát hiện lệnh)");
          }
          setIsListening(false);
        }, 8000); 

      } catch (e) {
        // Tránh vòng lặp vô tận, chỉ dừng nếu có lỗi chứ không cố gắng khởi động lại liên tục
        try { recognition.stop(); } catch(err){}
        setIsListening(false);
        clearAutoStopRef();
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try { recognition.stop(); } catch(e){}
    }
    clearAutoStopRef();
    setIsListening(false);
  }, [recognition, isListening]);

  return { isListening, error, startListening, stopListening, hasSupport: !!recognition };
};
