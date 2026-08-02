/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from '../types';

export interface HandEvaluation {
  score: number; // Numeric score for easy comparison
  handType: string; // "皇家同花顺", "同花顺", "四条", "葫芦", "同花", "顺子", "三条", "两对", "一对", "高牌"
  description: string; // e.g., "葫芦 (K三带Q对)"
  cards: Card[]; // The 5 cards that make up the hand
}

// Map of card value to friendly display names
const cardValueToName: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

function getCardName(val: number): string {
  return cardValueToName[val] || val.toString();
}

/**
 * Evaluates a strict 5-card poker hand.
 */
export function evaluate5CardHand(cards: Card[]): HandEvaluation {
  // Sort descending by card value
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  
  // Check Flush
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);
  
  // Check Straight
  let isStraight = false;
  let straightHighValue = 0;
  
  // Standard straight check
  const values = sorted.map(c => c.value);
  const uniqueValues = Array.from(new Set(values));
  
  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHighValue = uniqueValues[0];
    } else if (
      uniqueValues[0] === 14 && // Ace
      uniqueValues[1] === 5 &&
      uniqueValues[2] === 4 &&
      uniqueValues[3] === 3 &&
      uniqueValues[4] === 2
    ) {
      // Ace-low straight (A-2-3-4-5)
      isStraight = true;
      straightHighValue = 5;
    }
  }

  // Value frequency count
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  
  // Sort frequencies
  const freqPairs = Object.entries(counts).map(([val, count]) => ({
    val: parseInt(val),
    count
  })).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.val - a.val; // secondary sort by card value descending
  });

  const freqs = freqPairs.map(p => p.count);
  
  // Base Hand Rank classes:
  // 9: Royal Flush
  // 8: Straight Flush
  // 7: Four of a Kind
  // 6: Full House
  // 5: Flush
  // 4: Straight
  // 3: Three of a Kind
  // 2: Two Pair
  // 1: One Pair
  // 0: High Card

  let handType = "高牌";
  let rankClass = 0;
  let scoreParts: number[] = [];
  let description = "";

  if (isFlush && isStraight) {
    if (straightHighValue === 14) {
      rankClass = 9;
      handType = "皇家同花顺";
      description = "至尊皇家同花顺";
    } else {
      rankClass = 8;
      handType = "同花顺";
      description = `同花顺 (${getCardName(straightHighValue)}高)`;
    }
    scoreParts = [straightHighValue];
  } else if (freqs[0] === 4) {
    rankClass = 7;
    handType = "四条";
    const quadVal = freqPairs[0].val;
    const kickerVal = freqPairs[1].val;
    description = `四条 (${getCardName(quadVal)}四带一)`;
    scoreParts = [quadVal, kickerVal];
  } else if (freqs[0] === 3 && freqs[1] === 2) {
    rankClass = 6;
    handType = "葫芦";
    const tripleVal = freqPairs[0].val;
    const pairVal = freqPairs[1].val;
    description = `葫芦 (${getCardName(tripleVal)}三带${getCardName(pairVal)}对)`;
    scoreParts = [tripleVal, pairVal];
  } else if (isFlush) {
    rankClass = 5;
    handType = "同花";
    description = `同花 (${getCardName(sorted[0].value)}高)`;
    scoreParts = sorted.map(c => c.value);
  } else if (isStraight) {
    rankClass = 4;
    handType = "顺子";
    description = `顺子 (${getCardName(straightHighValue)}高)`;
    scoreParts = [straightHighValue];
  } else if (freqs[0] === 3) {
    rankClass = 3;
    handType = "三条";
    const tripleVal = freqPairs[0].val;
    const k1 = freqPairs[1].val;
    const k2 = freqPairs[2].val;
    description = `三条 (${getCardName(tripleVal)}三张)`;
    scoreParts = [tripleVal, k1, k2];
  } else if (freqs[0] === 2 && freqs[1] === 2) {
    rankClass = 2;
    handType = "两对";
    const p1 = freqPairs[0].val;
    const p2 = freqPairs[1].val;
    const kicker = freqPairs[2].val;
    description = `两对 (${getCardName(p1)}对和${getCardName(p2)}对)`;
    scoreParts = [p1, p2, kicker];
  } else if (freqs[0] === 2) {
    rankClass = 1;
    handType = "一对";
    const p = freqPairs[0].val;
    const k1 = freqPairs[1].val;
    const k2 = freqPairs[2].val;
    const k3 = freqPairs[3].val;
    description = `一对 (${getCardName(p)}对子)`;
    scoreParts = [p, k1, k2, k3];
  } else {
    rankClass = 0;
    handType = "高牌";
    description = `高牌 (${getCardName(sorted[0].value)}高)`;
    scoreParts = sorted.map(c => c.value);
  }

  // Calculate final score as a single comparable number
  // Formula: rankClass * 1,000,000 + weighted sum of scoreParts
  // We have up to 5 score parts, each fits in 4 bits (0-15), so we can shift or weight them
  let tieBreaker = 0;
  for (let i = 0; i < 5; i++) {
    const val = scoreParts[i] || 0;
    tieBreaker += val * Math.pow(15, 4 - i);
  }
  const score = rankClass * 10000000 + tieBreaker;

  return {
    score,
    handType,
    description,
    cards: sorted
  };
}

