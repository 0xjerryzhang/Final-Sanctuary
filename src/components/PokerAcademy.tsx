/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Target,
  Coins,
  ShieldAlert,
} from 'lucide-react';

// Mini Poker Card Component for realistic visual rendering
const MiniCard: React.FC<{ cardStr: string }> = ({ cardStr }) => {
  const suit = cardStr.slice(-1);
  const val = cardStr.slice(0, -1);
  const isRed = suit === '♥' || suit === '♦';

  return (
    <div
      className={`w-6 h-8 sm:w-6.5 sm:h-8.5 rounded-md border flex flex-col items-center justify-between p-0.5 font-mono text-[10px] font-black leading-none shrink-0 shadow-sm transition-transform hover:scale-105 ${
        isRed
          ? 'border-rose-500/60 text-rose-300 bg-gradient-to-b from-rose-950/50 to-slate-950'
          : 'border-cyan-400/60 text-cyan-200 bg-gradient-to-b from-slate-900 to-slate-950'
      }`}
    >
      <span className="self-start text-[8px] sm:text-[9px] opacity-90">{val}</span>
      <span className="text-[10px] sm:text-[11px] font-sans">{suit}</span>
    </div>
  );
};

export const PokerAcademy: React.FC = () => {
  const handRankings = [
    {
      rank: 1,
      name: '皇家同花顺',
      english: 'Royal Flush',
      desc: '同花色 A-K-Q-J-10，绝无仅有最高牌型！',
      cards: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'],
      badge: '至尊绝煞',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    },
    {
      rank: 2,
      name: '同花顺',
      english: 'Straight Flush',
      desc: '同一花色连续5张牌（如 9-8-7-6-5 ♥）。',
      cards: ['9♥', '8♥', '7♥', '6♥', '5♥'],
      badge: '罕见神牌',
      badgeColor: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/40',
    },
    {
      rank: 3,
      name: '四条 (金刚)',
      english: 'Four of a Kind',
      desc: '4张点数相同 + 1张单牌。',
      cards: ['K♣', 'K♦', 'K♠', 'K♥', '9♠'],
      badge: '毁灭打击',
      badgeColor: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
    },
    {
      rank: 4,
      name: '葫芦 (满堂红)',
      english: 'Full House',
      desc: '3张同点数 + 2张同点数对子。',
      cards: ['10♠', '10♥', '10♦', '7♣', '7♠'],
      badge: '稳如泰山',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    },
    {
      rank: 5,
      name: '同花',
      english: 'Flush',
      desc: '5张同花色但点数不连续。',
      cards: ['A♦', 'J♦', '8♦', '5♦', '2♦'],
      badge: '深不可测',
      badgeColor: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40',
    },
    {
      rank: 6,
      name: '顺子',
      english: 'Straight',
      desc: '5张点数连续但花色不同。',
      cards: ['8♠', '7♥', '6♦', '5♣', '4♠'],
      badge: '连绵不绝',
      badgeColor: 'bg-sky-400/20 text-sky-300 border-sky-400/40',
    },
    {
      rank: 7,
      name: '三条',
      english: 'Three of a Kind',
      desc: '3张同点数 + 2张单牌。',
      cards: ['Q♠', 'Q♦', 'Q♣', 'A♥', '4♠'],
      badge: '暗藏杀机',
      badgeColor: 'bg-violet-400/20 text-violet-300 border-violet-400/40',
    },
    {
      rank: 8,
      name: '两对',
      english: 'Two Pair',
      desc: '2个不同点数对子 + 1张单牌。',
      cards: ['J♠', 'J♥', '5♣', '5♦', '9♠'],
      badge: '实用实干',
      badgeColor: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
    },
    {
      rank: 9,
      name: '一对',
      english: 'One Pair',
      desc: '1个对子 + 3张不凑对单牌。',
      cards: ['A♠', 'A♣', 'K♦', '8♠', '3♥'],
      badge: '入门兵刃',
      badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    },
    {
      rank: 10,
      name: '高牌 (乌龙)',
      english: 'High Card',
      desc: '无凑对牌型，单凭最大牌比大小。',
      cards: ['A♠', 'Q♦', '9♣', '6♥', '2♠'],
      badge: '基础牌型',
      badgeColor: 'bg-slate-700/30 text-slate-400 border-slate-700/50',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-2.5">
      {/* Main 2-Column Content Layout */}
      <div className="w-full max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
          
          {/* LEFT COLUMN: 规则与流程 */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2.5 flex flex-col items-center"
          >
            {/* Core Goal Box */}
            <div className="w-full bg-gradient-to-br from-cyan-950/80 via-slate-950 to-purple-950/80 border border-cyan-400/40 p-3 rounded-2xl shadow-lg text-center">
              <h4 className="font-black text-xs text-cyan-300 font-mono mb-1 flex items-center justify-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>核心获胜规则 (Core Goal)</span>
              </h4>
              <p className="text-[11px] text-slate-200 leading-relaxed text-center">
                每人分得 <strong className="text-cyan-300">2张底牌</strong>，与桌面上公共发出的 <strong className="text-purple-300">5张公共牌</strong> 组合。在7张牌中选出最强 <strong className="text-amber-300">5张组合</strong> 比大小；或通过压注逼退对手赢底池！
              </p>
            </div>

            {/* 4 Round Steps */}
            <div className="w-full bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-2 text-center">
              <h5 className="text-[11px] font-black text-slate-300 font-mono flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                <span>4大下注轮次 (Betting Rounds)</span>
              </h5>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                  <div className="flex items-center gap-1 mb-1 justify-center sm:justify-start">
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black font-mono flex items-center justify-center shrink-0">
                      1
                    </span>
                    <strong className="text-[11px] text-white">翻牌前 Pre-Flop</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight text-center sm:text-left">
                    发2张专属底牌，盲注建立后展开首轮下注。
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                  <div className="flex items-center gap-1 mb-1 justify-center sm:justify-start">
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black font-mono flex items-center justify-center shrink-0">
                      2
                    </span>
                    <strong className="text-[11px] text-white">翻牌圈 Flop</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight text-center sm:text-left">
                    发前3张公共牌，牌型雏形初现展开试探。
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                  <div className="flex items-center gap-1 mb-1 justify-center sm:justify-start">
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black font-mono flex items-center justify-center shrink-0">
                      3
                    </span>
                    <strong className="text-[11px] text-white">转牌圈 Turn</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight text-center sm:text-left">
                    发第4张公共牌，听牌成本升高，激战升级。
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                  <div className="flex items-center gap-1 mb-1 justify-center sm:justify-start">
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black font-mono flex items-center justify-center shrink-0">
                      4
                    </span>
                    <strong className="text-[11px] text-white">河牌圈 Showdown</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight text-center sm:text-left">
                    发第5张公共牌，终局摊牌亮底牌决胜负。
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Standard Actions */}
            <div className="w-full bg-slate-950/90 border border-cyan-500/20 p-2.5 rounded-2xl text-center">
              <h5 className="text-[11px] font-black text-cyan-300 font-mono mb-1.5 flex items-center justify-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>5种标准操作动作 (Player Actions)</span>
              </h5>
              <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px]">
                <div className="bg-white/5 p-1 rounded-lg border border-white/10">
                  <strong className="text-cyan-300 block">过牌</strong>
                  <span className="text-slate-400 scale-90 block">Check</span>
                </div>
                <div className="bg-white/5 p-1 rounded-lg border border-white/10">
                  <strong className="text-emerald-300 block">跟注</strong>
                  <span className="text-slate-400 scale-90 block">Call</span>
                </div>
                <div className="bg-white/5 p-1 rounded-lg border border-white/10">
                  <strong className="text-amber-300 block">加注</strong>
                  <span className="text-slate-400 scale-90 block">Raise</span>
                </div>
                <div className="bg-white/5 p-1 rounded-lg border border-white/10">
                  <strong className="text-rose-400 block">弃牌</strong>
                  <span className="text-slate-400 scale-90 block">Fold</span>
                </div>
                <div className="bg-white/5 p-1 rounded-lg border border-white/10">
                  <strong className="text-fuchsia-300 block">全押</strong>
                  <span className="text-slate-400 scale-90 block">All-In</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: 10大牌型排行榜 (Centered Header) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1.5 flex flex-col items-center"
          >
            {/* Column Header */}
            <div className="w-full bg-slate-900/90 border border-cyan-500/40 py-1.5 px-4 rounded-xl text-center flex items-center justify-center gap-2 shadow-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-cyan-300 tracking-wider">
                10大牌型排行榜 (强弱从高到低)
              </h3>
            </div>

            {/* Hand Rankings List */}
            <div className="w-full space-y-1.5">
              {handRankings.map((hr) => (
                <div
                  key={hr.rank}
                  className="p-1.5 sm:p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-black/60 border border-white/20 text-cyan-300 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                      #{hr.rank}
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-black text-[11px] sm:text-xs text-white truncate">
                          {hr.name}
                        </h5>
                        <span
                          className={`text-[8px] font-mono px-1 py-0.2 rounded border ${hr.badgeColor}`}
                        >
                          {hr.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {hr.desc}
                      </p>
                    </div>
                  </div>

                  {/* Visual Poker Cards */}
                  <div className="flex items-center gap-0.5 shrink-0 pl-1">
                    {hr.cards.map((c, i) => (
                      <MiniCard key={i} cardStr={c} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

