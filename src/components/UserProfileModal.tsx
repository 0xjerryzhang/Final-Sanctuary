/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  X,
  Coins,
  Save,
  Check,
  Mail,
  Lock,
  Upload,
  Camera,
  AlertCircle,
  UserPlus,
  LogIn,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Calendar,
  Gift,
  Music,
  Sparkles,
  ShieldAlert,
  Ban,
} from 'lucide-react';
import { wsService } from '../services/websocket';
import { beginAppleLogin, beginGoogleLogin, getStoredSuiAddress, getStoredSuiProvider, getZkLoginConfig } from '../services/zklogin';
import { triggerHaptic } from '../utils/haptics';
import { iosAudio } from '../utils/iosAudio';
import { getApiUrl } from '../utils/apiConfig';
import { formatCompactChips } from '../data/albumStages';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

// Google "G" logo (inline SVG) for the zkLogin Google sign-in button.
const GoogleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
    <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
    <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c.9-2.9 3.6-4.9 6.8-4.9z" />
  </svg>
);

// Apple logo (inline SVG) for the zkLogin Apple sign-in button.
const AppleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4 shrink-0'} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.088-.196-3.632 1.09-4.6 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702" />
  </svg>
);

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Account State
  const [userId, setUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_id') || '';
    } catch {
      return '';
    }
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_email') || '';
    } catch {
      return '';
    }
  });
  const [nickname, setNickname] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_nickname') || '圣所乐迷';
    } catch {
      return '圣所乐迷';
    }
  });
  // User-facing custom ID (username). Shown as "ID" in the profile card;
  // the long internal jj_user_... id stays the primary key and is hidden.
  const [username, setUsername] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_username') || '';
    } catch {
      return '';
    }
  });
  // The last *saved* ID, shown in the profile card. The input above edits
  // the draft `username`; the card only changes after a successful save,
  // so a rejected (invalid/taken) ID never appears as if it were saved.
  const [savedUsername, setSavedUsername] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_username') || '';
    } catch {
      return '';
    }
  });
  // Today's date in Asia/Shanghai (UTC+8), matching the server check-in day.
  const todayStrUTC8 = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const [avatar, setAvatar] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_avatar') || DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  // Sui wallet address from zkLogin (Google / Apple login); used for future SBT airdrops.
  const [suiAddress, setSuiAddress] = useState<string>(() => getStoredSuiAddress());
  const [suiProvider, setSuiProvider] = useState<string>(() => getStoredSuiProvider());

  // Whether the server has Apple zkLogin configured (Services ID set). The
  // Apple sign-in buttons only render when this is true, so they stay hidden
  // until the user enrolls in the Apple Developer Program.
  const [appleConfigured, setAppleConfigured] = useState(false);

  // Form Inputs for Auth
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCode, setFormCode] = useState('');
  const [verificationEnabled, setVerificationEnabled] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [hasAgreedAntiGambling, setHasAgreedAntiGambling] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);

  // Stats State
  const [chips, setChips] = useState<number>(130700);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Status & Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Whether the server requires an email verification code for registration.
  useEffect(() => {
    let alive = true;
    fetch(getApiUrl('/api/user/verification-status'))
      .then((res) => res.json())
      .then((json) => {
        if (alive) setVerificationEnabled(Boolean(json.enabled));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Whether the server has Apple zkLogin configured (Services ID set).
  useEffect(() => {
    let alive = true;
    getZkLoginConfig()
      .then((config) => {
        if (alive) setAppleConfigured(Boolean(config.apple?.configured));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 60s resend countdown for the verification code.
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setTimeout(() => setCodeCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCountdown]);

  // Send the registration verification code to the entered email.
  const handleSendCode = async () => {
    if (!formEmail || !formEmail.includes('@')) {
      setFeedback({ type: 'error', msg: '请先输入正确的电子邮箱格式' });
      return;
    }
    if (codeCountdown > 0 || isSendingCode) return;
    setIsSendingCode(true);
    try {
      const res = await fetch(getApiUrl('/api/user/send-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formEmail }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCodeCountdown(60);
        setFeedback({ type: 'success', msg: json.message || '验证码已发送至你的邮箱，请注意查收' });
      } else {
        setFeedback({ type: 'error', msg: json.message || '验证码发送失败，请稍后再试' });
      }
    } catch {
      setFeedback({ type: 'error', msg: '网络连接异常，请检查网络设置' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleDailyCheckin = async () => {
    if (!userId) {
      setFeedback({ type: 'error', msg: '请先完成登录后再领取每日签到奖励！' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(getApiUrl('/api/user/checkin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();

      if (json.success) {
        setChips(json.user.chips);
        setHasCheckedInToday(true);
        setFeedback({ type: 'success', msg: json.message });
        triggerHaptic('win');
        iosAudio.playWinFanfare();
      } else {
        if (json.alreadyCheckedIn) {
          setHasCheckedInToday(true);
        }
        setFeedback({ type: 'error', msg: json.message });
      }
    } catch (e) {
      setFeedback({ type: 'error', msg: '签到请求超时，请检查网络连接' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Load cloud account or initialize
    loadCloudUserData();

    // Subscribe to WS updates
    const unsub = wsService.subscribe((event) => {
      if (event.type === 'USER_UPDATED' && event.data) {
        if (typeof event.data.chips === 'number') setChips(event.data.chips);
        if (typeof event.data.wins === 'number') setWins(event.data.wins);
        if (typeof event.data.losses === 'number') setLosses(event.data.losses);
        if (event.data.userId) {
          setUserId(event.data.userId);
          try {
            localStorage.setItem('jj_user_id', event.data.userId);
          } catch {}
        }
      }
    });

    return () => unsub();
  }, [isOpen]);

  const loadCloudUserData = async () => {
    try {
      let storedId: string | undefined = undefined;
      try {
        storedId = localStorage.getItem('jj_user_id') || undefined;
      } catch {}

      const res = await fetch(getApiUrl('/api/user/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: storedId,
          nickname,
          avatar,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.user) {
          setUserId(json.user.id || '');
          setUserEmail(json.user.email || '');
          setNickname(json.user.nickname || '圣所乐迷');
          if (json.user.username) {
            setUsername(json.user.username);
            setSavedUsername(json.user.username);
          }
          if (json.user.lastCheckinDate) {
            setHasCheckedInToday(json.user.lastCheckinDate === todayStrUTC8());
          }
          setAvatar(json.user.avatar || DEFAULT_AVATAR);
          setChips(typeof json.user.chips === 'number' ? json.user.chips : 10000);
          setWins(json.user.wins || 0);
          setLosses(json.user.losses || 0);
          if (json.user.suiAddress) setSuiAddress(json.user.suiAddress);
          if (json.user.suiProvider) setSuiProvider(json.user.suiProvider);

          try {
            if (json.user.id) localStorage.setItem('jj_user_id', json.user.id);
            if (json.user.email) localStorage.setItem('jj_user_email', json.user.email);
            if (json.user.nickname) localStorage.setItem('jj_user_nickname', json.user.nickname);
            if (json.user.username) localStorage.setItem('jj_user_username', json.user.username);
            if (json.user.lastCheckinDate) localStorage.setItem('jj_last_checkin_date', json.user.lastCheckinDate);
            if (json.user.avatar) localStorage.setItem('jj_user_avatar', json.user.avatar);
            if (json.user.suiAddress) localStorage.setItem('jj_sui_address', json.user.suiAddress);
            if (json.user.suiProvider) localStorage.setItem('jj_sui_provider', json.user.suiProvider);
          } catch {}

          // Sync WS
          wsService.initUser(json.user.id, json.user.nickname, json.user.avatar, json.user.chips);
        }
      }
    } catch (e) {
      console.warn('Failed to load cloud user profile:', e);
    }
  };

  // Custom Avatar Image Upload Handler (Converts file to Base64 Data URL)
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', msg: '请选择标准的图片格式 (PNG / JPG / WEBP)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', msg: '图片文件体积较大，请上传小于 5MB 的图片' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      if (imgUrl) {
        setAvatar(imgUrl);
        setFeedback({ type: 'success', msg: '自定义头像已选择！点击下方保存按钮生效' });
        setTimeout(() => setFeedback(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Email Register / Login
  // Sui zkLogin: Google OAuth login. Redirects to Google; Google returns to the
  // app root and App.tsx finishes the login (derives + stores the Sui address).
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      await beginGoogleLogin();
    } catch (e) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'Google 登录启动失败，请稍后再试' });
      setIsLoading(false);
    }
  };

  // Sui zkLogin: Apple OAuth login (same flow as Google; Apple is a
  // different identity, so it derives a different Sui address).
  const handleAppleLogin = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      await beginAppleLogin();
    } catch (e) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'Apple 登录启动失败，请稍后再试' });
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formEmail || !formEmail.includes('@')) {
      setFeedback({ type: 'error', msg: '请输入正确的电子邮箱格式' });
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setFeedback({ type: 'error', msg: '密码长度不能少于 6 位字符' });
      return;
    }

    if (authMode === 'register' && !hasAgreedAntiGambling) {
      setFeedback({ type: 'error', msg: '⚠️ 注册前请先阅读并勾选同意《绿色游戏与严禁赌博公约》！' });
      triggerHaptic('warning');
      return;
    }

    if (authMode === 'register' && verificationEnabled && !formCode.trim()) {
      setFeedback({ type: 'error', msg: '请填写邮箱验证码' });
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/user/register' : '/api/user/login';
      const body = authMode === 'register'
        ? { email: formEmail, password: formPassword, nickname, avatar, currentUserId: userId, code: formCode.trim() }
        : { email: formEmail, password: formPassword };

      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok && json.success && json.user) {
        setUserId(json.user.id);
        setUserEmail(json.user.email || formEmail);
        setNickname(json.user.nickname || nickname);
        if (json.user.username) {
          setUsername(json.user.username);
          setSavedUsername(json.user.username);
        }
        if (json.user.lastCheckinDate) {
          setHasCheckedInToday(json.user.lastCheckinDate === todayStrUTC8());
        }
        setAvatar(json.user.avatar || avatar);
        setChips(typeof json.user.chips === 'number' ? json.user.chips : 10000);
        setWins(json.user.wins || 0);
        setLosses(json.user.losses || 0);
        if (json.user.suiAddress) setSuiAddress(json.user.suiAddress);
        if (json.user.suiProvider) setSuiProvider(json.user.suiProvider);

        try {
          localStorage.setItem('jj_user_id', json.user.id);
          localStorage.setItem('jj_user_email', json.user.email || formEmail);
          localStorage.setItem('jj_user_nickname', json.user.nickname);
          localStorage.setItem('jj_user_avatar', json.user.avatar);
          if (json.user.username) localStorage.setItem('jj_user_username', json.user.username);
          if (json.user.lastCheckinDate) localStorage.setItem('jj_last_checkin_date', json.user.lastCheckinDate);
          if (json.user.suiAddress) localStorage.setItem('jj_sui_address', json.user.suiAddress);
          if (json.user.suiProvider) localStorage.setItem('jj_sui_provider', json.user.suiProvider);
        } catch {}

        wsService.initUser(json.user.id, json.user.nickname, json.user.avatar, json.user.chips);

        setFeedback({ type: 'success', msg: json.message || '验证成功！已接入个人中心' });
        onLoginSuccess?.();
      } else {
        setFeedback({ type: 'error', msg: json.message || '处理失败，请检查账号信息' });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: '网络连接异常，请检查网络设置' });
    } finally {
      setIsLoading(false);
    }
  };

  // Update Profile Save
  const handleSaveProfile = async () => {
    try {
      const trimmedUsername = username.trim();
      if (trimmedUsername && !/^[A-Za-z0-9_-]{3,20}$/.test(trimmedUsername)) {
        setFeedback({ type: 'error', msg: 'ID 需为 3-20 位字母、数字、下划线或连字符' });
        setTimeout(() => setFeedback(null), 4000);
        return;
      }
      const res = await fetch(getApiUrl('/api/user/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nickname,
          avatar,
          email: userEmail,
          username: trimmedUsername || undefined,
        }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok) {
        if (json && json.user) {
          if (json.user.username) {
            setUsername(json.user.username);
            setSavedUsername(json.user.username);
            try {
              localStorage.setItem('jj_user_username', json.user.username);
            } catch {}
          }
          try {
            localStorage.setItem('jj_user_nickname', json.user.nickname);
            localStorage.setItem('jj_user_avatar', json.user.avatar);
          } catch {}
          wsService.initUser(json.user.id, json.user.nickname, json.user.avatar, json.user.chips);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2500);
        }
      } else {
        setFeedback({ type: 'error', msg: (json && json.message) || '保存失败，请稍后再试' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (e) {
      console.error('Save failed', e);
      setFeedback({ type: 'error', msg: '网络连接异常，请检查网络设置' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Logout / Switch Account
  const handleLogout = () => {
    setUserEmail('');
    setSuiAddress('');
    setSuiProvider('');
    try {
      localStorage.removeItem('jj_user_email');
      localStorage.removeItem('jj_sui_address');
      localStorage.removeItem('jj_sui_provider');
    } catch {}
    setFormEmail('');
    setFormPassword('');
    setShowDeleteConfirm(false);
    setFeedback({ type: 'success', msg: '已成功退出当前账号登录' });
  };

  // Delete Account (Mandatory for Apple App Store Review Guideline 5.1.1(v))
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await fetch(getApiUrl('/api/user/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      });
    } catch {
      // Ignore network errors and still clear local account state
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setUserEmail('');
      setUserId('');
      setFormEmail('');
      setFormPassword('');
      try {
        localStorage.removeItem('jj_user_id');
        localStorage.removeItem('jj_user_email');
        localStorage.removeItem('jj_user_nickname');
        localStorage.removeItem('jj_user_avatar');
      } catch {}
      setFeedback({ type: 'success', msg: '您的账号及关联数据已彻底注销删除' });
    }
  };

  if (!isOpen) return null;

  const isLoggedIn = !!userEmail;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-[#0e0422] border-2 border-purple-500/60 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.5)] overflow-hidden flex flex-col text-white max-h-[92dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/30 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-amber-500 flex items-center justify-center shadow-lg shrink-0">
                {isLoggedIn ? <User className="w-5 h-5 text-white" /> : <Mail className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="font-black text-base text-white">
                  {isLoggedIn ? '个人中心' : '账号登录与注册'}
                </h2>
                <p className="text-[10px] font-mono text-purple-300">
                  {isLoggedIn ? '乐迷资料 // 自定义头像 // 战绩' : '先登录账号以开启个人中心功能'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900 text-purple-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden File Input for Custom Avatar Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Alert / Feedback message */}
          {feedback && (
            <div
              className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* LAYER 1: NOT LOGGED IN -> Direct Register / Login Form */}
          {!isLoggedIn ? (
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Registration Welcome Bonus Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/90 via-purple-950/80 to-slate-950 border border-amber-500/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4 text-amber-300 animate-bounce" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-amber-200">注册礼包：即赠 130,700 圣所音符</div>
                    <div className="text-[10px] text-amber-300/80 font-mono">首领注册即刻到账，全场演唱会主题牌桌通用</div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              </div>

              {/* Sui zkLogin: prominent Google login suggestion (airdrop) */}
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-xs text-emerald-200">建议使用 Google 登录</div>
                  <div className="text-[11px] text-emerald-300/90 leading-relaxed mt-0.5">自动生成你的 Sui 钱包地址，后期可领取社区 SBT 空投。邮箱注册也能玩，但不会生成钱包地址。</div>
                </div>
              </div>

              {/* Sui zkLogin: Google login (auto-creates a Sui wallet address for future SBT airdrops) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-60"
              >
                <GoogleLogo />
                <span>使用 Google 登录</span>
              </button>
              {/* Sui zkLogin: Apple login (shown only when Apple is configured) */}
              {appleConfigured && (
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-black hover:bg-zinc-900 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-60 border border-zinc-700"
                >
                  <AppleLogo />
                  <span>使用 Apple 登录</span>
                </button>
              )}

              {/* Mode Selector */}
              <div className="flex p-1 bg-slate-950/80 rounded-xl border border-purple-500/30 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setFeedback(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'register'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>邮箱注册</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setFeedback(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'login'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>密码登录</span>
                </button>
              </div>

              {/* Auth Form - Strictly Email & Password */}
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 mt-1">
                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">电子邮箱地址 *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="your_email@example.com"
                      className="w-full bg-slate-950 border border-purple-500/40 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">登录密码 *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="****** (至少6位字符)"
                      className="w-full bg-slate-950 border border-purple-500/40 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-mono"
                    />
                  </div>
                </div>

                {/* Email Verification Code (shown only when the server enables it) */}
                {authMode === 'register' && verificationEnabled && (
                  <div>
                    <label className="text-xs font-mono text-purple-300 block mb-1">邮箱验证码 *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ShieldCheck className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="6 位数字验证码"
                          className="w-full bg-slate-950 border border-purple-500/40 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={codeCountdown > 0 || isSendingCode}
                        className="shrink-0 px-3.5 rounded-xl bg-purple-600/80 text-white font-bold text-xs hover:bg-purple-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingCode ? '发送中...' : codeCountdown > 0 ? `重新发送 (${codeCountdown}s)` : '发送验证码'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Anti-Gambling Agreement Box (Mandatory for Registration) */}
                {authMode === 'register' && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/95 border-2 border-rose-500/50 flex flex-col gap-2.5 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                    <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-black text-xs text-rose-200">绿色游戏与严禁赌博公约 (注册必读)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTermsDetail(!showTermsDetail)}
                        className="text-[10px] text-purple-300 hover:text-white underline font-mono cursor-pointer"
                      >
                        {showTermsDetail ? '收起条款' : '展开条款'}
                      </button>
                    </div>

                    <div className="text-[11px] text-purple-200/90 font-mono leading-relaxed flex flex-col gap-1">
                      <p>1. 本应用为林俊杰演唱会主题休闲娱乐测试，积分统一命名为<strong>【圣所音符】</strong>。</p>
                      <p>2. <strong>严禁任何形式的真实货币赌博、线下对冲变现或积分私下买卖交易</strong>。</p>
                      <p>3. 平台不开放充值入口，注册即赠 130,700 圣所音符，每日签到领 3,270 圣所音符。</p>

                      {showTermsDetail && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-2 border-t border-purple-500/30 text-[10px] text-purple-300/80 space-y-1"
                        >
                          <p>• 玩家必须遵守国家法律法规及平台公约，禁止利用本应用进行非法违规活动。</p>
                          <p>• 凡查实私下买卖积分或涉嫌赌博对冲者，平台将对违规账号执行永久封禁并重置。</p>
                          <p>• 本软件仅供歌迷交流、策略学习与演唱会舞台互动体验。</p>
                        </motion.div>
                      )}
                    </div>

                    <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={hasAgreedAntiGambling}
                        onChange={(e) => setHasAgreedAntiGambling(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-purple-500 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0"
                      />
                      <span className="text-xs text-purple-200 group-hover:text-white font-bold leading-tight">
                        我已完整阅读并同意 <span className="text-rose-300 underline font-black">《绿色游戏与严禁赌博公约》</span>，承诺绝不参与赌博或违规交易。
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 text-white font-black text-xs shadow-[0_0_20px_rgba(168,85,247,0.8)] hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <span>正在处理中...</span>
                  ) : authMode === 'register' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>注册并解锁个人中心</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>登录并解锁个人中心</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          ) : (
            /* LAYER 2: LOGGED IN -> Unlocks Personal Center (Avatar, Nickname, Stats, Logout) */
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Account Card & Custom Avatar Upload */}
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-950 border border-purple-500/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Interactive Custom Avatar Upload Circle */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.6)] cursor-pointer shrink-0"
                  >
                    <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-bold text-white">
                      <Camera className="w-4 h-4 text-fuchsia-300 mb-0.5" />
                      <span>更换头像</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="font-black text-base text-white flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{nickname}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-[10px] font-mono text-emerald-300 mt-0.5 flex items-center gap-1 truncate min-w-0">
                      <span className="truncate">📧 {userEmail}</span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-400 truncate">ID: {savedUsername || userId || '已连线'}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 whitespace-nowrap">
                  <div className="text-xs font-mono text-purple-300">圣所音符</div>
                  <div className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-end gap-1">
                    <Music className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <span>{formatCompactChips(chips ?? 0)}</span>
                  </div>
                </div>
              </div>

              {/* Sui wallet address (zkLogin) — future community SBT airdrops go here */}
              {suiAddress ? (
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-emerald-200">Sui 钱包地址{suiProvider === 'apple' ? '（Apple）' : suiProvider === 'google' ? '（Google）' : ''}</div>
                    <div className="text-[11px] font-mono text-emerald-300/80 mt-0.5 truncate">{suiAddress}</div>
                    <div className="text-[10px] font-mono text-purple-300/70 mt-0.5">未来社区 SBT 将空投到该地址</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(suiAddress);
                        setFeedback({ type: 'success', msg: '钱包地址已复制' });
                      } catch {
                        setFeedback({ type: 'error', msg: '复制失败，请手动选择复制' });
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    复制
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                  >
                    <GoogleLogo />
                    <span>绑定 Google 钱包</span>
                  </button>
                  {appleConfigured && (
                    <button
                      type="button"
                      onClick={handleAppleLogin}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-black hover:bg-zinc-900 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-60 border border-zinc-700"
                    >
                      <AppleLogo />
                      <span>绑定 Apple 钱包</span>
                    </button>
                  )}
                </div>
              )}

              {/* Daily Sign-In Card (+3,270 Sanctuary Notes) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/90 via-fuchsia-950/80 to-slate-950 border border-fuchsia-500/50 flex items-center justify-between shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-fuchsia-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-xs text-white flex items-center gap-1.5">
                      <span>每日领签到礼</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                        +3,270
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-300/80 mt-0.5 truncate">
                      每天登录免费领取
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hasCheckedInToday || isLoading}
                  onClick={handleDailyCheckin}
                  className={`px-2.5 sm:px-3.5 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    hasCheckedInToday
                      ? 'bg-purple-950 border border-purple-700/60 text-purple-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-fuchsia-500 to-purple-600 hover:brightness-110 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)] active:scale-95'
                  }`}
                >
                  {hasCheckedInToday ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>今日已签到</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-3.5 h-3.5 text-amber-200" />
                      <span>立即签到</span>
                    </>
                  )}
                </button>
              </div>


              {/* Custom Avatar Upload Button */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-fuchsia-400" />
                    <span>玩家自定义头像上传</span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-300 mt-0.5">
                    点击上传本地图片作为专属头像
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>选择本地图片</span>
                </button>
              </div>

              {/* Edit Nickname */}
              <div>
                <label className="text-xs font-mono text-purple-300 block mb-1">自定义乐迷昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-bold"
                />
              </div>

              {/* Edit Custom ID (username) */}
              <div>
                <label className="text-xs font-mono text-purple-300 block mb-1">自定义 ID</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="3-20 位字母、数字、下划线或连字符"
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-mono"
                />
                <div className="text-[10px] font-mono text-purple-300/70 mt-1">个人中心显示的 ID，保存后全站唯一，改好点下方「保存资料修改」生效。</div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 text-center">
                  <div className="text-[10px] font-mono text-purple-300">历史战绩 (胜/负)</div>
                  <div className="text-sm font-black text-white mt-1">
                    <span className="text-emerald-400">{wins}胜</span> / <span className="text-rose-400">{losses}负</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 text-center">
                  <div className="text-[10px] font-mono text-purple-300">胜率</div>
                  <div className="text-sm font-black text-amber-300 mt-1">
                    {wins + losses > 0 ? `${Math.round((wins / (wins + losses)) * 100)}%` : '100%'}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save Profile & Logout */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 text-white font-black text-xs shadow-[0_0_20px_rgba(168,85,247,0.8)] hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>资料已更新!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>保存资料修改</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>

              {/* Account Deletion (Apple Guideline 5.1.1(v)) */}
              {!showDeleteConfirm ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-[11px] font-mono text-rose-400/80 hover:text-rose-300 underline cursor-pointer"
                  >
                    永久注销并删除当前账号
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 flex flex-col gap-2 text-xs">
                  <p className="text-rose-200 font-bold">
                    确认要永久注销并删除当前账号吗？删除后圣所音符与战绩将无法恢复。
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 text-slate-300 font-bold cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer"
                    >
                      确认永久注销
                    </button>
                  </div>
                </div>
              )}

              {/* App Store Compliance & Virtual Currency Disclaimer (Apple Guideline Section 3.2.1 & 5.3) */}
              <div className="mt-2 p-3 rounded-xl bg-slate-950/90 border border-purple-500/20 text-[10px] text-purple-300/70 font-mono leading-tight flex flex-col gap-1">
                <div className="font-bold text-purple-200 flex items-center justify-between border-b border-purple-500/20 pb-1">
                  <span> App Store 合规与虚拟道具声明</span>
                  <span className="text-emerald-400">Section 3.2.1 & 5.3</span>
                </div>
                <p>1. 本应用内所有“圣所音符”均为演唱会主题虚拟娱乐道具，不具备实际货币价值。</p>
                <p>2. 严禁任何形式的真实货币赌博、反向兑现或私下交易行为。</p>
                <p>3. 倡导绿色健康休闲，适合 18 岁以上乐迷玩家体验。</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
