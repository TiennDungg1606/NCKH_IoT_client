"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ChevronLeft, Lock, Mail, User, Save, Sun, Moon, LogOut, Edit2, X } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  
  // States
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Responsive / Viewport states
  const [mobileShrink1, setMobileShrink1] = useState(false);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [modalMessage, setModalMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  useEffect(() => {
    // Responsive logic
    function checkDevice() {
      const mobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      const portrait = window.innerHeight > window.innerWidth;
      const compactWidth = window.innerWidth < 768; // Adjust threshold if needed
      setMobileShrink1((mobile && portrait) || compactWidth);
    }
    
    if (typeof window !== 'undefined') {
      checkDevice();
      window.addEventListener('resize', checkDevice);
      window.addEventListener('orientationchange', checkDevice);

      // Check user authentication
      const savedUserName = Cookies.get("userName");
      const savedUserEmail = Cookies.get("userEmail"); // Need to save this during login ideally
      if (!savedUserName) {
        router.replace('/login');
        return;
      }
      setUserName(savedUserName);
      setUserEmail(savedUserEmail || "user@example.com"); // Fallback

      // Check saved theme
      const savedTheme = Cookies.get('theme');
      if (savedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }

      return () => {
        window.removeEventListener('resize', checkDevice);
        window.removeEventListener('orientationchange', checkDevice);
      };
    }
  }, [router]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      Cookies.set('theme', 'dark', { expires: 365 });
    } else {
      document.documentElement.classList.remove('dark');
      Cookies.set('theme', 'light', { expires: 365 });
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    // Simulate API update
    Cookies.set("userName", userName);
    setMessage({ type: 'success', text: 'Đã cập nhật hồ sơ thành công!' });
    setIsEditing(false);
    
    // Reset message after 3s
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setModalMessage({ type: 'error', text: 'Vui lòng nhập đủ các trường!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }
    
    // Simulate API Password update
    setModalMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setModalMessage(null);
    }, 1500);
  };

  const handleForgotPassword = async () => {
    if (!userEmail) {
      setModalMessage({ type: 'error', text: 'Không tìm thấy Email người dùng.' });
      return;
    }
    setIsSendingResetEmail(true);
    setModalMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      
      setModalMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("userId");
    Cookies.remove("userName");
    Cookies.remove("userEmail");
    router.push("/");
  };

  return (
    <div className={`min-h-screen bg-white text-zinc-900 dark:bg-[#070709] dark:text-zinc-100 flex flex-col ${mobileShrink1 ? 'p-3' : 'p-4 md:p-8'} font-sans relative overflow-hidden transition-colors duration-300`}>
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-300" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-300" />

      <div className={`w-full max-w-2xl mx-auto relative z-10 ${mobileShrink1 ? 'space-y-4' : 'space-y-8'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between z-20 relative ${mobileShrink1 ? 'sm:mt-2' : 'sm:mt-4'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:border-blue-500/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <h1 className={`${mobileShrink1 ? 'text-xl' : 'text-2xl'} font-bold tracking-tight`}>Hồ sơ cá nhân</h1>
          </div>
        </div>

        {/* Profile Form Content */}
        <div className={`bg-white dark:bg-zinc-800/40 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl shadow-sm dark:shadow-none overflow-hidden relative ${mobileShrink1 ? 'p-5' : 'p-8'}`}>
          
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            {!isEditing ? (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-full font-medium text-sm transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setUserName(Cookies.get("userName") || ""); // Reset lại tên
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Thoát</span>
              </button>
            )}
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4 border-4 border-white dark:border-[#070709]">
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Cập nhật thông tin của bạn</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Địa chỉ Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input 
                  type="email" 
                  value={userEmail}
                  disabled
                  className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-500 rounded-2xl py-3 pl-11 pr-4 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* User Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Tên hiển thị</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${isEditing ? 'text-blue-500' : 'text-zinc-400'}`} />
                </div>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full bg-white dark:bg-zinc-900 border ${isEditing ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'border-zinc-300 dark:border-white/10 opacity-70'} focus:border-blue-500 dark:focus:border-blue-500 text-zinc-900 dark:text-white rounded-2xl py-3 pl-11 pr-4 outline-none transition-all placeholder:text-zinc-400`}
                  placeholder="Nhập tên của bạn"
                  required
                />
              </div>
            </div>

            {!isEditing && (
              <>
                <hr className="border-zinc-200 dark:border-white/5 my-3" />

                {/* Change Password Button */}
                <button className="flex w-full justify-between items-center py-2 bg-zinc-50 dark:bg-zinc-900/50 px-2 md:px-2 rounded-2xl border border-zinc-200 dark:border-white/5"
                  type = "button"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  <div className="flex items-center gap-1">
                    <div className="p-2 rounded-full">
                      <Lock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Đổi mật khẩu</h4>
                    </div>
                  </div>
                </button>
              </>
            )}

            {/* Alerts */}
            {message && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in ${message.type === 'error' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                {message.text}
              </div>
            )}

            {isEditing && (
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-2xl py-3.5 mt-4 transition-colors flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2"
              >
                <Save className="w-5 h-5" />
                Lưu thay đổi
              </button>
            )}
          </form>

        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setIsPasswordModalOpen(false);
                setModalMessage(null);
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute top-4 right-4 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Đổi mật khẩu</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Thiết lập mật khẩu mới cho tài khoản của bạn</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mật khẩu cũ</label>
                </div>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      disabled={isSendingResetEmail}
                      className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                    >
                      {isSendingResetEmail ? 'Đang gửi...' : 'Quên mật khẩu?'}
                    </button>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                  placeholder="Mật khẩu mới"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Xác nhận mật khẩu</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-500 text-zinc-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
                  placeholder="Xác nhận lại mật khẩu mới"
                  required
                />
              </div>

               {modalMessage && (
                <div className={`p-3 rounded-lg text-sm font-medium text-center ${modalMessage.type === 'error' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                  {modalMessage.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                   onClick={() => {
                    setIsPasswordModalOpen(false);
                    setModalMessage(null);
                  }}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
