

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);


// Custom touch-to-click handler for iOS (FastClick replacement)
// Run on Native Platform OR on Mobile Web (iPhone/Android)
const isMobileWeb = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

if (isNative || isMobileWeb) {
  console.log('🔍 DIAGNOSTIC: Enabling custom touch handler (isNative:', isNative, 'isMobileWeb:', isMobileWeb, ')');

  //Modern touch-to-click converter
  let touchStartTime = 0;
  let touchStartTarget: EventTarget | null = null;

  document.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    touchStartTarget = e.target;
    console.log('👆 TOUCHSTART:', (e.target as HTMLElement)?.tagName);
  }, true);

  document.addEventListener('touchend', (e) => {
    const touchDuration = Date.now() - touchStartTime;
    console.log('✋ TOUCHEND:', (e.target as HTMLElement)?.tagName, `Duration: ${touchDuration}ms`);

    // Only fire click if it was a quick tap (< 200ms) and on the same element
    if (touchDuration < 200 && touchStartTarget === e.target) {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      // Don't prevent default for input elements - they need native focus behavior
      const isInputElement = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

      if (isInputElement) {
        console.log('⌨️  ALLOWING NATIVE FOCUS for:', target.tagName);
        return; // Let native behavior handle inputs
      }

      e.preventDefault(); // Prevent the delayed click for non-input elements

      // Create and dispatch a synthetic click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        composed: true
      });

      target.dispatchEvent(clickEvent);
      console.log('🔵 SYNTHETIC CLICK fired for:', target.tagName);
    }
  }, true);

  console.log('✅ Custom touch-to-click handler initialized');
}
