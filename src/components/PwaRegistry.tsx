'use client';
import { useEffect } from 'react';

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Hủy đăng ký tất cả các Service Worker cũ để xoá bộ nhớ đệm
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('SW unregistered to clear old cache: ', registration);
        }
      });
    }
  }, []);

  return null;
}
