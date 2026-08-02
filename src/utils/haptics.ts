/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * iOS & Mobile Haptic Feedback Utility
 * Uses Web Vibration API with iOS/Android fallbacks
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'win';

export const triggerHaptic = (type: HapticType = 'light') => {
  if (typeof window === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(35);
          break;
        case 'success':
          navigator.vibrate([15, 30, 15]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'win':
          navigator.vibrate([20, 40, 20, 40, 50]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  } catch (e) {
    // Ignore permissions or unsupported errors quietly
  }
};
