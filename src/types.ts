/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades

export interface Card {
  suit: Suit;
  value: number; // 2 - 14 (11=J, 12=Q, 13=K, 14=A)
}

export type Round = 'PreFlop' | 'Flop' | 'Turn' | 'River' | 'Showdown' | 'Waiting';

export interface Player {
  id: string;
  name: string;
  avatar: string; // Avatar seed or path
  chips: number;
  currentBet: number;
  cards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  isBot: boolean;
  lastAction: string; // 'Check', 'Call', 'Raise', 'Fold', 'All-In', etc.
  handDescription?: string;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentMaxBet: number;
  round: Round;
  activePlayerIndex: number;
  dealerIndex: number;
  sbIndex: number;
  bbIndex: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  log: string[];
  winnerIds: string[];
  winningDescription: string;
}

export type StageLightMode = 'purple' | 'blue' | 'red' | 'rainbow';

export interface ConcertSong {
  id: string;
  title: string;
  album: string;
  duration: string;
  lyrics: string[];
}

export interface ChipConfig {
  value: number;
  city: string;
  color: string;
  accentColor: string;
  iconType: string;
}
