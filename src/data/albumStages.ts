/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AlbumStage {
  id: string;
  year: number;
  name: string;          // Album title e.g. 《乐行者》
  shortTitle: string;    // Short title e.g. 乐行者
  subtitle: string;      // Concise hit songs / concept
  description: string;   // Concise one-line summary
  blindLabel: string;    // Formatted blind string e.g. "0.5K/1K"
  smallBlind: number;    // Small blind amount
  bigBlind: number;      // Big blind amount
  startChips: number;    // Initial buy-in chips (100 BB)
  badgeText: string;     // Compact level badge e.g. "2003 · NO.01"
  themeGradient: string; // Tailwind gradient background
  borderColor: string;   // Border class
  borderGlow: string;    // Shadow glow class
  badgeColor: string;    // Badge background color
  textColor: string;     // Text accent color
  icon: string;          // Icon emoji
}

/**
 * Formats chip / blind numbers into compact K / M / B notation without wrapping.
 * Examples: 500 -> "0.5K", 1000 -> "1K", 2500 -> "2.5K", 1000000 -> "1M", 25000000 -> "25M"
 */
export function formatCompactChips(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return '0';
  const num = Number(amount);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    const b = abs / 1_000_000_000;
    const str = Number.isInteger(b) ? b.toString() : parseFloat(b.toFixed(2)).toString();
    return `${sign}${str}B`;
  }
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    const str = Number.isInteger(m) ? m.toString() : parseFloat(m.toFixed(2)).toString();
    return `${sign}${str}M`;
  }
  if (abs >= 500) {
    const k = abs / 1_000;
    const str = Number.isInteger(k) ? k.toString() : parseFloat(k.toFixed(2)).toString();
    return `${sign}${str}K`;
  }
  return `${sign}${Math.round(abs)}`;
}

