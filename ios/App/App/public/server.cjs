var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_ws = require("ws");
var import_vite = require("vite");

// src/utils/pokerEvaluator.ts
var cardValueToName = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A"
};
function getCardName(val) {
  return cardValueToName[val] || val.toString();
}
function evaluate5CardHand(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const isFlush = sorted.every((c) => c.suit === sorted[0].suit);
  let isStraight = false;
  let straightHighValue = 0;
  const values = sorted.map((c) => c.value);
  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHighValue = uniqueValues[0];
    } else if (uniqueValues[0] === 14 && // Ace
    uniqueValues[1] === 5 && uniqueValues[2] === 4 && uniqueValues[3] === 3 && uniqueValues[4] === 2) {
      isStraight = true;
      straightHighValue = 5;
    }
  }
  const counts = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const freqPairs = Object.entries(counts).map(([val, count]) => ({
    val: parseInt(val),
    count
  })).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.val - a.val;
  });
  const freqs = freqPairs.map((p) => p.count);
  let handType = "\u9AD8\u724C";
  let rankClass = 0;
  let scoreParts = [];
  let description = "";
  if (isFlush && isStraight) {
    if (straightHighValue === 14) {
      rankClass = 9;
      handType = "\u7687\u5BB6\u540C\u82B1\u987A";
      description = "\u81F3\u5C0A\u7687\u5BB6\u540C\u82B1\u987A";
    } else {
      rankClass = 8;
      handType = "\u540C\u82B1\u987A";
      description = `\u540C\u82B1\u987A (${getCardName(straightHighValue)}\u9AD8)`;
    }
    scoreParts = [straightHighValue];
  } else if (freqs[0] === 4) {
    rankClass = 7;
    handType = "\u56DB\u6761";
    const quadVal = freqPairs[0].val;
    const kickerVal = freqPairs[1].val;
    description = `\u56DB\u6761 (${getCardName(quadVal)}\u56DB\u5E26\u4E00)`;
    scoreParts = [quadVal, kickerVal];
  } else if (freqs[0] === 3 && freqs[1] === 2) {
    rankClass = 6;
    handType = "\u846B\u82A6";
    const tripleVal = freqPairs[0].val;
    const pairVal = freqPairs[1].val;
    description = `\u846B\u82A6 (${getCardName(tripleVal)}\u4E09\u5E26${getCardName(pairVal)}\u5BF9)`;
    scoreParts = [tripleVal, pairVal];
  } else if (isFlush) {
    rankClass = 5;
    handType = "\u540C\u82B1";
    description = `\u540C\u82B1 (${getCardName(sorted[0].value)}\u9AD8)`;
    scoreParts = sorted.map((c) => c.value);
  } else if (isStraight) {
    rankClass = 4;
    handType = "\u987A\u5B50";
    description = `\u987A\u5B50 (${getCardName(straightHighValue)}\u9AD8)`;
    scoreParts = [straightHighValue];
  } else if (freqs[0] === 3) {
    rankClass = 3;
    handType = "\u4E09\u6761";
    const tripleVal = freqPairs[0].val;
    const k1 = freqPairs[1].val;
    const k2 = freqPairs[2].val;
    description = `\u4E09\u6761 (${getCardName(tripleVal)}\u4E09\u5F20)`;
    scoreParts = [tripleVal, k1, k2];
  } else if (freqs[0] === 2 && freqs[1] === 2) {
    rankClass = 2;
    handType = "\u4E24\u5BF9";
    const p1 = freqPairs[0].val;
    const p2 = freqPairs[1].val;
    const kicker = freqPairs[2].val;
    description = `\u4E24\u5BF9 (${getCardName(p1)}\u5BF9\u548C${getCardName(p2)}\u5BF9)`;
    scoreParts = [p1, p2, kicker];
  } else if (freqs[0] === 2) {
    rankClass = 1;
    handType = "\u4E00\u5BF9";
    const p = freqPairs[0].val;
    const k1 = freqPairs[1].val;
    const k2 = freqPairs[2].val;
    const k3 = freqPairs[3].val;
    description = `\u4E00\u5BF9 (${getCardName(p)}\u5BF9\u5B50)`;
    scoreParts = [p, k1, k2, k3];
  } else {
    rankClass = 0;
    handType = "\u9AD8\u724C";
    description = `\u9AD8\u724C (${getCardName(sorted[0].value)}\u9AD8)`;
    scoreParts = sorted.map((c) => c.value);
  }
  let tieBreaker = 0;
  for (let i = 0; i < 5; i++) {
    const val = scoreParts[i] || 0;
    tieBreaker += val * Math.pow(15, 4 - i);
  }
  const score = rankClass * 1e7 + tieBreaker;
  return {
    score,
    handType,
    description,
    cards: sorted
  };
}
function combinations(arr, k) {
  const result = [];
  function helper(start, path2) {
    if (path2.length === k) {
      result.push([...path2]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      path2.push(arr[i]);
      helper(i + 1, path2);
      path2.pop();
    }
  }
  helper(0, []);
  return result;
}
function evaluate7CardHand(cards) {
  if (!cards || cards.length === 0) {
    return {
      score: 0,
      handType: "\u7B49\u5F85\u53D1\u724C",
      description: "\u7B49\u5F85\u53D1\u724C",
      cards: []
    };
  }
  if (cards.length < 5) {
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const counts = {};
    for (const c of sorted) {
      counts[c.value] = (counts[c.value] || 0) + 1;
    }
    const pairs = Object.entries(counts).map(([v, count]) => ({ val: parseInt(v), count })).sort((a, b) => b.count - a.count || b.val - a.val);
    if (pairs[0].count === 4) {
      const quadVal = pairs[0].val;
      return {
        score: 7e7 + quadVal * 1e4,
        handType: "\u56DB\u6761",
        description: `\u56DB\u6761 (${getCardName(quadVal)}\u56DB\u91D1\u521A)`,
        cards: sorted.filter((c) => c.value === quadVal)
      };
    } else if (pairs[0].count === 3) {
      const tripVal = pairs[0].val;
      return {
        score: 3e7 + tripVal * 1e4,
        handType: "\u4E09\u6761",
        description: `\u4E09\u6761 (${getCardName(tripVal)}\u4E09\u5F20)`,
        cards: sorted.filter((c) => c.value === tripVal)
      };
    } else if (pairs[0].count === 2) {
      const pairVal = pairs[0].val;
      const secondPair = pairs[1]?.count === 2 ? pairs[1].val : null;
      if (secondPair) {
        return {
          score: 2e7 + pairVal * 1e4 + secondPair * 100,
          handType: "\u4E24\u5BF9",
          description: `\u4E24\u5BF9 (${getCardName(pairVal)}\u5BF9\u548C${getCardName(secondPair)}\u5BF9)`,
          cards: sorted.filter((c) => c.value === pairVal || c.value === secondPair)
        };
      }
      return {
        score: 1e7 + pairVal * 1e4,
        handType: "\u4E00\u5BF9",
        description: `\u4E00\u5BF9 (${getCardName(pairVal)}\u5BF9\u5B50)`,
        cards: sorted.filter((c) => c.value === pairVal)
      };
    } else {
      const high = sorted[0];
      return {
        score: high.value * 100,
        handType: "\u9AD8\u724C",
        description: `\u9AD8\u724C (${getCardName(high.value)}\u9AD8)`,
        cards: [high]
      };
    }
  }
  const allCombos = combinations(cards, 5);
  let bestEval = null;
  for (const combo of allCombos) {
    const evaluation = evaluate5CardHand(combo);
    if (!bestEval || evaluation.score > bestEval.score) {
      bestEval = evaluation;
    }
  }
  return bestEval;
}

// src/data/albumStages.ts
var JJ_ALBUM_STAGES = [
  {
    id: "music_voyager",
    year: 2003,
    name: "\u300A\u4E50\u884C\u8005\u300B",
    shortTitle: "\u4E50\u884C\u8005",
    subtitle: "\u7B2C1\u5F20\u4E13\u8F91 \xB7 \u5F00\u542F\u534E\u8BED\u6D41\u884C\u4E50\u4F20\u5947",
    description: "2003\u5E74\u51FA\u9053\u9996\u5F20\u4E13\u8F91\u3002\u300A\u5C31\u662F\u6211\u300B\u3001\u300A\u7FC5\u8180\u300B\u6A2A\u7A7A\u51FA\u4E16\uFF0C\u4EE5\u6700\u7EAF\u7CB9\u7684\u97F3\u4E50\u521D\u5FC3\u8FC8\u51FA\u7B2C1\u6B65\u3002",
    smallBlind: 5,
    bigBlind: 10,
    startChips: 1e3,
    badgeText: "2003 \xB7 \u7B2C1\u5F20\u4E13\u8F91",
    themeGradient: "from-emerald-950/80 to-slate-950/95",
    borderColor: "border-emerald-400/80 hover:border-emerald-300",
    borderGlow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]",
    badgeColor: "bg-emerald-400 text-slate-950",
    textColor: "text-emerald-300",
    icon: "\u{1F3B8}"
  },
  {
    id: "haven_jiangnan",
    year: 2004,
    name: "\u300A\u7B2C\u4E8C\u5929\u5802\u300B",
    shortTitle: "\u7B2C\u4E8C\u5929\u5802",
    subtitle: "\u7B2C2\u5F20\u4E13\u8F91 \xB7 \u4E2D\u56FD\u98CE\u6D41\u884C\u4E50\u5DC5\u5CF0\u65F6\u523B",
    description: "2004\u5E74\u98CE\u9761\u5927\u6C5F\u5357\u5317\u4E4B\u4F5C\u3002\u300A\u6C5F\u5357\u300B\u3001\u300A\u7F8E\u4EBA\u300B\u5C06\u53E4\u5178\u97F5\u5473\u4E0E\u73B0\u4EE3R&B\u5B8C\u7F8E\u878D\u4E3A\u4E00\u4F53\u3002",
    smallBlind: 10,
    bigBlind: 20,
    startChips: 2e3,
    badgeText: "2004 \xB7 \u7B2C2\u5F20\u4E13\u8F91",
    themeGradient: "from-teal-950/80 to-slate-950/95",
    borderColor: "border-teal-400/80 hover:border-teal-300",
    borderGlow: "shadow-[0_0_20px_rgba(45,212,191,0.3)]",
    badgeColor: "bg-teal-400 text-slate-950",
    textColor: "text-teal-300",
    icon: "\u{1F30A}"
  },
  {
    id: "no89757",
    year: 2005,
    name: "\u300A\u7F16\u53F789757\u300B",
    shortTitle: "\u7F16\u53F789757",
    subtitle: "\u7B2C3\u5F20\u4E13\u8F91 \xB7 \u8D5B\u535A\u79D1\u5E7B\u751F\u5316\u4EBA\u6982\u5FF5",
    description: "2005\u5E74\u8DE8\u65F6\u4EE3\u6982\u5FF5\u4E13\u8F91\u3002\u300A\u4E00\u5343\u5E74\u4EE5\u540E\u300B\u3001\u300A\u6728\u4E43\u4F0A\u300B\u63A2\u7D22\u4E00\u5343\u5E74\u540E\u7684\u751F\u5316\u4EBA\u60C5\u611F\u3002",
    smallBlind: 15,
    bigBlind: 30,
    startChips: 3e3,
    badgeText: "2005 \xB7 \u7B2C3\u5F20\u4E13\u8F91",
    themeGradient: "from-cyan-950/80 to-slate-950/95",
    borderColor: "border-cyan-400/80 hover:border-cyan-300",
    borderGlow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    badgeColor: "bg-cyan-400 text-slate-950",
    textColor: "text-cyan-300",
    icon: "\u{1F916}"
  },
  {
    id: "caocao",
    year: 2006,
    name: "\u300A\u66F9\u64CD\u300B",
    shortTitle: "\u66F9\u64CD",
    subtitle: "\u7B2C4\u5F20\u4E13\u8F91 \xB7 \u6447\u6EDA\u9738\u6C14\u4E0E\u4E09\u56FD\u8C6A\u60C5",
    description: "2006\u5E74\u5DC5\u5CF0\u6447\u6EDA\u5DE8\u4F5C\u3002\u300A\u66F9\u64CD\u300B\u3001\u300A\u4E0D\u6B7B\u4E4B\u8EAB\u300B\u897F\u65B9\u6447\u6EDA\u7ED3\u5408\u4E09\u56FD\u8C6A\u60C5\uFF0C\u5168\u684C\u6FC0\u6597\uFF01",
    smallBlind: 20,
    bigBlind: 40,
    startChips: 4e3,
    badgeText: "2006 \xB7 \u7B2C4\u5F20\u4E13\u8F91",
    themeGradient: "from-amber-950/80 to-slate-950/95",
    borderColor: "border-amber-400/80 hover:border-amber-300",
    borderGlow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]",
    badgeColor: "bg-amber-400 text-slate-950",
    textColor: "text-amber-300",
    icon: "\u2694\uFE0F"
  },
  {
    id: "west_side",
    year: 2007,
    name: "\u300A\u897F\u754C\u300B",
    shortTitle: "\u897F\u754C",
    subtitle: "\u7B2C5\u5F20\u4E13\u8F91 \xB7 \u63A2\u7D22\u4EBA\u6027\u6DF1\u5C42\u6697\u9ED1\u4E0E\u5149\u4EAE",
    description: "2007\u5E74\u7A81\u7834\u81EA\u6211\u4E4B\u4F5C\u3002\u300A\u897F\u754C\u300B\u3001\u300A\u6740\u624B\u300B\u5C55\u73B0\u6781\u5176\u6DF1\u9083\u7684\u97F3\u4E50\u5C42\u6B21\u4E0E\u5FC3\u7406\u5BF9\u5CD9\u3002",
    smallBlind: 25,
    bigBlind: 50,
    startChips: 5e3,
    badgeText: "2007 \xB7 \u7B2C5\u5F20\u4E13\u8F91",
    themeGradient: "from-rose-950/80 to-slate-950/95",
    borderColor: "border-rose-400/80 hover:border-rose-300",
    borderGlow: "shadow-[0_0_20px_rgba(251,113,133,0.3)]",
    badgeColor: "bg-rose-400 text-slate-950",
    textColor: "text-rose-300",
    icon: "\u{1F5E1}\uFE0F"
  },
  {
    id: "six_digits",
    year: 2008,
    name: "\u300AJJ\u9646\u300B",
    shortTitle: "JJ\u9646",
    subtitle: "\u7B2C6\u5F20\u4E13\u8F91 \xB7 \u6F6E\u6D41\u591A\u5143\u5408\u4F5C\u7ECF\u5178",
    description: "2008\u5E74\u6F6E\u6D41\u96C6\u5927\u6210\u4E4B\u4F5C\u3002\u300A\u5C0F\u9152\u7A9D\u300B\u3001\u300A\u4E0D\u6F6E\u4E0D\u7528\u82B1\u94B1\u300B\u7EA2\u904D\u5927\u8857\u5C0F\u5DF7\uFF0C\u6C1B\u56F4\u6781\u4F73\u3002",
    smallBlind: 35,
    bigBlind: 70,
    startChips: 7e3,
    badgeText: "2008 \xB7 \u7B2C6\u5F20\u4E13\u8F91",
    themeGradient: "from-orange-950/80 to-slate-950/95",
    borderColor: "border-orange-400/80 hover:border-orange-300",
    borderGlow: "shadow-[0_0_20px_rgba(251,146,60,0.3)]",
    badgeColor: "bg-orange-400 text-slate-950",
    textColor: "text-orange-300",
    icon: "\u{1F3A7}"
  },
  {
    id: "one_hundred_days",
    year: 2009,
    name: "\u300A100\u5929\u300B",
    shortTitle: "100\u5929",
    subtitle: "\u7B2C7\u5F20\u4E13\u8F91 \xB7 \u5386\u7ECF\u4F4E\u8C37\u6D85\u69C3\u91CD\u751F",
    description: "2009\u5E74\u5931\u58F0\u4F4E\u8C37\u540E\u91CD\u8FD4\u821E\u53F0\u3002\u300A\u7B2C\u51E0\u4E2A100\u5929\u300B\u3001\u300A\u80CC\u5BF9\u80CC\u62E5\u62B1\u300B\u5531\u51FA\u6700\u771F\u631A\u6DF1\u60C5\u3002",
    smallBlind: 50,
    bigBlind: 100,
    startChips: 1e4,
    badgeText: "2009 \xB7 \u7B2C7\u5F20\u4E13\u8F91",
    themeGradient: "from-sky-950/80 to-slate-950/95",
    borderColor: "border-sky-400/80 hover:border-sky-300",
    borderGlow: "shadow-[0_0_20px_rgba(56,189,248,0.3)]",
    badgeColor: "bg-sky-400 text-slate-950",
    textColor: "text-sky-300",
    icon: "\u{1F305}"
  },
  {
    id: "she_says",
    year: 2010,
    name: "\u300A\u5979\u8BF4\u300B",
    shortTitle: "\u5979\u8BF4",
    subtitle: "\u7B2C8\u5F20\u4E13\u8F91 \xB7 \u5973\u6027\u89C6\u89D2\u611F\u6027\u521B\u4F5C\u5BF9\u8BDD",
    description: "2010\u5E74\u6982\u5FF5\u521B\u4F5C\u4E13\u8F91\u3002\u300A\u5979\u8BF4\u300B\u3001\u300A\u7231\u7B11\u7684\u773C\u775B\u300B\u91CD\u65B0\u6F14\u7ECE\u5199\u7ED9\u5973\u6B4C\u624B\u7684\u7ECF\u5178\u795E\u66F2\u3002",
    smallBlind: 75,
    bigBlind: 150,
    startChips: 15e3,
    badgeText: "2010 \xB7 \u7B2C8\u5F20\u4E13\u8F91",
    themeGradient: "from-pink-950/80 to-slate-950/95",
    borderColor: "border-pink-400/80 hover:border-pink-300",
    borderGlow: "shadow-[0_0_20px_rgba(244,114,182,0.3)]",
    badgeColor: "bg-pink-400 text-slate-950",
    textColor: "text-pink-300",
    icon: "\u{1F338}"
  },
  {
    id: "never_learn",
    year: 2011,
    name: "\u300A\u5B66\u4E0D\u4F1A\u300B",
    shortTitle: "\u5B66\u4E0D\u4F1A",
    subtitle: "\u7B2C9\u5F20\u4E13\u8F91 \xB7 \u6B27\u6D32\u53E4\u5178\u4E0E\u6D41\u884C\u7F8E\u5B66",
    description: "2011\u5E74\u52A0\u76DF\u534E\u7EB3\u9707\u64BC\u5DE8\u4F5C\u3002\u300A\u5B66\u4E0D\u4F1A\u300B\u3001\u300A\u4E0D\u5B58\u5728\u7684\u60C5\u4EBA\u300B\u5C55\u73B0\u9AD8\u97F3\u63A7\u5236\u529B\u4E0E\u7075\u9B42\u9707\u64BC\u3002",
    smallBlind: 100,
    bigBlind: 200,
    startChips: 2e4,
    badgeText: "2011 \xB7 \u7B2C9\u5F20\u4E13\u8F91",
    themeGradient: "from-blue-950/80 to-slate-950/95",
    borderColor: "border-blue-400/80 hover:border-blue-300",
    borderGlow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]",
    badgeColor: "bg-blue-400 text-slate-950",
    textColor: "text-blue-300",
    icon: "\u{1F3B9}"
  },
  {
    id: "stories_untold",
    year: 2013,
    name: "\u300A\u56E0\u4F60\u800C\u5728\u300B",
    shortTitle: "\u56E0\u4F60\u800C\u5728",
    subtitle: "\u7B2C10\u5F20\u4E13\u8F91 \xB7 \u51FA\u9053\u5341\u5468\u5E74\u91CC\u7A0B\u7891\u5DE8\u732E",
    description: "2013\u5E74\u51FA\u905310\u5468\u5E74\u91CC\u7A0B\u7891\u3002\u300A\u4FEE\u70BC\u7231\u60C5\u300B\u3001\u300A\u56E0\u4F60\u800C\u5728\u300B\u6536\u83B7\u65E0\u6570\u5956\u9879\uFF0C\u58F0\u52BF\u6D69\u5927\u3002",
    smallBlind: 150,
    bigBlind: 300,
    startChips: 3e4,
    badgeText: "2013 \xB7 \u7B2C10\u5F20\u4E13\u8F91",
    themeGradient: "from-violet-950/80 to-slate-950/95",
    borderColor: "border-violet-400/80 hover:border-violet-300",
    borderGlow: "shadow-[0_0_20px_rgba(167,139,250,0.3)]",
    badgeColor: "bg-violet-400 text-slate-950",
    textColor: "text-violet-300",
    icon: "\u{1F31F}"
  },
  {
    id: "genesis",
    year: 2014,
    name: "\u300A\u65B0\u5730\u7403\u300B",
    shortTitle: "\u65B0\u5730\u7403",
    subtitle: "\u7B2C11\u5F20\u4E13\u8F91 \xB7 \u8363\u83B7\u91D1\u66F2\u6B4C\u738B\u79F0\u53F7",
    description: "2014\u5E74\u9996\u6B21\u65A9\u83B7\u91D1\u66F2\u6700\u4F73\u56FD\u8BED\u7537\u6B4C\u624B\u3002\u300A\u65B0\u5730\u7403\u300B\u3001\u300A\u53EF\u60DC\u6CA1\u5982\u679C\u300B\u5F00\u521B\u6D41\u884C\u97F3\u4E50\u65B0\u683C\u5C40\u3002",
    smallBlind: 200,
    bigBlind: 400,
    startChips: 4e4,
    badgeText: "2014 \xB7 \u7B2C11\u5F20\u4E13\u8F91",
    themeGradient: "from-indigo-950/80 to-slate-950/95",
    borderColor: "border-indigo-400/80 hover:border-indigo-300",
    borderGlow: "shadow-[0_0_20px_rgba(129,140,248,0.3)]",
    badgeColor: "bg-indigo-400 text-slate-950",
    textColor: "text-indigo-300",
    icon: "\u{1F30D}"
  },
  {
    id: "from_me_to_myself",
    year: 2015,
    name: "\u300A\u548C\u81EA\u5DF1\u5BF9\u8BDD\u300B",
    shortTitle: "\u548C\u81EA\u5DF1\u5BF9\u8BDD",
    subtitle: "\u7B2C12\u5F20\u4E13\u8F91 \xB7 \u9996\u521B\u5047\u4EBA\u5934\u4EBA\u58F0\u5F55\u97F3",
    description: "2015\u5E74\u5047\u4EBA\u5934\u5F55\u97F3\u6982\u5FF5\u7A81\u7834\u3002\u300A\u4E0D\u4E3A\u8C01\u800C\u4F5C\u7684\u6B4C\u300B\u518D\u83B7\u91D1\u66F2\u6700\u4F73\u4F5C\u66F2\u4EBA\uFF0C\u97F3\u6548\u6781\u81F4\u3002",
    smallBlind: 300,
    bigBlind: 600,
    startChips: 6e4,
    badgeText: "2015 \xB7 \u7B2C12\u5F20\u4E13\u8F91",
    themeGradient: "from-cyan-950/80 to-slate-950/95",
    borderColor: "border-cyan-400/80 hover:border-cyan-300",
    borderGlow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    badgeColor: "bg-cyan-400 text-slate-950",
    textColor: "text-cyan-300",
    icon: "\u{1F399}\uFE0F"
  },
  {
    id: "message_in_a_bottle",
    year: 2017,
    name: "\u300A\u4F1F\u5927\u7684\u6E3A\u5C0F\u300B",
    shortTitle: "\u4F1F\u5927\u7684\u6E3A\u5C0F",
    subtitle: "\u7B2C13\u5F20\u4E13\u8F91 \xB7 \u6DF1\u5EA6\u63A2\u8BA8\u751F\u547D\u7684\u5B8F\u5927\u4E0E\u5FAE\u5C0F",
    description: "2017\u5E74\u6DF1\u60C5\u6982\u5FF5\u529B\u4F5C\u3002\u300A\u4F1F\u5927\u7684\u6E3A\u5C0F\u300B\u3001\u300A\u5723\u6240\u300B\u5F00\u542F\u540C\u540D\u4E16\u754C\u5DE1\u56DE\u6F14\u5531\u4F1A\u6D6A\u6F6E\u3002",
    smallBlind: 500,
    bigBlind: 1e3,
    startChips: 1e5,
    badgeText: "2017 \xB7 \u7B2C13\u5F20\u4E13\u8F91",
    themeGradient: "from-purple-950/80 to-slate-950/95",
    borderColor: "border-purple-400/80 hover:border-purple-300",
    borderGlow: "shadow-[0_0_20px_rgba(192,132,252,0.3)]",
    badgeColor: "bg-purple-400 text-slate-950",
    textColor: "text-purple-300",
    icon: "\u{1F30C}"
  },
  {
    id: "drifter_like_you",
    year: 2020,
    name: "\u300A\u5E78\u5B58\u8005\xB7\u5982\u4F60\u300B",
    shortTitle: "\u5E78\u5B58\u8005",
    subtitle: "\u7B2C14\u5F20\u4E13\u8F91 \xB7 \u53CC\u7EF4\u5EA6\u5E73\u884C\u65F6\u7A7A\u6982\u5FF5",
    description: "2020\u5E74\u53CC\u7EF4\u5EA6\u97F3\u4E50\u4F01\u5212\u3002\u300A\u5E78\u5B58\u8005\u300B\u3001\u300A\u4EA4\u6362\u4F59\u751F\u300B\u7528\u97F3\u4E50\u52FE\u52D2\u5E73\u884C\u65F6\u7A7A\u5947\u8FF9\u3002",
    smallBlind: 750,
    bigBlind: 1500,
    startChips: 15e4,
    badgeText: "2020 \xB7 \u7B2C14\u5F20\u4E13\u8F91",
    themeGradient: "from-fuchsia-950/80 to-slate-950/95",
    borderColor: "border-fuchsia-400/80 hover:border-fuchsia-300",
    borderGlow: "shadow-[0_0_20px_rgba(232,121,249,0.3)]",
    badgeColor: "bg-fuchsia-400 text-slate-950",
    textColor: "text-fuchsia-300",
    icon: "\u23F3"
  },
  {
    id: "happian",
    year: 2023,
    name: "\u300A\u91CD\u62FE_\u5FEB\u4E50\u300B",
    shortTitle: "\u91CD\u62FE_\u5FEB\u4E50",
    subtitle: "\u7B2C15\u5F20\u4E13\u8F91 \xB7 \u4E8C\u5341\u5468\u5E74\u56DE\u5F52\u97F3\u4E50\u771F\u8C1B",
    description: "2023\u5E74\u51FA\u905320\u5468\u5E74\u7EAA\u5FF5\u4E13\u8F91\u3002\u300A\u613F\u4E0E\u6101\u300B\u3001\u300A\u9006\u5149\u767D\u300B\u627E\u56DE\u6700\u5355\u7EAF\u7684\u611F\u52A8\u4E0E\u5FEB\u4E50\u3002",
    smallBlind: 1e3,
    bigBlind: 2e3,
    startChips: 2e5,
    badgeText: "2023 \xB7 \u7B2C15\u5F20\u4E13\u8F91",
    themeGradient: "from-amber-950/80 to-slate-950/95",
    borderColor: "border-amber-300/80 hover:border-amber-200",
    borderGlow: "shadow-[0_0_20px_rgba(252,211,77,0.3)]",
    badgeColor: "bg-amber-300 text-slate-950",
    textColor: "text-amber-200",
    icon: "\u2728"
  }
];

