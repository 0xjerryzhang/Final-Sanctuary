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

const MiniCard: React.FC<{ cardStr: string }> = ({ cardStr }) => {
  const suit = cardStr.slice(-1);
  const val = cardStr.slice(0, -1);
  const isRed = suit === '♥' || suit === '♦';

  return (
    <div
      className={`w-6 h-8.5 rounded-md border border-slate-300 bg-white flex flex-col items-center justify-between p-0.5 font-mono text-[10px] font-black leading-none shrink-0 shadow-sm ${
        isRed ? 'text-[#DC2626]' : 'text-[#0F172A]'
      }`}
    >
      <span className="self-start text-[9px] font-black tracking-tighter tabular-nums">{val}</span>
      <span className="text-xs font-sans leading-none">{suit}</span>
    </div>
  );
};

export const PokerAcademy: React.FC = () => {
  const handRankings = [
    {
      rank: 1,
      name: '皇家同花顺',
      desc: '同花色 A-K-Q-J-10',
      cards: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'],
      badge: '至尊',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    },
    {
      rank: 2,
      name: '同花顺',
      desc: '同花色连续 5 张牌',
      cards: ['9♥', '8♥', '7♥', '6♥', '5♥'],
      badge: '神牌',
      badgeColor: 'bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/40',
    },
    {
      rank: 3,
      name: '四条',
      desc: '4 张同点数 + 1 张单牌',
      cards: ['K♣', 'K♦', 'K♠', 'K♥', '9♠'],
      badge: '金刚',
      badgeColor: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
    },
    {
      rank: 4,
      name: '葫芦',
      desc: '3 张同点数 + 1 个对子',
      cards: ['10♠', '10♥', '10♦', '7♣', '7♠'],
      badge: '满堂红',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    },
    {
      rank: 5,
      name: '同花',
      desc: '5 张同花色非连牌',
      cards: ['A♦', 'J♦', '8♦', '5♦', '2♦'],
      badge: '强牌',
      badgeColor: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40',
    },
    {
      rank: 6,
      name: '顺子',
      desc: '5 张不同花色连牌',
      cards: ['8♠', '7♥', '6♦', '5♣', '4♠'],
      badge: '连牌',
      badgeColor: 'bg-sky-400/20 text-sky-300 border-sky-400/40',
    },
    {
      rank: 7,
      name: '三条',
      desc: '3 张同点数 + 2 张单牌',
      cards: ['Q♠', 'Q♦', 'Q♣', 'A♥', '4♠'],
      badge: '暗三',
      badgeColor: 'bg-violet-400/20 text-violet-300 border-violet-400/40',
    },
    {
      rank: 8,
      name: '两对',
      desc: '2 个对子 + 1 张单牌',
      cards: ['J♠', 'J♥', '5♣', '5♦', '9♠'],
      badge: '实用',
      badgeColor: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
    },
    {
      rank: 9,
      name: '一对',
      desc: '1 个对子 + 3 张单牌',
      cards: ['A♠', 'A♣', 'K♦', '8♠', '3♥'],
      badge: '常见',
      badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    },
    {
      rank: 10,
      name: '高牌',
      desc: '无凑对，比最大单牌',
      cards: ['A♠', 'Q♦', '9♣', '6♥', '2♠'],
      badge: '基础',
      badgeColor: 'bg-slate-700/30 text-slate-400 border-slate-700/50',
    },
  ];

  return (
    <div className="w-full py-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2.5 flex flex-col"
          >
            {/* Core Goal Box */}
            <div className="w-full bg-gradient-to-br from-cyan-950/80 via-slate-950 to-purple-950/80 border border-cyan-400/40 p-3 rounded-2xl shadow-lg">
              <h4 className="font-black text-xs text-cyan-300 font-mono mb-1 flex items-center gap-1.5 whitespace-nowrap">
                <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>核心获胜规则</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                <strong className="text-cyan-300">2 张底牌</strong> + <strong className="text-purple-300">5 张公共牌</strong>，7 选 5 组成最强牌型获胜。
              </p>
            </div>

            {/* 4 Round Steps */}
            <div className="w-full bg-slate-950/90 border border-slate-800 p-3 rounded-2xl space-y-2">
              <h5 className="text-xs font-black text-slate-300 font-mono flex items-center gap-1.5 whitespace-nowrap">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>四大下注轮次</span>
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { step: '1', title: '翻牌前 PreFlop', sub: '发 2 张底牌首轮下注' },
                  { step: '2', title: '翻牌圈 Flop', sub: '发出前 3 张公共牌' },
                  { step: '3', title: '转牌圈 Turn', sub: '发出第 4 张公共牌' },
                  { step: '4', title: '河牌圈 River', sub: '发出第 5 张牌并摊牌' },
                ].map((item) => (
                  <div key={item.step} className="bg-white/5 border border-white/10 p-2 rounded-xl min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 whitespace-nowrap">
                      <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black font-mono flex items-center justify-center shrink-0">
                        {item.step}
                      </span>
                      <strong className="text-[11px] text-white truncate">{item.title}</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate whitespace-nowrap">
                      {item.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5 Standard Actions */}
            <div className="w-full bg-slate-950/90 border border-cyan-500/20 p-2.5 rounded-2xl">
              <h5 className="text-xs font-black text-cyan-300 font-mono mb-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>五种标准动作</span>
              </h5>
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px] whitespace-nowrap">
                <div className="bg-white/5 py-1.5 px-1 rounded-lg border border-white/10">
                  <strong className="text-cyan-300 block">过牌</strong>
                  <span className="text-slate-400 text-[9px] block">Check</span>
                </div>
                <div className="bg-white/5 py-1.5 px-1 rounded-lg border border-white/10">
                  <strong className="text-emerald-300 block">跟注</strong>
                  <span className="text-slate-400 text-[9px] block">Call</span>
                </div>
                <div className="bg-white/5 py-1.5 px-1 rounded-lg border border-white/10">
                  <strong className="text-amber-300 block">加注</strong>
                  <span className="text-slate-400 text-[9px] block">Raise</span>
                </div>
                <div className="bg-white/5 py-1.5 px-1 rounded-lg border border-white/10">
                  <strong className="text-rose-400 block">弃牌</strong>
                  <span className="text-slate-400 text-[9px] block">Fold</span>
                </div>
                <div className="bg-white/5 py-1.5 px-1 rounded-lg border border-white/10">
                  <strong className="text-fuchsia-300 block">全押</strong>
                  <span className="text-slate-400 text-[9px] block">All-In</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1.5 flex flex-col"
          >
            <div className="w-full bg-slate-900/90 border border-cyan-500/40 py-1.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md whitespace-nowrap">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-xs font-black text-cyan-300 tracking-wider">
                牌型大小排行 (由高到低)
              </h3>
            </div>

            <div className="w-full space-y-1.5">
              {handRankings.map((hr) => (
                <div
                  key={hr.rank}
                  className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-black/60 border border-white/20 text-cyan-300 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                      #{hr.rank}
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <h5 className="font-black text-xs text-white truncate">
                          {hr.name}
                        </h5>
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${hr.badgeColor}`}>
                          {hr.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate whitespace-nowrap mt-0.5">
                        {hr.desc}
                      </p>
                    </div>
                  </div>

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
  );
};