export const JJ_ALBUM_STAGES: AlbumStage[] = [
  {
    id: 'music_voyager',
    year: 2003,
    name: '《乐行者》',
    shortTitle: '乐行者',
    subtitle: '《就是我》《翅膀》',
    description: '出道首专 · 纯粹初心',
    blindLabel: '0.5K/1K',
    smallBlind: 500,
    bigBlind: 1000,
    startChips: 100000,
    badgeText: '2003 · NO.01',
    themeGradient: 'from-emerald-950/80 to-slate-950/95',
    borderColor: 'border-emerald-400/80 hover:border-emerald-300',
    borderGlow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]',
    badgeColor: 'bg-emerald-400 text-slate-950',
    textColor: 'text-emerald-300',
    icon: '🎸',
  },
  {
    id: 'haven_jiangnan',
    year: 2004,
    name: '《第二天堂》',
    shortTitle: '第二天堂',
    subtitle: '《江南》《美人鱼》',
    description: '国风R&B · 经典巅峰',
    blindLabel: '1K/2K',
    smallBlind: 1000,
    bigBlind: 2000,
    startChips: 200000,
    badgeText: '2004 · NO.02',
    themeGradient: 'from-teal-950/80 to-slate-950/95',
    borderColor: 'border-teal-400/80 hover:border-teal-300',
    borderGlow: 'shadow-[0_0_20px_rgba(45,212,191,0.3)]',
    badgeColor: 'bg-teal-400 text-slate-950',
    textColor: 'text-teal-300',
    icon: '🌊',
  },
  {
    id: 'no89757',
    year: 2005,
    name: '《编号89757》',
    shortTitle: '编号89757',
    subtitle: '《一千年以后》《木乃伊》',
    description: '超时空科幻概念',
    blindLabel: '2.5K/5K',
    smallBlind: 2500,
    bigBlind: 5000,
    startChips: 500000,
    badgeText: '2005 · NO.03',
    themeGradient: 'from-cyan-950/80 to-slate-950/95',
    borderColor: 'border-cyan-400/80 hover:border-cyan-300',
    borderGlow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    badgeColor: 'bg-cyan-400 text-slate-950',
    textColor: 'text-cyan-300',
    icon: '🤖',
  },
  {
    id: 'caocao',
    year: 2006,
    name: '《曹操》',
    shortTitle: '曹操',
    subtitle: '《曹操》《不死之身》',
    description: '摇滚霸气 · 三国豪情',
    blindLabel: '5K/10K',
    smallBlind: 5000,
    bigBlind: 10000,
    startChips: 1000000,
    badgeText: '2006 · NO.04',
    themeGradient: 'from-amber-950/80 to-slate-950/95',
    borderColor: 'border-amber-400/80 hover:border-amber-300',
    borderGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',
    badgeColor: 'bg-amber-400 text-slate-950',
    textColor: 'text-amber-300',
    icon: '⚔️',
  },
  {
    id: 'west_side',
    year: 2007,
    name: '《西界》',
    shortTitle: '西界',
    subtitle: '《杀手》《西界》',
    description: '暗黑美学 · 心理博弈',
    blindLabel: '10K/20K',
    smallBlind: 10000,
    bigBlind: 20000,
    startChips: 2000000,
    badgeText: '2007 · NO.05',
    themeGradient: 'from-rose-950/80 to-slate-950/95',
    borderColor: 'border-rose-400/80 hover:border-rose-300',
    borderGlow: 'shadow-[0_0_20px_rgba(251,113,133,0.3)]',
    badgeColor: 'bg-rose-400 text-slate-950',
    textColor: 'text-rose-300',
    icon: '🗡️',
  },
  {
    id: 'six_digits',
    year: 2008,
    name: '《JJ陆》',
    shortTitle: 'JJ陆',
    subtitle: '《小酒窝》《不潮不用花钱》',
    description: '潮流经典 · 街头律动',
    blindLabel: '25K/50K',
    smallBlind: 25000,
    bigBlind: 50000,
    startChips: 5000000,
    badgeText: '2008 · NO.06',
    themeGradient: 'from-orange-950/80 to-slate-950/95',
    borderColor: 'border-orange-400/80 hover:border-orange-300',
    borderGlow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
    badgeColor: 'bg-orange-400 text-slate-950',
    textColor: 'text-orange-300',
    icon: '🎧',
  },
  {
    id: 'one_hundred_days',
    year: 2009,
    name: '《100天》',
    shortTitle: '100天',
    subtitle: '《第几个100天》《背对背拥抱》',
    description: '破茧重生 · 灵魂深情',
    blindLabel: '50K/100K',
    smallBlind: 50000,
    bigBlind: 100000,
    startChips: 10000000,
    badgeText: '2009 · NO.07',
    themeGradient: 'from-sky-950/80 to-slate-950/95',
    borderColor: 'border-sky-400/80 hover:border-sky-300',
    borderGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]',
    badgeColor: 'bg-sky-400 text-slate-950',
    textColor: 'text-sky-300',
    icon: '🌅',
  },
  {
    id: 'she_says',
    year: 2010,
    name: '《她说》',
    shortTitle: '她说',
    subtitle: '《她说》《爱笑的眼睛》',
    description: '经典重绎 · 感性对话',
    blindLabel: '100K/200K',
    smallBlind: 100000,
    bigBlind: 200000,
    startChips: 20000000,
    badgeText: '2010 · NO.08',
    themeGradient: 'from-pink-950/80 to-slate-950/95',
    borderColor: 'border-pink-400/80 hover:border-pink-300',
    borderGlow: 'shadow-[0_0_20px_rgba(244,114,182,0.3)]',
    badgeColor: 'bg-pink-400 text-slate-950',
    textColor: 'text-pink-300',
    icon: '🌸',
  },
  {
    id: 'never_learn',
    year: 2011,
    name: '《学不会》',
    shortTitle: '学不会',
    subtitle: '《学不会》《那些你很冒险的梦》',
    description: '古典交响 · 华丽高音',
    blindLabel: '250K/500K',
    smallBlind: 250000,
    bigBlind: 500000,
    startChips: 50000000,
    badgeText: '2011 · NO.09',
    themeGradient: 'from-blue-950/80 to-slate-950/95',
    borderColor: 'border-blue-400/80 hover:border-blue-300',
    borderGlow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]',
    badgeColor: 'bg-blue-400 text-slate-950',
    textColor: 'text-blue-300',
    icon: '🎹',
  },
  {
    id: 'stories_untold',
    year: 2013,
    name: '《因你而在》',
    shortTitle: '因你而在',
    subtitle: '《修炼爱情》《因你而在》',
    description: '十周年纪念里程碑',
    blindLabel: '500K/1M',
    smallBlind: 500000,
    bigBlind: 1000000,
    startChips: 100000000,
    badgeText: '2013 · NO.10',
    themeGradient: 'from-violet-950/80 to-slate-950/95',
    borderColor: 'border-violet-400/80 hover:border-violet-300',
    borderGlow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
    badgeColor: 'bg-violet-400 text-slate-950',
    textColor: 'text-violet-300',
    icon: '🌟',
  },
  {
    id: 'genesis',
    year: 2014,
    name: '《新地球》',
    shortTitle: '新地球',
    subtitle: '《可惜没如果》《新地球》',
    description: '金曲歌王 · 全新纪元',
    blindLabel: '1M/2M',
    smallBlind: 1000000,
    bigBlind: 2000000,
    startChips: 200000000,
    badgeText: '2014 · NO.11',
    themeGradient: 'from-indigo-950/80 to-slate-950/95',
    borderColor: 'border-indigo-400/80 hover:border-indigo-300',
    borderGlow: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]',
    badgeColor: 'bg-indigo-400 text-slate-950',
    textColor: 'text-indigo-300',
    icon: '🌍',
  },
  {
    id: 'from_me_to_myself',
    year: 2015,
    name: '《和自己对话》',
    shortTitle: '和自己对话',
    subtitle: '《不为谁而作的歌》',
    description: '3D假人头全景声实验',
    blindLabel: '2.5M/5M',
    smallBlind: 2500000,
    bigBlind: 5000000,
    startChips: 500000000,
    badgeText: '2015 · NO.12',
    themeGradient: 'from-cyan-950/80 to-slate-950/95',
    borderColor: 'border-cyan-400/80 hover:border-cyan-300',
    borderGlow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    badgeColor: 'bg-cyan-400 text-slate-950',
    textColor: 'text-cyan-300',
    icon: '🎙️',
  },
  {
    id: 'message_in_a_bottle',
    year: 2017,
    name: '《伟大的渺小》',
    shortTitle: '伟大的渺小',
    subtitle: '《伟大的渺小》《圣所》',
    description: '圣所巡演开启之作',
    blindLabel: '5M/10M',
    smallBlind: 5000000,
    bigBlind: 10000000,
    startChips: 1000000000,
    badgeText: '2017 · NO.13',
    themeGradient: 'from-purple-950/80 to-slate-950/95',
    borderColor: 'border-purple-400/80 hover:border-purple-300',
    borderGlow: 'shadow-[0_0_20px_rgba(192,132,252,0.3)]',
    badgeColor: 'bg-purple-400 text-slate-950',
    textColor: 'text-purple-300',
    icon: '🌌',
  },
  {
    id: 'drifter_like_you',
    year: 2020,
    name: '《幸存者·如你》',
    shortTitle: '幸存者',
    subtitle: '《交换余生》《幸存者》',
    description: '平行时空双维度企划',
    blindLabel: '10M/20M',
    smallBlind: 10000000,
    bigBlind: 20000000,
    startChips: 2000000000,
    badgeText: '2020 · NO.14',
    themeGradient: 'from-fuchsia-950/80 to-slate-950/95',
    borderColor: 'border-fuchsia-400/80 hover:border-fuchsia-300',
    borderGlow: 'shadow-[0_0_20px_rgba(232,121,249,0.3)]',
    badgeColor: 'bg-fuchsia-400 text-slate-950',
    textColor: 'text-fuchsia-300',
    icon: '⏳',
  },
  {
    id: 'happian',
    year: 2023,
    name: '《重拾_快乐》',
    shortTitle: '重拾_快乐',
    subtitle: '《愿与愁》《逆光白》',
    description: '二十周年巅峰巨献',
    blindLabel: '25M/50M',
    smallBlind: 25000000,
    bigBlind: 50000000,
    startChips: 5000000000,
    badgeText: '2023 · NO.15',
    themeGradient: 'from-amber-950/80 to-slate-950/95',
    borderColor: 'border-amber-300/80 hover:border-amber-200',
    borderGlow: 'shadow-[0_0_20px_rgba(252,211,77,0.3)]',
    badgeColor: 'bg-amber-300 text-slate-950',
    textColor: 'text-amber-200',
    icon: '✨',
  },
];