/**
 * Generates all subsets of size k from an array.
 */
function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  function helper(start: number, path: T[]) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      path.push(arr[i]);
      helper(i + 1, path);
      path.pop();
    }
  }
  helper(0, []);
  return result;
}

/**
 * Helper to check if a card is in a given list of cards.
 */
export function isCardInHand(card?: Card, handCards?: Card[]): boolean {
  if (!card || !handCards) return false;
  return handCards.some(c => c.suit === card.suit && c.value === card.value);
}

/**
 * Evaluates the best poker hand from a set of 2 to 7 cards.
 */
export function evaluate7CardHand(cards: Card[]): HandEvaluation {
  if (!cards || cards.length === 0) {
    return {
      score: 0,
      handType: "等待发牌",
      description: "等待发牌",
      cards: []
    };
  }

  if (cards.length < 5) {
    // Evaluate 2 to 4 cards (e.g. PreFlop pocket cards)
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const counts: Record<number, number> = {};
    for (const c of sorted) {
      counts[c.value] = (counts[c.value] || 0) + 1;
    }
    const pairs = Object.entries(counts).map(([v, count]) => ({ val: parseInt(v), count })).sort((a, b) => b.count - a.count || b.val - a.val);

    if (pairs[0].count === 4) {
      const quadVal = pairs[0].val;
      return {
        score: 70000000 + quadVal * 10000,
        handType: "四条",
        description: `四条 (${getCardName(quadVal)}四金刚)`,
        cards: sorted.filter(c => c.value === quadVal)
      };
    } else if (pairs[0].count === 3) {
      const tripVal = pairs[0].val;
      return {
        score: 30000000 + tripVal * 10000,
        handType: "三条",
        description: `三条 (${getCardName(tripVal)}三张)`,
        cards: sorted.filter(c => c.value === tripVal)
      };
    } else if (pairs[0].count === 2) {
      const pairVal = pairs[0].val;
      const secondPair = pairs[1]?.count === 2 ? pairs[1].val : null;
      if (secondPair) {
        return {
          score: 20000000 + pairVal * 10000 + secondPair * 100,
          handType: "两对",
          description: `两对 (${getCardName(pairVal)}对和${getCardName(secondPair)}对)`,
          cards: sorted.filter(c => c.value === pairVal || c.value === secondPair)
        };
      }
      return {
        score: 10000000 + pairVal * 10000,
        handType: "一对",
        description: `一对 (${getCardName(pairVal)}对子)`,
        cards: sorted.filter(c => c.value === pairVal)
      };
    } else {
      const high = sorted[0];
      return {
        score: high.value * 100,
        handType: "高牌",
        description: `高牌 (${getCardName(high.value)}高)`,
        cards: [high]
      };
    }
  }

  // Generate all 5-card combinations for 5-7 cards
  const allCombos = combinations(cards, 5);
  let bestEval: HandEvaluation | null = null;

  for (const combo of allCombos) {
    const evaluation = evaluate5CardHand(combo);
    if (!bestEval || evaluation.score > bestEval.score) {
      bestEval = evaluation;
    }
  }

  return bestEval!;
}
