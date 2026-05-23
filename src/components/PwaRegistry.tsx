'use client';
import { useEffect } from 'react';

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Chỉ đăng ký khi là production để tránh lỗi webpack dev server
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').then(
            function(registration) {
              console.log('SW registration successful with scope: ', registration.scope);
            },
            function(err) {
              console.log('SW registration failed: ', err);
            }
          );
        });
      } else {
        // Trong dev mode, huỷ đăng ký SW để tránh treo trình duyệt
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }
    }
  }, []);

  return null;
}
