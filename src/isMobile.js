export function detectMobile() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const ua = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent);
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  return (coarse && touch) || ua || (touch && small);
}
