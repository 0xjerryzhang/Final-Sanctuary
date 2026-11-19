/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Radio,
  Swords,
  X,
  Play,
  Plus,
  Zap,
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { wsService, ServerStats, LobbyRoom } from '../services/websocket';
import { JJ_ALBUM_STAGES, AlbumStage, formatCompactChips } from '../data/albumStages';
import { getApiUrl } from '../utils/apiConfig';

interface MatchmakingLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineGame: (stage: AlbumStage, roomData?: any) => void;
  defaultStage?: AlbumStage;
}

export const MatchmakingLobbyModal: React.FC<MatchmakingLobbyModalProps> = ({
  isOpen,
  onClose,
  onStartOnlineGame,
  defaultStage = JJ_ALBUM_STAGES[0],
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'rooms' | 'room_view'>('quick');
  const [stats, setStats] = useState<ServerStats>({ onlinePlayers: 1, activeRooms: 0, queueLength: 0 });
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [queueTimer, setQueueTimer] = useState(0);

  // Custom room creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('圣所竞技桌');
  const [selectedStage, setSelectedStage] = useState<AlbumStage>(defaultStage);

  // Current inside room state
  const [currentRoomData, setCurrentRoomData] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ senderName: string; text: string; id: string }>>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isOpen && defaultStage) {
      setSelectedStage(defaultStage);
    }
  }, [isOpen, defaultStage]);

  useEffect(() => {
    if (!isOpen) return;

    wsService.connect();

    const unsubscribe = wsService.subscribe((event) => {
      const { type, data } = event;

      if (type === 'STATS_UPDATE' && data) {
        setStats(data);
        fetchOnlineRooms();
      } else if (type === 'QUEUE_STATUS' && data) {
        setInQueue(data.inQueue);
      } else if (type === 'MATCH_FOUND' && data) {
        setInQueue(false);
        setCurrentRoomData(data);
        setActiveTab('room_view');
      } else if (type === 'ROOM_JOINED' || type === 'ROOM_UPDATED') {
        if (data) {
          setCurrentRoomData(data);
          setActiveTab('room_view');
          const me = data.players?.find((p: any) => p.id === wsService.playerId);
          if (me) setIsReady(!!me.isReady);
        }
      } else if (type === 'NEW_CHAT_MESSAGE' && data) {
        setChatMessages((prev) => [...prev, data]);
      } else if (type === 'PLAYER_READY_CHANGED' && data) {
        if (data.playerId === wsService.playerId) {
          setIsReady(data.isReady);
        }
        setCurrentRoomData((prev: any) => {
          if (!prev) return prev;
          if (data.players) {
            return { ...prev, players: data.players };
          }
          const updatedPlayers = prev.players.map((p: any) =>
            p.id === data.playerId ? { ...p, isReady: data.isReady } : p
          );
          return { ...prev, players: updatedPlayers };
        });
      } else if (type === 'GAME_STARTED' && data) {
        const stage = JJ_ALBUM_STAGES.find((s) => s.id === data.stageId) || selectedStage;
        onStartOnlineGame(stage, data);
        onClose();
      }
    });

    fetchOnlineRooms();

    return () => {
      unsubscribe();
    };
  }, [isOpen, selectedStage]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (inQueue) {
      setQueueTimer(0);
      interval = setInterval(() => {
        setQueueTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setQueueTimer(0);
    }
    return () => clearInterval(interval);
  }, [inQueue]);

  const fetchOnlineRooms = async () => {
    try {
      const res = await fetch(getApiUrl('/api/online-stats'));
      if (res.ok) {
        const json = await res.json();
        setStats({
          onlinePlayers: json.onlinePlayers || 1,
          activeRooms: json.activeRooms || 0,
          queueLength: json.queueLength || 0,
        });
        if (json.rooms) setRooms(json.rooms);
      }
    } catch (e) {
      console.warn('Failed to fetch stats', e);
    }
  };

  const handleStartQuickMatch = () => {
    if (inQueue) {
      wsService.leaveMatchmaking();
      setInQueue(false);
    } else {
      wsService.joinMatchmaking(selectedStage.id);
      setInQueue(true);
    }
  };

  const handleInstantCreateAndBotFill = () => {
    if (inQueue) {
      wsService.leaveMatchmaking();
      setInQueue(false);
    }
    wsService.createRoom(`${selectedStage.shortTitle} · 极速桌`, selectedStage.id, 5);
    setTimeout(() => {
      wsService.startOnlineGame(true);
    }, 250);
  };

  const handleCreateRoom = () => {
    wsService.createRoom(customRoomName, selectedStage.id, 5);
    setShowCreateModal(false);
  };

  const handleJoinRoom = (roomId: string) => {
    wsService.joinRoom(roomId);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    wsService.sendChat(chatInput.trim());
    setChatInput('');
  };

  const handleToggleReady = () => {
    wsService.toggleReady();
  };

  const handleStartTable = (fillWithBots: boolean) => {
    wsService.startOnlineGame(fillWithBots);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-3xl bg-[#0e0422] border-2 border-purple-500/60 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.5)] overflow-hidden flex flex-col text-white max-h-[90dvh]"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-purple-500/30 bg-slate-950/80 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.8)] shrink-0">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-base text-white whitespace-nowrap truncate">
                  实时联机大厅
                </h2>
                <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300/80 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    在线 <strong className="text-emerald-300">{stats.onlinePlayers}</strong>
                  </span>
                  <span>·</span>
                  <span>牌桌 <strong className="text-amber-300">{stats.activeRooms}</strong></span>
                  <span>·</span>
                  <span>队列 <strong className="text-fuchsia-300">{stats.queueLength}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 hover:bg-purple-900 text-purple-300 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* MAIN NAVIGATION TABS */}
          <div className="flex items-center justify-between gap-2 px-5 py-2 bg-black/40 border-b border-purple-500/20 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('quick')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'quick'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)]'
                    : 'text-purple-300 hover:bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>快速匹配</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('rooms');
                  fetchOnlineRooms();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'rooms'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)]'
                    : 'text-purple-300 hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
                <span>房间列表 ({rooms.length})</span>
              </button>

              {currentRoomData && (
                <button
                  onClick={() => setActiveTab('room_view')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'room_view'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(52,211,153,0.7)]'
                      : 'text-emerald-300 hover:bg-white/5 border border-emerald-500/30'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>当前房间 ({currentRoomData.players?.length || 1}/5)</span>
                </button>
              )}
            </div>

            <button
              onClick={fetchOnlineRooms}
              className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/30 hover:border-purple-300 text-purple-300 hover:text-white transition-all cursor-pointer shrink-0"
              title="刷新列表"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB 1: QUICK MATCHMAKING */}
          {activeTab === 'quick' && (
            <div className="p-6 flex flex-col items-center justify-center my-auto gap-4 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-amber-400 p-1 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.7)] animate-pulse">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  {inQueue ? (
                    <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />
                  ) : (
                    <Zap className="w-10 h-10 text-amber-300" />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-mono text-amber-300 whitespace-nowrap">
                  <span>{selectedStage.icon}</span>
                  <span>{selectedStage.name} · 盲注 {selectedStage.blindLabel}</span>
                </div>
                <h3 className="text-lg font-black text-white whitespace-nowrap">
                  {inQueue ? `匹配搜索中 00:${queueTimer < 10 ? `0${queueTimer}` : queueTimer}` : '极速真人匹配'}
                </h3>
                <p className="text-xs text-purple-200/80 font-mono whitespace-nowrap">
                  {inQueue ? '满 2 名真人即刻开局' : '服务端洗牌发牌 · 实时边池结算'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-md justify-center">
                <button
                  onClick={handleStartQuickMatch}
                  className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                    inQueue
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:brightness-110'
                      : 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 text-white hover:scale-102'
                  }`}
                >
                  {inQueue ? (
                    <>
                      <X className="w-4 h-4 shrink-0" />
                      <span>取消匹配</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-amber-300 shrink-0" />
                      <span>开始快速匹配</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleInstantCreateAndBotFill}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-950/90 border border-purple-400/60 hover:border-amber-400 text-purple-100 hover:text-white font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
                >
                  <Bot className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>立即建房开局 (AI补位)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ROOM LOBBY LIST */}
          {activeTab === 'rooms' && (
            <div className="p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[460px] no-scrollbar">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-purple-300 font-bold whitespace-nowrap">
                  公开牌桌 ({rooms.length})
                </span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>创建房间</span>
                </button>
              </div>

              {rooms.length === 0 ? (
                <div className="p-10 text-center bg-slate-950/60 border border-purple-500/20 rounded-2xl">
                  <Radio className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-60 animate-pulse" />
                  <p className="text-xs font-bold text-purple-200 whitespace-nowrap">暂无公开房间，点击右上角创建</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rooms.map((r) => {
                    const stage = JJ_ALBUM_STAGES.find((s) => s.id === r.stageId) || JJ_ALBUM_STAGES[0];
                    return (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 hover:border-fuchsia-400 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base shrink-0">{stage.icon}</span>
                            <h4 className="font-black text-xs sm:text-sm text-white truncate whitespace-nowrap">{r.name}</h4>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0 ${
                                r.status === 'PLAYING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {r.status === 'PLAYING' ? '进行中' : '等待中'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-purple-300 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30">
                              {stage.shortTitle} · {stage.blindLabel}
                            </span>
                            <span>
                              座位 <strong className="text-amber-300">{r.playerCount}/{r.maxPlayers}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoinRoom(r.id)}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-fuchsia-600 text-white text-xs font-black shadow transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          加入
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CURRENT ROOM VIEW & CHAT */}
          {activeTab === 'room_view' && currentRoomData && (
            <div className="p-5 flex flex-col md:flex-row gap-4">
              {/* Left Player Seat List */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-white truncate whitespace-nowrap">{currentRoomData.roomName}</h3>
                    <span className="text-[10px] font-mono text-purple-300 whitespace-nowrap block">
                      房号 {currentRoomData.roomId} · 2人准备自动开局
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 whitespace-nowrap shrink-0">
                    {currentRoomData.players?.length || 1}/5 在座
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {currentRoomData.players?.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-center gap-2 min-w-0"
                    >
                      {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('data:image')) ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover border border-fuchsia-400 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-950 border border-fuchsia-400 flex items-center justify-center text-sm shrink-0">
                          {p.avatar || '🎤'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black truncate whitespace-nowrap">{p.name}</div>
                        <div className="text-[10px] font-mono text-amber-300 whitespace-nowrap">
                          🪙 {formatCompactChips(p.chips)}
                        </div>
                      </div>
                      {p.isReady ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" title="已准备" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" title="未准备" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      isReady
                        ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                        : 'bg-purple-950 border border-purple-500/50 text-purple-200 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{isReady ? '已准备' : '点击准备'}</span>
                  </button>

                  {currentRoomData.players?.length >= 2 && (
                    <button
                      onClick={() => handleStartTable(false)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 text-white font-black text-xs shadow-lg hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>立即开局</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStartTable(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white font-black text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Bot className="w-4 h-4 shrink-0" />
                    <span>AI补位开局</span>
                  </button>
                </div>
              </div>

              {/* Right Realtime Chatbox */}
              <div className="w-full md:w-72 flex flex-col bg-slate-950/90 border border-purple-500/30 rounded-2xl p-3 h-56 md:h-72 shrink-0">
                <div className="text-xs font-mono font-bold text-purple-300 pb-2 border-b border-purple-500/20 flex items-center gap-1.5 whitespace-nowrap">
                  <MessageSquare className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                  <span>房间聊天</span>
                </div>

                <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1.5 no-scrollbar text-xs">
                  {chatMessages.length === 0 ? (
                    <span className="text-[11px] font-mono text-slate-500 text-center my-auto whitespace-nowrap">
                      发送消息与牌友互动
                    </span>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-purple-950/40 border border-purple-500/20 rounded-lg p-1.5">
                        <span className="font-bold text-fuchsia-300 mr-1">{msg.senderName}:</span>
                        <span className="text-purple-100">{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-1.5 pt-2 border-t border-purple-500/20">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 min-w-0 bg-black/60 border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-400 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-fuchsia-600 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    发送
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CREATE ROOM MODAL OVERLAY */}
          {showCreateModal && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-5">
              <div className="w-full max-w-sm bg-[#12052c] border-2 border-fuchsia-500/60 rounded-3xl p-5 flex flex-col gap-3.5 text-white shadow-2xl max-h-[88dvh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-2.5">
                  <h3 className="font-black text-sm flex items-center gap-1.5 whitespace-nowrap">
                    <Plus className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <span>创建自定牌桌</span>
                  </h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">房间名称</label>
                  <input
                    type="text"
                    value={customRoomName}
                    onChange={(e) => setCustomRoomName(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">专辑盲注场次</label>
                  <select
                    value={selectedStage.id}
                    onChange={(e) => {
                      const st = JJ_ALBUM_STAGES.find((s) => s.id === e.target.value);
                      if (st) setSelectedStage(st);
                    }}
                    className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                  >
                    {JJ_ALBUM_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · 盲注 {s.blindLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-xs shadow-lg hover:brightness-110 cursor-pointer whitespace-nowrap"
                  >
                    确认创建
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