// server.ts
var ROOT_DIR = process.cwd();
var PORT = Number(process.env.PORT) || 3e3;
var HOST = "0.0.0.0";
var DATA_DIR = import_path.default.join(ROOT_DIR, "data");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var DB_FILE = import_path.default.join(DATA_DIR, "users_db.json");
var SECRET_FILE = import_path.default.join(DATA_DIR, ".server_secret");
function getOrCreateServerSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  try {
    if (import_fs.default.existsSync(SECRET_FILE)) {
      return import_fs.default.readFileSync(SECRET_FILE, "utf-8").trim();
    }
    const generated = import_crypto.default.randomBytes(32).toString("hex");
    import_fs.default.writeFileSync(SECRET_FILE, generated, "utf-8");
    return generated;
  } catch {
    return "final_sanctuary_fallback_hmac_secret_2026";
  }
}
var SERVER_SECRET = getOrCreateServerSecret();
function hashPassword(plain) {
  const salt = import_crypto.default.randomBytes(16).toString("hex");
  const derivedKey = import_crypto.default.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}
function verifyPassword(plain, stored) {
  if (!stored) return { valid: false, needsMigration: false };
  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length !== 3) return { valid: false, needsMigration: false };
    const [, salt, hashHex] = parts;
    try {
      const derivedKey = import_crypto.default.scryptSync(plain, salt, 64);
      const storedBuf = Buffer.from(hashHex, "hex");
      if (derivedKey.length !== storedBuf.length) return { valid: false, needsMigration: false };
      return { valid: import_crypto.default.timingSafeEqual(derivedKey, storedBuf), needsMigration: false };
    } catch {
      return { valid: false, needsMigration: false };
    }
  }
  return { valid: plain === stored, needsMigration: plain === stored };
}
function signUserToken(userId) {
  const sig = import_crypto.default.createHmac("sha256", SERVER_SECRET).update(userId).digest("hex");
  return `${userId}.${sig}`;
}
function sanitizeUser(user) {
  const { password: _removed, ...safeUser } = user;
  return safeUser;
}
var userStore = /* @__PURE__ */ new Map();
function saveDatabase() {
  try {
    const list = Array.from(userStore.values());
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("[Server DB] Error saving database to disk:", err);
  }
}
function loadDatabase() {
  try {
    if (import_fs.default.existsSync(DB_FILE)) {
      const data = import_fs.default.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      let migratedCount = 0;
      parsed.forEach((user) => {
        if (user.password && !user.password.startsWith("scrypt$")) {
          user.password = hashPassword(user.password);
          migratedCount++;
        }
        userStore.set(user.id, user);
      });
      if (migratedCount > 0) {
        saveDatabase();
        console.log(`[Server DB] Migrated ${migratedCount} legacy plaintext password(s) to scrypt hashes.`);
      }
      console.log(`[Server DB] Successfully loaded ${userStore.size} user account(s) from disk.`);
    }
  } catch (err) {
    console.error("[Server DB] Error reading users database file:", err);
  }
}
loadDatabase();
var SERVER_BOT_POOL = [
  { id: "bot_jiangnan", name: "\u6C5F\u5357\u5C0F\u8FC7\u5BA2 (AI)", avatar: "\u{1F302}" },
  { id: "bot_caocao", name: "\u67AD\u96C4\u66F9\u64CD (AI)", avatar: "\u2694\uFE0F" },
  { id: "bot_years", name: "\u5343\u5E74\u65F6\u5149\u65C5\u4EBA (AI)", avatar: "\u23F3" },
  { id: "bot_love", name: "\u4FEE\u70BC\u7231\u60C5\u5927\u5E08 (AI)", avatar: "\u{1F338}" }
];
var app = (0, import_express.default)();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express.default.json({ limit: "6mb" }));
var server = import_http.default.createServer(app);
var wss = new import_ws.WebSocketServer({ noServer: true });
server.on("upgrade", (request, socket, head) => {
  try {
    const host = request.headers.host || "localhost";
    const url = new URL(request.url || "", `http://${host}`);
    if (url.pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  } catch {
    socket.destroy();
  }
});
var sessions = /* @__PURE__ */ new Map();
var rooms = /* @__PURE__ */ new Map();
var waitingQueue = [];
function getStageConfig(stageId) {
  const found = JJ_ALBUM_STAGES.find((s) => s.id === stageId);
  return found || JJ_ALBUM_STAGES[0];
}
function createShuffledDeck() {
  const suits = ["S", "H", "D", "C"];
  const deck = [];
  for (const suit of suits) {
    for (let value = 2; value <= 14; value++) {
      deck.push({ suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function clearRoomTimers(room) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
  if (room.botTimer) {
    clearTimeout(room.botTimer);
    room.botTimer = null;
  }
}
function serializeRoomLobbyData(room) {
  return {
    roomId: room.id,
    roomName: room.name,
    stageId: room.stageId,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      isReady: p.isReady,
      isBot: p.isBot,
      isOnline: p.isOnline
    }))
  };
}
function broadcastGameState(room) {
  const revealAllActiveCards = room.round === "Showdown";
  room.players.forEach((recipientSeat) => {
    if (recipientSeat.isBot || !recipientSeat.ws || recipientSeat.ws.readyState !== import_ws.WebSocket.OPEN) {
      return;
    }
    const personalizedPlayers = room.players.map((p) => {
      const isSelf = p.id === recipientSeat.id || p.userId && p.userId === recipientSeat.userId;
      const shouldShowCards = isSelf || revealAllActiveCards && !p.isFolded || room.winnerIds.includes(p.id);
      const safeCards = shouldShowCards ? p.cards : p.cards.map(() => ({ suit: "S", value: 14 }));
      return {
        id: p.id,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar,
        chips: p.chips,
        currentBet: p.currentBet,
        cards: safeCards,
        hasCards: p.cards.length > 0,
        isFolded: p.isFolded,
        isAllIn: p.isAllIn,
        isBot: p.isBot,
        lastAction: p.lastAction,
        handDescription: p.handDescription,
        isOnline: p.isOnline
      };
    });
    const payload = {
      type: "GAME_STATE",
      data: {
        roomId: room.id,
        roomName: room.name,
        stageId: room.stageId,
        status: room.status,
        round: room.round,
        pot: room.pot,
        currentMaxBet: room.currentMaxBet,
        communityCards: room.communityCards,
        activePlayerIndex: room.activePlayerIndex,
        dealerIndex: room.dealerIndex,
        sbIndex: room.sbIndex,
        bbIndex: room.bbIndex,
        smallBlind: room.smallBlind,
        bigBlind: room.bigBlind,
        startChips: room.startChips,
        handCount: room.handCount,
        winnerIds: room.winnerIds,
        winningDescription: room.winningDescription,
        toastMsg: room.toastMsg,
        turnDeadline: room.turnDeadline,
        mySeatId: recipientSeat.id,
        players: personalizedPlayers
      }
    };
    recipientSeat.ws.send(JSON.stringify(payload));
  });
}
function broadcastToRoom(roomId, message, excludeWs) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  room.players.forEach((p) => {
    if (!p.isBot && p.ws && p.ws !== excludeWs && p.ws.readyState === import_ws.WebSocket.OPEN) {
      p.ws.send(payload);
    }
  });
}
function broadcastOnlineStats() {
  const payload = JSON.stringify({
    type: "STATS_UPDATE",
    data: {
      onlinePlayers: sessions.size,
      activeRooms: rooms.size,
      queueLength: waitingQueue.length
    }
  });
  sessions.forEach((session) => {
    if (session.ws.readyState === import_ws.WebSocket.OPEN) {
      session.ws.send(payload);
    }
  });
}
function startServerHand(room) {
  clearRoomTimers(room);
  const now = Date.now();
  room.players = room.players.filter((p) => p.isBot || p.isOnline || p.disconnectedAt && now - p.disconnectedAt < 6e4);
  const humanCount = room.players.filter((p) => !p.isBot).length;
  if (humanCount === 0) {
    rooms.delete(room.id);
    broadcastOnlineStats();
    return;
  }
  if (room.players.length < 2) {
    const botTemplate = SERVER_BOT_POOL[0];
    room.players.push({
      id: `${botTemplate.id}_${Date.now().toString(36)}`,
      name: botTemplate.name,
      avatar: botTemplate.avatar,
      chips: room.startChips,
      currentBet: 0,
      totalBetInHand: 0,
      cards: [],
      isFolded: false,
      isAllIn: false,
      isBot: true,
      hasActedThisRound: false,
      lastAction: "",
      isReady: true,
      isOnline: true
    });
  }
  room.status = "PLAYING";
  room.deck = createShuffledDeck();
  room.communityCards = [];
  room.winnerIds = [];
  room.winningDescription = "";
  room.handCount += 1;
  const numPlayers = room.players.length;
  const newDealerIdx = room.handCount === 1 ? 0 : (room.dealerIndex + 1) % numPlayers;
  const newSbIdx = numPlayers === 2 ? newDealerIdx : (newDealerIdx + 1) % numPlayers;
  const newBbIdx = numPlayers === 2 ? (newDealerIdx + 1) % 2 : (newSbIdx + 1) % numPlayers;
  room.dealerIndex = newDealerIdx;
  room.sbIndex = newSbIdx;
  room.bbIndex = newBbIdx;
  let initialPot = 0;
  room.players.forEach((p, idx) => {
    if (p.chips <= room.bigBlind) {
      p.chips = room.startChips;
      if (!p.isBot && p.userId && userStore.has(p.userId)) {
        const acc = userStore.get(p.userId);
        if (acc.chips <= room.bigBlind) {
          acc.chips = room.startChips;
          saveDatabase();
        }
      }
    }
    const c1 = room.deck.pop();
    const c2 = room.deck.pop();
    p.cards = [c1, c2];
    p.currentBet = 0;
    p.totalBetInHand = 0;
    p.isFolded = false;
    p.isAllIn = false;
    p.hasActedThisRound = false;
    p.handDescription = void 0;
    p.lastAction = "";
    if (idx === newSbIdx) {
      const sbAmt = Math.min(p.chips, room.smallBlind);
      p.chips -= sbAmt;
      p.currentBet = sbAmt;
      p.totalBetInHand = sbAmt;
      p.isAllIn = p.chips === 0;
      p.lastAction = "SB (\u5C0F\u76F2)";
      initialPot += sbAmt;
    } else if (idx === newBbIdx) {
      const bbAmt = Math.min(p.chips, room.bigBlind);
      p.chips -= bbAmt;
      p.currentBet = bbAmt;
      p.totalBetInHand = bbAmt;
      p.isAllIn = p.chips === 0;
      p.lastAction = "BB (\u5927\u76F2)";
      initialPot += bbAmt;
    }
  });
  room.pot = initialPot;
  room.currentMaxBet = room.bigBlind;
  room.round = "PreFlop";
  const firstToAct = (newBbIdx + 1) % numPlayers;
  room.activePlayerIndex = firstToAct;
  room.toastMsg = `\u{1F39F}\uFE0F \u7B2C ${room.handCount} \u5C40\u5F00\u59CB\uFF01\u5E84\u5BB6\u3010${room.players[newDealerIdx].name}\u3011\uFF0C\u8BF7\u8F6E\u6D41\u884C\u52A8\uFF01`;
  scheduleCurrentTurn(room);
  broadcastGameState(room);
}
function scheduleCurrentTurn(room) {
  clearRoomTimers(room);
  if (room.round === "Waiting" || room.round === "Showdown" || room.activePlayerIndex < 0) {
    room.turnDeadline = 0;
    return;
  }
  const activeSeat = room.players[room.activePlayerIndex];
  if (!activeSeat || activeSeat.isFolded || activeSeat.isAllIn) {
    advanceTurnOrRound(room);
    return;
  }
  if (activeSeat.isBot) {
    room.turnDeadline = Date.now() + 2e3;
    room.botTimer = setTimeout(() => {
      executeServerBotAction(room, room.activePlayerIndex);
    }, 1100);
  } else if (!activeSeat.isOnline) {
    room.turnDeadline = Date.now() + 2e3;
    room.turnTimer = setTimeout(() => {
      const toCall = room.currentMaxBet - activeSeat.currentBet;
      processPlayerAction(room, activeSeat.id, toCall === 0 ? "check" : "fold");
    }, 2e3);
  } else {
    room.turnDeadline = Date.now() + 25e3;
    room.turnTimer = setTimeout(() => {
      const toCall = room.currentMaxBet - activeSeat.currentBet;
      processPlayerAction(room, activeSeat.id, toCall === 0 ? "check" : "fold");
    }, 25e3);
  }
}
function executeServerBotAction(room, botIdx) {
  const bot = room.players[botIdx];
  if (!bot || room.activePlayerIndex !== botIdx || room.round === "Showdown" || room.round === "Waiting") {
    return;
  }
  const fullHand = [...bot.cards, ...room.communityCards];
  const evalResult = evaluate7CardHand(fullHand);
  const toCall = room.currentMaxBet - bot.currentBet;
  const canRaise = bot.chips > toCall;
  const rank = Math.floor(evalResult.score / 1e7);
  if (toCall <= 0) {
    if (rank >= 2 && canRaise && Math.random() > 0.45) {
      const raiseTarget = Math.min(bot.chips + bot.currentBet, (room.currentMaxBet || room.bigBlind) + room.bigBlind);
      processPlayerAction(room, bot.id, "raise", raiseTarget);
    } else {
      processPlayerAction(room, bot.id, "check");
    }
  } else {
    const potOdds = toCall / Math.max(1, room.pot + toCall);
    let winProb = 0.18;
    if (rank >= 4) winProb = 0.92;
    else if (rank === 3) winProb = 0.78;
    else if (rank === 2) winProb = 0.58;
    else if (rank === 1) winProb = 0.38;
    if (winProb > potOdds) {
      if (rank >= 3 && canRaise && Math.random() > 0.55) {
        const raiseTarget = Math.min(bot.chips + bot.currentBet, room.currentMaxBet + room.bigBlind);
        processPlayerAction(room, bot.id, "raise", raiseTarget);
      } else {
        processPlayerAction(room, bot.id, "call");
      }
    } else if (toCall <= room.bigBlind && Math.random() > 0.35) {
      processPlayerAction(room, bot.id, "call");
    } else {
      processPlayerAction(room, bot.id, "fold");
    }
  }
}
function processPlayerAction(room, seatId, action, raiseAmount) {
  if (room.round === "Waiting" || room.round === "Showdown") return;
  const idx = room.players.findIndex((p) => p.id === seatId);
  if (idx === -1 || idx !== room.activePlayerIndex) return;
  clearRoomTimers(room);
  const player = room.players[idx];
  const toCall = Math.max(0, room.currentMaxBet - player.currentBet);
  if (action === "fold") {
    player.isFolded = true;
    player.hasActedThisRound = true;
    player.lastAction = "\u5F03\u724C";
    room.toastMsg = `\u{1F4A8} [\u5F03\u724C] ${player.name} \u9009\u62E9\u5F03\u724C\u3002`;
  } else if (action === "check") {
    if (toCall > 0) {
      return processPlayerAction(room, seatId, "call");
    }
    player.hasActedThisRound = true;
    player.lastAction = "\u8FC7\u724C";
    room.toastMsg = `\u{1F3A4} [\u8FC7\u724C] ${player.name} \u9009\u62E9\u8FC7\u724C\u3002`;
  } else if (action === "call") {
    const actualCall = Math.min(player.chips, toCall);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    player.totalBetInHand += actualCall;
    room.pot += actualCall;
    player.hasActedThisRound = true;
    if (player.chips === 0) {
      player.isAllIn = true;
      player.lastAction = "\u5168\u62BC";
      room.toastMsg = `\u{1F680} [\u5168\u62BC] ${player.name} \u5168\u62BC\u8DDF\u6CE8 ${actualCall} \u97F3\u7B26\uFF01`;
    } else {
      player.lastAction = "\u8DDF\u6CE8";
      room.toastMsg = `\u{1F50A} [\u8DDF\u6CE8] ${player.name} \u8DDF\u6CE8 ${actualCall} \u5723\u6240\u97F3\u7B26\u3002`;
    }
  } else if (action === "allin") {
    const allInAmt = player.chips;
    player.chips = 0;
    player.currentBet += allInAmt;
    player.totalBetInHand += allInAmt;
    room.pot += allInAmt;
    player.isAllIn = true;
    player.hasActedThisRound = true;
    player.lastAction = "\u5168\u62BC";
    if (player.currentBet > room.currentMaxBet) {
      room.currentMaxBet = player.currentBet;
      room.players.forEach((other, oIdx) => {
        if (oIdx !== idx && !other.isFolded && !other.isAllIn) {
          other.hasActedThisRound = false;
        }
      });
    }
    room.toastMsg = `\u{1F680} [\u5168\u62BC] ${player.name} \u5B64\u6CE8\u4E00\u63B7\u5168\u62BC ${allInAmt} \u5723\u6240\u97F3\u7B26\uFF01`;
  } else if (action === "raise") {
    const minTarget = room.currentMaxBet === 0 ? room.bigBlind : room.currentMaxBet + room.bigBlind;
    const desiredTarget = typeof raiseAmount === "number" ? raiseAmount : minTarget;
    const maxPossibleTarget = player.currentBet + player.chips;
    const clampedTarget = Math.min(maxPossibleTarget, Math.max(minTarget, desiredTarget));
    const addedChips = Math.max(0, clampedTarget - player.currentBet);
    if (addedChips <= toCall) {
      return processPlayerAction(room, seatId, player.chips <= toCall ? "allin" : "call");
    }
    player.chips -= addedChips;
    player.currentBet += addedChips;
    player.totalBetInHand += addedChips;
    room.pot += addedChips;
    player.hasActedThisRound = true;
    if (player.currentBet > room.currentMaxBet) {
      room.currentMaxBet = player.currentBet;
      room.players.forEach((other, oIdx) => {
        if (oIdx !== idx && !other.isFolded && !other.isAllIn) {
          other.hasActedThisRound = false;
        }
      });
    }
    if (player.chips === 0) {
      player.isAllIn = true;
      player.lastAction = "\u5168\u62BC";
      room.toastMsg = `\u{1F680} [\u5168\u62BC] ${player.name} \u5168\u62BC\u52A0\u6CE8\u81F3 ${player.currentBet} \u97F3\u7B26\uFF01`;
    } else {
      player.lastAction = `\u52A0\u6CE8(${player.currentBet})`;
      room.toastMsg = `\u{1F525} [\u52A0\u6CE8] ${player.name} \u52A0\u6CE8\u81F3 ${player.currentBet} \u5723\u6240\u97F3\u7B26\uFF01`;
    }
  }
  advanceTurnOrRound(room);
}
function advanceTurnOrRound(room) {
  const nonFolded = room.players.filter((p) => !p.isFolded);
  if (nonFolded.length === 1) {
    const soleWinner = nonFolded[0];
    soleWinner.chips += room.pot;
    room.winnerIds = [soleWinner.id];
    room.winningDescription = "\u5BF9\u624B\u5168\u573A\u5F03\u724C";
    room.round = "Showdown";
    room.activePlayerIndex = -1;
    room.turnDeadline = 0;
    room.toastMsg = `\u{1F3C6} [\u672C\u5C40\u7ED3\u675F] \u5176\u4ED6\u73A9\u5BB6\u5F03\u724C\uFF0C${soleWinner.name} \u8D62\u4E0B\u5E95\u6C60 ${room.pot} \u5723\u6240\u97F3\u7B26\uFF01`;
    syncRoomAccountsToStore(room, [soleWinner.id]);
    broadcastGameState(room);
    return;
  }
  const allMatchedAndActed = room.players.every(
    (p) => p.isFolded || p.isAllIn || p.hasActedThisRound && p.currentBet === room.currentMaxBet
  );
  if (allMatchedAndActed) {
    advanceServerStreet(room);
    return;
  }
  const total = room.players.length;
  let nextIdx = room.activePlayerIndex;
  for (let i = 0; i < total; i++) {
    nextIdx = (nextIdx + 1) % total;
    const candidate = room.players[nextIdx];
    if (!candidate.isFolded && !candidate.isAllIn) {
      room.activePlayerIndex = nextIdx;
      scheduleCurrentTurn(room);
      broadcastGameState(room);
      return;
    }
  }
  advanceServerStreet(room);
}
function advanceServerStreet(room) {
  clearRoomTimers(room);
  room.players.forEach((p) => {
    p.currentBet = 0;
    p.hasActedThisRound = false;
    if (!p.isFolded && !p.isAllIn) {
      p.lastAction = "";
    }
  });
  room.currentMaxBet = 0;
  if (room.round === "PreFlop") {
    room.communityCards.push(room.deck.pop(), room.deck.pop(), room.deck.pop());
    room.round = "Flop";
    room.toastMsg = "\u{1F308} [\u7FFB\u724C\u5708] \u63ED\u5F00\u524D 3 \u5F20\u516C\u5171\u724C\uFF01";
  } else if (room.round === "Flop") {
    room.communityCards.push(room.deck.pop());
    room.round = "Turn";
    room.toastMsg = "\u2728 [\u8F6C\u724C\u5708] \u63ED\u5F00\u7B2C 4 \u5F20\u516C\u5171\u724C\uFF01";
  } else if (room.round === "Turn") {
    room.communityCards.push(room.deck.pop());
    room.round = "River";
    room.toastMsg = "\u{1F3AD} [\u6CB3\u724C\u5708] \u63ED\u5F00\u6700\u540E 1 \u5F20\u516C\u5171\u724C\uFF01";
  } else if (room.round === "River") {
    evaluateServerShowdown(room);
    return;
  }
  const playersAbleToAct = room.players.filter((p) => !p.isFolded && !p.isAllIn);
  if (playersAbleToAct.length <= 1) {
    broadcastGameState(room);
    room.botTimer = setTimeout(() => {
      advanceServerStreet(room);
    }, 1200);
    return;
  }
  const total = room.players.length;
  let firstIdx = room.dealerIndex;
  for (let i = 0; i < total; i++) {
    firstIdx = (firstIdx + 1) % total;
    if (!room.players[firstIdx].isFolded && !room.players[firstIdx].isAllIn) {
      room.activePlayerIndex = firstIdx;
      break;
    }
  }
  scheduleCurrentTurn(room);
  broadcastGameState(room);
}
function evaluateServerShowdown(room) {
  clearRoomTimers(room);
  room.round = "Showdown";
  room.activePlayerIndex = -1;
  room.turnDeadline = 0;
  const evalMap = /* @__PURE__ */ new Map();
  room.players.forEach((p) => {
    if (!p.isFolded) {
      const ev = evaluate7CardHand([...p.cards, ...room.communityCards]);
      evalMap.set(p.id, ev);
      p.handDescription = ev.description;
    }
  });
  const nonFoldedBets = room.players.filter((p) => !p.isFolded && p.totalBetInHand > 0).map((p) => p.totalBetInHand);
  const uniqueLevels = Array.from(new Set(nonFoldedBets)).sort((a, b) => a - b);
  const allWinnerIds = /* @__PURE__ */ new Set();
  const payouts = /* @__PURE__ */ new Map();
  if (uniqueLevels.length === 0) {
    const active = room.players.filter((p) => !p.isFolded);
    let bestScore = -1;
    active.forEach((p) => {
      const sc = evalMap.get(p.id)?.score ?? 0;
      if (sc > bestScore) bestScore = sc;
    });
    const winners = active.filter((p) => (evalMap.get(p.id)?.score ?? 0) === bestScore);
    const share = winners.length > 0 ? Math.floor(room.pot / winners.length) : 0;
    winners.forEach((w) => {
      w.chips += share;
      allWinnerIds.add(w.id);
      payouts.set(w.id, (payouts.get(w.id) || 0) + share);
    });
  } else {
    for (let idx = 0; idx < uniqueLevels.length; idx++) {
      const prevLevel = idx === 0 ? 0 : uniqueLevels[idx - 1];
      const currLevel = uniqueLevels[idx];
      let subPot = 0;
      room.players.forEach((p) => {
        const contribution = Math.max(0, Math.min(p.totalBetInHand, currLevel) - prevLevel);
        subPot += contribution;
        if (idx === uniqueLevels.length - 1 && p.isFolded && p.totalBetInHand > currLevel) {
          subPot += p.totalBetInHand - currLevel;
        }
      });
      if (subPot <= 0) continue;
      const eligible = room.players.filter((p) => !p.isFolded && p.totalBetInHand >= currLevel);
      let maxScore = -1;
      eligible.forEach((p) => {
        const sc = evalMap.get(p.id)?.score ?? -1;
        if (sc > maxScore) maxScore = sc;
      });
      const subWinners = eligible.filter((p) => (evalMap.get(p.id)?.score ?? -1) === maxScore);
      if (subWinners.length > 0) {
        const baseShare = Math.floor(subPot / subWinners.length);
        let remainder = subPot - baseShare * subWinners.length;
        subWinners.forEach((w) => {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder -= 1;
          const totalWon = baseShare + extra;
          w.chips += totalWon;
          allWinnerIds.add(w.id);
          payouts.set(w.id, (payouts.get(w.id) || 0) + totalWon);
        });
      }
    }
  }
  const winnerList = Array.from(allWinnerIds);
  room.winnerIds = winnerList;
  const primaryWinner = room.players.find((p) => p.id === winnerList[0]);
  const primaryDesc = primaryWinner ? evalMap.get(primaryWinner.id)?.description || "" : "";
  const primaryWonAmt = primaryWinner ? payouts.get(primaryWinner.id) || room.pot : room.pot;
  room.winningDescription = primaryDesc;
  room.toastMsg = primaryWinner ? `\u{1F451} [\u644A\u724C\u7ED3\u7B97] ${primaryWinner.name} \u51ED\u501F\u3010${primaryDesc}\u3011\u8D62\u53D6 ${primaryWonAmt} \u5723\u6240\u97F3\u7B26\uFF01` : "\u{1F451} [\u644A\u724C\u7ED3\u7B97] \u672C\u5C40\u7ED3\u675F\uFF01";
  syncRoomAccountsToStore(room, winnerList);
  broadcastGameState(room);
}
function syncRoomAccountsToStore(room, winnerIds) {
  let changed = false;
  room.players.forEach((p) => {
    if (!p.isBot && p.userId && userStore.has(p.userId)) {
      const acc = userStore.get(p.userId);
      acc.chips = p.chips;
      acc.handsPlayed = (acc.handsPlayed || 0) + 1;
      if (winnerIds.includes(p.id)) {
        acc.wins = (acc.wins || 0) + 1;
      } else {
        acc.losses = (acc.losses || 0) + 1;
      }
      acc.updatedAt = Date.now();
      changed = true;
    }
  });
  if (changed) {
    saveDatabase();
  }
}
function createRoomInstance(name, stageId, maxPlayers, initialSeats) {
  const stage = getStageConfig(stageId);
  const roomId = `sanctuary-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    id: roomId,
    name,
    stageId: stage.id,
    maxPlayers: Math.min(5, Math.max(2, maxPlayers || 5)),
    players: initialSeats,
    messages: [],
    status: "WAITING",
    createdAt: Date.now(),
    deck: [],
    communityCards: [],
    pot: 0,
    currentMaxBet: 0,
    round: "Waiting",
    activePlayerIndex: -1,
    dealerIndex: 0,
    sbIndex: 0,
    bbIndex: 1,
    smallBlind: stage.smallBlind,
    bigBlind: stage.bigBlind,
    startChips: stage.startChips,
    handCount: 0,
    winnerIds: [],
    winningDescription: "",
    toastMsg: "\u{1F3B5} \u6B22\u8FCE\u8FDB\u5165\u5723\u6240\u5B9E\u65F6\u8054\u673A\u724C\u684C\uFF01",
    turnDeadline: 0
  };
}
function createSeatFromSession(session, defaultChips) {
  const chips = session.chips > 100 ? session.chips : defaultChips;
  return {
    id: session.id,
    userId: session.userId,
    name: session.name,
    avatar: session.avatar,
    chips,
    currentBet: 0,
    totalBetInHand: 0,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isBot: false,
    hasActedThisRound: false,
    lastAction: "",
    isReady: !!session.isReady,
    isOnline: true,
    ws: session.ws
  };
}
function launchRoomOnlineGame(room, fillWithBots) {
  if (fillWithBots) {
    let botIndex = 0;
    while (room.players.length < room.maxPlayers && botIndex < SERVER_BOT_POOL.length) {
      const botInfo = SERVER_BOT_POOL[botIndex++];
      if (!room.players.some((p) => p.name === botInfo.name)) {
        room.players.push({
          id: `${botInfo.id}_${Math.random().toString(36).substring(2, 5)}`,
          name: botInfo.name,
          avatar: botInfo.avatar,
          chips: room.startChips,
          currentBet: 0,
          totalBetInHand: 0,
          cards: [],
          isFolded: false,
          isAllIn: false,
          isBot: true,
          hasActedThisRound: false,
          lastAction: "",
          isReady: true,
          isOnline: true
        });
      }
    }
  } else if (room.players.length < 2) {
    const botInfo = SERVER_BOT_POOL[0];
    room.players.push({
      id: `${botInfo.id}_${Math.random().toString(36).substring(2, 5)}`,
      name: botInfo.name,
      avatar: botInfo.avatar,
      chips: room.startChips,
      currentBet: 0,
      totalBetInHand: 0,
      cards: [],
      isFolded: false,
      isAllIn: false,
      isBot: true,
      hasActedThisRound: false,
      lastAction: "",
      isReady: true,
      isOnline: true
    });
  }
  startServerHand(room);
  broadcastToRoom(room.id, {
    type: "GAME_STARTED",
    data: {
      roomId: room.id,
      roomName: room.name,
      stageId: room.stageId
    }
  });
  broadcastGameState(room);
  broadcastOnlineStats();
}
function matchmakePlayers() {
  for (let i = waitingQueue.length - 1; i >= 0; i--) {
    const candidate = waitingQueue[i];
    const openRoom = Array.from(rooms.values()).find(
      (r) => r.status === "WAITING" && r.players.length < r.maxPlayers
    );
    if (openRoom && waitingQueue.length === 1) {
      waitingQueue.splice(i, 1);
      candidate.roomId = openRoom.id;
      candidate.isReady = true;
      openRoom.players.push(createSeatFromSession(candidate, openRoom.startChips));
      const lobbyPayload = serializeRoomLobbyData(openRoom);
      broadcastToRoom(openRoom.id, {
        type: "MATCH_FOUND",
        data: lobbyPayload
      });
      broadcastOnlineStats();
      return;
    }
  }
  while (waitingQueue.length >= 2) {
    const matchedSessions = waitingQueue.splice(0, 5);
    const preferredStageId = matchedSessions[0]?.preferredStageId || "music_voyager";
    const stage = getStageConfig(preferredStageId);
    const seats = matchedSessions.map((s) => {
      s.isReady = false;
      return createSeatFromSession(s, stage.startChips);
    });
    const newRoom = createRoomInstance(`${stage.shortTitle} \xB7 \u5723\u6240\u5339\u914D\u684C`, stage.id, 5, seats);
    rooms.set(newRoom.id, newRoom);
    const lobbyData = serializeRoomLobbyData(newRoom);
    matchedSessions.forEach((s) => {
      s.roomId = newRoom.id;
      if (s.ws.readyState === import_ws.WebSocket.OPEN) {
        s.ws.send(JSON.stringify({
          type: "MATCH_FOUND",
          data: lobbyData
        }));
      }
    });
    broadcastOnlineStats();
  }
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    onlinePlayers: sessions.size,
    activeRooms: rooms.size,
    queueLength: waitingQueue.length,
    registeredUsers: userStore.size,
    timestamp: Date.now()
  });
});
app.get("/api/online-stats", (req, res) => {
  res.json({
    onlinePlayers: sessions.size,
    activeRooms: rooms.size,
    queueLength: waitingQueue.length,
    rooms: Array.from(rooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      stageId: r.stageId,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      status: r.status
    }))
  });
});
app.post("/api/user/auth", (req, res) => {
  const { userId, nickname, avatar, email } = req.body;
  let user;
  if (userId && userStore.has(userId)) {
    user = userStore.get(userId);
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (email && !user.email) user.email = email;
    user.updatedAt = Date.now();
  } else {
    const newId = userId || `jj_user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    user = {
      id: newId,
      email: email || void 0,
      username: nickname || `JM_${Math.floor(1e3 + Math.random() * 9e3)}`,
      nickname: nickname || `\u5723\u6240\u4E50\u8FF7_${Math.floor(1e3 + Math.random() * 9e3)}`,
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      chips: 130700,
      level: 1,
      exp: 0,
      wins: 0,
      losses: 0,
      handsPlayed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    userStore.set(user.id, user);
  }
  saveDatabase();
  res.json({ success: true, user: sanitizeUser(user), authToken: signUserToken(user.id) });
});
app.post("/api/user/register", (req, res) => {
  const { email, password, nickname, avatar, currentUserId } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "\u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u7535\u5B50\u90AE\u7BB1\u5730\u5740" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: "\u5BC6\u7801\u957F\u5EA6\u81F3\u5C11\u9700\u4E3A6\u4F4D\u5B57\u7B26" });
  }
  const existingWithEmail = Array.from(userStore.values()).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (existingWithEmail) {
    return res.status(400).json({ success: false, message: "\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C\uFF0C\u8BF7\u76F4\u63A5\u4F7F\u7528\u5BC6\u7801\u767B\u5F55" });
  }
  const hashedPassword = hashPassword(password);
  let user;
  if (currentUserId && userStore.has(currentUserId)) {
    user = userStore.get(currentUserId);
    user.email = email.toLowerCase();
    user.password = hashedPassword;
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    user.updatedAt = Date.now();
  } else {
    const newId = `jj_user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    user = {
      id: newId,
      email: email.toLowerCase(),
      password: hashedPassword,
      username: nickname || email.split("@")[0],
      nickname: nickname || `\u5723\u6240\u4E50\u8FF7_${Math.floor(1e3 + Math.random() * 9e3)}`,
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      chips: 130700,
      level: 1,
      exp: 0,
      wins: 0,
      losses: 0,
      handsPlayed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    userStore.set(user.id, user);
  }
  saveDatabase();
  res.json({
    success: true,
    message: "\u6CE8\u518C\u6210\u529F\uFF0C\u8D60\u9001 130,700 \u5723\u6240\u97F3\u7B26\uFF01\u8D26\u53F7\u5DF2\u52A0\u5BC6\u7ED1\u5B9A\u3002",
    user: sanitizeUser(user),
    authToken: signUserToken(user.id)
  });
});
app.post("/api/user/checkin", (req, res) => {
  const { userId } = req.body;
  if (!userId || !userStore.has(userId)) {
    return res.status(404).json({ success: false, message: "\u8D26\u53F7\u672A\u627E\u5230\uFF0C\u8BF7\u5148\u767B\u5F55\u8D26\u53F7" });
  }
  const user = userStore.get(userId);
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (user.lastCheckinDate === todayStr) {
    return res.json({
      success: false,
      alreadyCheckedIn: true,
      message: "\u60A8\u4ECA\u5929\u5DF2\u7ECF\u7B7E\u8FC7\u5230\u5566\uFF01\u660E\u65E5\u518D\u6765\u9886\u53D6 3,270 \u5723\u6240\u97F3\u7B26\u5427\uFF01",
      user: sanitizeUser(user)
    });
  }
  user.chips = (user.chips || 0) + 3270;
  user.lastCheckinDate = todayStr;
  user.updatedAt = Date.now();
  saveDatabase();
  return res.json({
    success: true,
    alreadyCheckedIn: false,
    reward: 3270,
    message: "\u{1F389} \u6BCF\u65E5\u7B7E\u5230\u6210\u529F\uFF01\u589E\u53D1 3,270 \u5723\u6240\u97F3\u7B26\uFF01",
    user: sanitizeUser(user)
  });
});
app.post("/api/user/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "\u8BF7\u8F93\u5165\u90AE\u7BB1\u548C\u5BC6\u7801" });
  }
  const user = Array.from(userStore.values()).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    return res.status(404).json({ success: false, message: "\u8BE5\u90AE\u7BB1\u5C1A\u672A\u6CE8\u518C\uFF0C\u8BF7\u5148\u6CE8\u518C\u8D26\u53F7" });
  }
  const { valid, needsMigration } = verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: "\u767B\u5F55\u5BC6\u7801\u4E0D\u6B63\u786E\uFF0C\u8BF7\u91CD\u65B0\u8F93\u5165" });
  }
  if (needsMigration) {
    user.password = hashPassword(password);
    user.updatedAt = Date.now();
    saveDatabase();
  }
  res.json({
    success: true,
    message: "\u767B\u5F55\u6210\u529F\uFF01\u5DF2\u8F7D\u5165\u60A8\u7684\u4E91\u7AEF\u8D26\u53F7",
    user: sanitizeUser(user),
    authToken: signUserToken(user.id)
  });
});
app.post("/api/user/delete", (req, res) => {
  const { userId, email } = req.body;
  let deleted = false;
  if (userId && userStore.has(userId)) {
    userStore.delete(userId);
    deleted = true;
  } else if (email) {
    const found = Array.from(userStore.values()).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      userStore.delete(found.id);
      deleted = true;
    }
  }
  if (deleted) {
    saveDatabase();
  }
  res.json({
    success: true,
    message: "\u60A8\u7684\u8D26\u53F7\u53CA\u4E91\u7AEF\u5173\u8054\u6570\u636E\u5DF2\u5F7B\u5E95\u6CE8\u9500\u5E76\u5220\u9664\u3002"
  });
});
app.post("/api/user/chips", (req, res) => {
  const { userId } = req.body;
  if (!userId || !userStore.has(userId)) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const user = userStore.get(userId);
  res.json({ success: true, user: sanitizeUser(user) });
});
app.get("/api/leaderboard", (req, res) => {
  const sorted = Array.from(userStore.values()).sort((a, b) => b.chips - a.chips).slice(0, 20).map((u) => ({
    id: u.id,
    nickname: u.nickname,
    avatar: u.avatar,
    chips: u.chips,
    wins: u.wins,
    losses: u.losses,
    level: u.level
  }));
  res.json({ success: true, leaderboard: sorted });
});
wss.on("connection", (ws) => {
  const playerId = `player_${Math.random().toString(36).substring(2, 9)}`;
  const session = {
    id: playerId,
    name: `JM_${Math.floor(1e3 + Math.random() * 9e3)}`,
    avatar: "\u{1F3A4}",
    chips: 130700,
    ws
  };
  sessions.set(ws, session);
  ws.send(JSON.stringify({
    type: "CONNECTED",
    data: {
      playerId,
      name: session.name,
      chips: session.chips,
      onlinePlayers: sessions.size,
      activeRooms: rooms.size
    }
  }));
  broadcastOnlineStats();
  ws.on("message", (rawMessage) => {
    try {
      const parsed = JSON.parse(rawMessage.toString());
      const { type, payload } = parsed;
      switch (type) {
        case "INIT_USER": {
          const uId = payload?.userId || session.id;
          session.userId = uId;
          let account = userStore.get(uId);
          if (!account) {
            account = {
              id: uId,
              username: payload?.name || session.name,
              nickname: payload?.name || session.name,
              avatar: payload?.avatar || session.avatar,
              chips: 130700,
              // Server-authoritative initial grant; ignores any client-passed chips
              level: 1,
              exp: 0,
              wins: 0,
              losses: 0,
              handsPlayed: 0,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            userStore.set(uId, account);
          } else {
            if (payload?.name) account.nickname = payload.name;
            if (payload?.avatar) account.avatar = payload.avatar;
            account.updatedAt = Date.now();
          }
          saveDatabase();
          session.name = account.nickname;
          session.avatar = account.avatar;
          session.chips = account.chips;
          const targetReconnectRoomId = payload?.reconnectRoomId;
          let reconnectedRoom;
          if (targetReconnectRoomId && rooms.has(targetReconnectRoomId)) {
            reconnectedRoom = rooms.get(targetReconnectRoomId);
          } else {
            reconnectedRoom = Array.from(rooms.values()).find(
              (r) => r.players.some((p) => !p.isBot && p.userId === uId)
            );
          }
          if (reconnectedRoom) {
            const existingSeat = reconnectedRoom.players.find(
              (p) => !p.isBot && (p.userId === uId || p.id === session.id)
            );
            if (existingSeat) {
              session.id = existingSeat.id;
              session.roomId = reconnectedRoom.id;
              existingSeat.ws = ws;
              existingSeat.isOnline = true;
              existingSeat.disconnectedAt = void 0;
              existingSeat.name = session.name;
              existingSeat.avatar = session.avatar;
            }
          }
          ws.send(JSON.stringify({
            type: "USER_UPDATED",
            data: {
              id: session.id,
              userId: account.id,
              name: account.nickname,
              avatar: account.avatar,
              chips: account.chips,
              wins: account.wins,
              losses: account.losses,
              level: account.level
            }
          }));
          if (reconnectedRoom && reconnectedRoom.status === "PLAYING") {
            broadcastGameState(reconnectedRoom);
          }
          break;
        }
        case "SYNC_CHIPS": {
          if (session.userId && userStore.has(session.userId)) {
            const acc = userStore.get(session.userId);
            session.chips = acc.chips;
            ws.send(JSON.stringify({
              type: "USER_UPDATED",
              data: {
                id: session.id,
                userId: acc.id,
                name: acc.nickname,
                avatar: acc.avatar,
                chips: acc.chips,
                wins: acc.wins,
                losses: acc.losses
              }
            }));
          }
          break;
        }
        case "JOIN_MATCHMAKING": {
          if (payload?.stageId) {
            session.preferredStageId = payload.stageId;
          }
          if (!waitingQueue.find((p) => p.id === session.id)) {
            waitingQueue.push(session);
            ws.send(JSON.stringify({
              type: "QUEUE_STATUS",
              data: { inQueue: true, position: waitingQueue.length }
            }));
            matchmakePlayers();
            broadcastOnlineStats();
          }
          break;
        }
        case "LEAVE_MATCHMAKING": {
          const idx = waitingQueue.findIndex((p) => p.id === session.id);
          if (idx !== -1) {
            waitingQueue.splice(idx, 1);
            ws.send(JSON.stringify({
              type: "QUEUE_STATUS",
              data: { inQueue: false, position: 0 }
            }));
            broadcastOnlineStats();
          }
          break;
        }
        case "CREATE_ROOM": {
          const stage = getStageConfig(payload?.stageId);
          session.isReady = false;
          const initialSeat = createSeatFromSession(session, stage.startChips);
          const newRoom = createRoomInstance(
            payload?.name || `${session.name}\u7684\u5723\u6240\u724C\u684C`,
            stage.id,
            payload?.maxPlayers || 5,
            [initialSeat]
          );
          session.roomId = newRoom.id;
          rooms.set(newRoom.id, newRoom);
          ws.send(JSON.stringify({
            type: "ROOM_JOINED",
            data: serializeRoomLobbyData(newRoom)
          }));
          broadcastOnlineStats();
          break;
        }
        case "JOIN_ROOM": {
          const targetRoom = rooms.get(payload?.roomId);
          if (!targetRoom) {
            ws.send(JSON.stringify({ type: "ERROR", message: "\u672A\u627E\u5230\u8BE5\u623F\u95F4\u6216\u623F\u95F4\u5DF2\u89E3\u6563" }));
            break;
          }
          const existingSeat = targetRoom.players.find(
            (p) => p.id === session.id || session.userId && p.userId === session.userId
          );
          if (!existingSeat) {
            const nonBotSeats = targetRoom.players.filter((p) => !p.isBot);
            if (nonBotSeats.length >= targetRoom.maxPlayers) {
              ws.send(JSON.stringify({ type: "ERROR", message: "\u8BE5\u623F\u95F4\u5EA7\u4F4D\u5DF2\u6EE1" }));
              break;
            }
            if (targetRoom.players.length >= targetRoom.maxPlayers) {
              const botIdx = targetRoom.players.findIndex((p) => p.isBot);
              if (botIdx !== -1) {
                targetRoom.players.splice(botIdx, 1);
              }
            }
            session.isReady = false;
            targetRoom.players.push(createSeatFromSession(session, targetRoom.startChips));
          } else {
            existingSeat.ws = ws;
            existingSeat.isOnline = true;
            existingSeat.disconnectedAt = void 0;
            session.id = existingSeat.id;
          }
          session.roomId = targetRoom.id;
          broadcastToRoom(targetRoom.id, {
            type: "ROOM_UPDATED",
            data: serializeRoomLobbyData(targetRoom)
          });
          if (targetRoom.status === "PLAYING") {
            ws.send(JSON.stringify({
              type: "GAME_STARTED",
              data: {
                roomId: targetRoom.id,
                roomName: targetRoom.name,
                stageId: targetRoom.stageId
              }
            }));
            broadcastGameState(targetRoom);
          }
          broadcastOnlineStats();
          break;
        }
        case "LEAVE_ROOM": {
          const rId = payload?.roomId || session.roomId;
          if (rId && rooms.has(rId)) {
            const room = rooms.get(rId);
            const seatIdx = room.players.findIndex((p) => p.id === session.id);
            if (seatIdx !== -1) {
              if (room.status === "PLAYING" && room.round !== "Waiting" && room.round !== "Showdown") {
                room.players[seatIdx].isFolded = true;
                if (room.activePlayerIndex === seatIdx) {
                  advanceTurnOrRound(room);
                }
              }
              room.players.splice(seatIdx, 1);
              if (room.dealerIndex >= room.players.length) {
                room.dealerIndex = 0;
              }
            }
            const remainingHumans = room.players.filter((p) => !p.isBot);
            if (remainingHumans.length === 0) {
              clearRoomTimers(room);
              rooms.delete(room.id);
            } else {
              broadcastToRoom(room.id, {
                type: "ROOM_UPDATED",
                data: serializeRoomLobbyData(room)
              });
              if (room.status === "PLAYING") {
                broadcastGameState(room);
              }
            }
          }
          session.roomId = void 0;
          session.isReady = false;
          ws.send(JSON.stringify({ type: "LEFT_ROOM" }));
          broadcastOnlineStats();
          break;
        }
        case "SEND_CHAT": {
          if (!session.roomId) break;
          const room = rooms.get(session.roomId);
          if (!room) break;
          const msg = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            senderId: session.id,
            senderName: session.name,
            avatar: session.avatar || "\u{1F3A4}",
            text: (payload?.text || "").slice(0, 200),
            timestamp: Date.now()
          };
          room.messages.push(msg);
          if (room.messages.length > 50) room.messages.shift();
          broadcastToRoom(room.id, {
            type: "NEW_CHAT_MESSAGE",
            data: msg
          });
          break;
        }
        case "TOGGLE_READY": {
          if (!session.roomId) break;
          const room = rooms.get(session.roomId);
          if (!room) break;
          session.isReady = !session.isReady;
          const seat = room.players.find((p) => p.id === session.id);
          if (seat) {
            seat.isReady = session.isReady;
          }
          const humanSeats = room.players.filter((p) => !p.isBot);
          const allReady = humanSeats.length >= 2 && humanSeats.every((p) => p.isReady);
          broadcastToRoom(room.id, {
            type: "PLAYER_READY_CHANGED",
            data: {
              playerId: session.id,
              isReady: session.isReady,
              allReady,
              players: serializeRoomLobbyData(room).players
            }
          });
          if (allReady && room.status === "WAITING") {
            setTimeout(() => {
              if (rooms.has(room.id) && room.status === "WAITING") {
                launchRoomOnlineGame(room, false);
              }
            }, 600);
          }
          break;
        }
        case "START_ONLINE_GAME": {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;
          const fillWithBots = !!payload?.fillWithBots;
          launchRoomOnlineGame(room, fillWithBots);
          break;
        }
        case "PLAYER_ACTION": {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;
          const action = payload?.action;
          const raiseAmount = payload?.raiseAmount;
          if (["fold", "check", "call", "raise", "allin"].includes(action)) {
            processPlayerAction(room, session.id, action, raiseAmount);
          }
          break;
        }
        case "NEXT_HAND": {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;
          if (room.round === "Showdown" || room.round === "Waiting") {
            startServerHand(room);
          }
          break;
        }
        case "GET_GAME_STATE": {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;
          broadcastGameState(room);
          break;
        }
        case "PING": {
          ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error("WebSocket Error processing message:", err);
    }
  });
  ws.on("close", () => {
    const idx = waitingQueue.findIndex((p) => p.id === session.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);
    if (session.roomId) {
      const room = rooms.get(session.roomId);
      if (room) {
        const seat = room.players.find((p) => p.id === session.id);
        if (room.status === "PLAYING" && seat) {
          seat.isOnline = false;
          seat.disconnectedAt = Date.now();
          const anyOnlineHumans = room.players.some((p) => !p.isBot && p.isOnline);
          if (!anyOnlineHumans) {
            setTimeout(() => {
              const currentRoom = rooms.get(room.id);
              if (currentRoom && !currentRoom.players.some((p) => !p.isBot && p.isOnline)) {
                clearRoomTimers(currentRoom);
                rooms.delete(room.id);
                broadcastOnlineStats();
              }
            }, 3e4);
          } else {
            broadcastGameState(room);
          }
        } else {
          room.players = room.players.filter((p) => p.id !== session.id);
          const remainingHumans = room.players.filter((p) => !p.isBot);
          if (remainingHumans.length === 0) {
            clearRoomTimers(room);
            rooms.delete(session.roomId);
          } else {
            broadcastToRoom(room.id, {
              type: "ROOM_UPDATED",
              data: serializeRoomLobbyData(room)
            });
          }
        }
      }
    }
    sessions.delete(ws);
    broadcastOnlineStats();
  });
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(ROOT_DIR, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, HOST, () => {
    console.log(`[Final Sanctuary Server] Running on http://${HOST}:${PORT}`);
    console.log(`[WebSocket] Authoritative Texas Hold'em Engine listening on /ws`);
  });
}
setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
