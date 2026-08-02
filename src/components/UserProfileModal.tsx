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
import { triggerHaptic } from '../utils/haptics';
import { iosAudio } from '../utils/iosAudio';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
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
  const [avatar, setAvatar] = useState<string>(() => {
    try {
      return localStorage.getItem('jj_user_avatar') || DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  // Form Inputs for Auth
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDailyCheckin = async () => {
    if (!userId) {
      setFeedback({ type: 'error', msg: '请先完成登录后再领取每日签到奖励！' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/user/checkin', {
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

      const res = await fetch('/api/user/auth', {
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
          setAvatar(json.user.avatar || DEFAULT_AVATAR);
          setChips(typeof json.user.chips === 'number' ? json.user.chips : 10000);
          setWins(json.user.wins || 0);
          setLosses(json.user.losses || 0);

          try {
            if (json.user.id) localStorage.setItem('jj_user_id', json.user.id);
            if (json.user.email) localStorage.setItem('jj_user_email', json.user.email);
            if (json.user.nickname) localStorage.setItem('jj_user_nickname', json.user.nickname);
            if (json.user.avatar) localStorage.setItem('jj_user_avatar', json.user.avatar);
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

    setIsLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/user/register' : '/api/user/login';
      const body = authMode === 'register'
        ? { email: formEmail, password: formPassword, nickname, avatar, currentUserId: userId }
        : { email: formEmail, password: formPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok && json.success && json.user) {
        setUserId(json.user.id);
        setUserEmail(json.user.email || formEmail);
        setNickname(json.user.nickname || nickname);
        setAvatar(json.user.avatar || avatar);
        setChips(typeof json.user.chips === 'number' ? json.user.chips : 10000);
        setWins(json.user.wins || 0);
        setLosses(json.user.losses || 0);

        try {
          localStorage.setItem('jj_user_id', json.user.id);
          localStorage.setItem('jj_user_email', json.user.email || formEmail);
          localStorage.setItem('jj_user_nickname', json.user.nickname);
          localStorage.setItem('jj_user_avatar', json.user.avatar);
        } catch {}

        wsService.initUser(json.user.id, json.user.nickname, json.user.avatar, json.user.chips);

        setFeedback({ type: 'success', msg: json.message || '验证成功！已接入个人中心' });
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
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nickname,
          avatar,
          email: userEmail,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.user) {
          try {
            localStorage.setItem('jj_user_nickname', json.user.nickname);
            localStorage.setItem('jj_user_avatar', json.user.avatar);
          } catch {}
          wsService.initUser(json.user.id, json.user.nickname, json.user.avatar, json.user.chips);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2500);
        }
      }
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  // Logout / Switch Account
  const handleLogout = () => {
    setUserEmail('');
    try {
      localStorage.removeItem('jj_user_email');
    } catch {}
    setFormEmail('');
    setFormPassword('');
    setFeedback({ type: 'success', msg: '已成功退出当前账号登录' });
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
          className="relative w-full max-w-md bg-[#0e0422] border-2 border-purple-500/60 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.5)] overflow-hidden flex flex-col text-white max-h-[92vh]"
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

              {/* Divider & Sign in with Apple (Mandatory for iOS App Store Guidelines Section 4.8) */}
              <div className="relative my-1 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/30"></div>
                </div>
                <span className="relative bg-[#0e0422] px-3 text-[10px] text-purple-300/80 font-mono">
                  或使用 iOS 快捷身份认证
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (authMode === 'register' && !hasAgreedAntiGambling) {
                    setFeedback({ type: 'error', msg: '⚠️ 注册前请先阅读并勾选同意《绿色游戏与严禁赌博公约》！' });
                    triggerHaptic('warning');
                    return;
                  }
                  setIsLoading(true);
                  setTimeout(() => {
                    const appleEmail = 'apple.user@icloud.com';
                    setUserEmail(appleEmail);
                    try {
                      localStorage.setItem('jj_user_email', appleEmail);
                    } catch {}
                    setIsLoading(false);
                    setFeedback({ type: 'success', msg: ' Apple ID 身份认证成功！已成功登录' });
                  }, 800);
                }}
                className="w-full py-3 rounded-xl bg-white text-black font-black text-xs shadow-lg hover:bg-gray-100 transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-300"
              >
                <span className="text-base leading-none"></span>
                <span>通过 Apple 账号快速登录 (Sign in with Apple)</span>
              </button>
            </div>
          ) : (
            /* LAYER 2: LOGGED IN -> Unlocks Personal Center (Avatar, Nickname, Stats, Logout) */
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Account Card & Custom Avatar Upload */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-950 border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Interactive Custom Avatar Upload Circle */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group w-14 h-14 rounded-full overflow-hidden border-2 border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.6)] cursor-pointer shrink-0"
                  >
                    <img src={avatar} alt={nickname} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-bold text-white">
                      <Camera className="w-4 h-4 text-fuchsia-300 mb-0.5" />
                      <span>更换头像</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-black text-base text-white flex items-center gap-1.5">
                      <span>{nickname}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-[10px] font-mono text-emerald-300 mt-0.5 flex items-center gap-1">
                      <span>📧 {userEmail}</span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-400">ID: {userId || '已连线'}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-purple-300">圣所音符</div>
                  <div className="text-base font-black text-amber-300 flex items-center justify-end gap-1">
                    <Music className="w-4 h-4 text-fuchsia-400" />
                    <span>{(chips ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Daily Sign-In Card (+3,270 Sanctuary Notes) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/90 via-fuchsia-950/80 to-slate-950 border border-fuchsia-500/50 flex items-center justify-between shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-fuchsia-300" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-white flex items-center gap-1.5">
                      <span>每日领签到礼</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        +3,270 音符
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-300/80 mt-0.5">
                      每天登录即可免费领取 3,270 圣所音符
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hasCheckedInToday || isLoading}
                  onClick={handleDailyCheckin}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
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

              {/* Recharge Entrance Disabled / Anti-gambling Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-rose-200 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-400" />
                    <span>充值中心 (暂不开放)</span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-300/80 mt-0.5">
                    绿色游戏倡导，全场暂不设立任何充值及变现入口
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold shrink-0">
                  纯免费体验
                </span>
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
