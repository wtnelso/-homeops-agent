// HomeOps PWA Registration and Touch Optimizations
console.log('🚀 HomeOps PWA: Initializing...');

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('📱 HomeOps PWA: Registering Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('✅ HomeOps PWA: Service Worker registered:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 HomeOps PWA: New version available');
            showUpdateNotification();
          }
        });
      });
      
      // Enable background sync for calendar
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        console.log('✅ HomeOps PWA: Background sync supported');
        registration.sync.register('calendar-sync');
      }
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 HomeOps PWA: Notification permission:', permission);
      }
      
    } catch (error) {
      console.error('❌ HomeOps PWA: Service Worker registration failed:', error);
    }
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 HomeOps PWA: Install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

// Show install button
function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
    Install App
  `;
  installBtn.className = 'pwa-install-btn';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    cursor: pointer;
    z-index: 1000;
    transition: all 0.2s;
    min-height: 44px;
  `;
  
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('📱 HomeOps PWA: Install outcome:', outcome);
      deferredPrompt = null;
      installBtn.remove();
    }
  });
  
  document.body.appendChild(installBtn);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (installBtn.parentNode) {
      installBtn.style.opacity = '0';
      setTimeout(() => installBtn.remove(), 300);
    }
  }, 10000);
}

// Show update notification
function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span>New version available!</span>
      <button onclick="updateApp()" style="
        background: white;
        color: #8b5cf6;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      ">Update</button>
    </div>
  `;
  updateBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #8b5cf6;
    color: white;
    padding: 12px 20px;
    text-align: center;
    font-size: 14px;
    z-index: 1001;
  `;
  
  document.body.appendChild(updateBanner);
}

// Update app function
window.updateApp = () => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
};

// Touch Optimizations
document.addEventListener('DOMContentLoaded', () => {
  console.log('👆 HomeOps PWA: Applying touch optimizations...');
  
  // Prevent zoom on input focus (iOS)
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
      input.style.fontSize = '16px';
    }
  });
  
  // Add touch feedback to interactive elements
  const interactiveElements = document.querySelectorAll('button, .clickable, [onclick], a');
  interactiveElements.forEach(element => {
    // Ensure minimum touch target size
    const computedStyle = getComputedStyle(element);
    const minSize = 44; // iOS HIG recommendation
    
    if (parseInt(computedStyle.height) < minSize) {
      element.style.minHeight = minSize + 'px';
    }
    if (parseInt(computedStyle.width) < minSize) {
      element.style.minWidth = minSize + 'px';
    }
    
    // Add touch feedback
    element.addEventListener('touchstart', function() {
      this.style.opacity = '0.7';
      this.style.transform = 'scale(0.98)';
    });
    
    element.addEventListener('touchend', function() {
      this.style.opacity = '';
      this.style.transform = '';
    });
    
    element.addEventListener('touchcancel', function() {
      this.style.opacity = '';
      this.style.transform = '';
    });
  });
  
  // Pull-to-refresh simulation
  let startY = 0;
  let pullDistance = 0;
  const pullThreshold = 100;
  
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0) {
      pullDistance = e.touches[0].clientY - startY;
      if (pullDistance > 0) {
        const pullIndicator = document.getElementById('pull-indicator');
        if (pullIndicator) {
          pullIndicator.style.transform = `translateY(${Math.min(pullDistance / 2, 50)}px)`;
          pullIndicator.style.opacity = Math.min(pullDistance / pullThreshold, 1);
        }
      }
    }
  }, { passive: true });
  
  document.addEventListener('touchend', () => {
    if (pullDistance > pullThreshold && window.scrollY === 0) {
      console.log('🔄 HomeOps PWA: Pull-to-refresh triggered');
      window.location.reload();
    }
    pullDistance = 0;
    const pullIndicator = document.getElementById('pull-indicator');
    if (pullIndicator) {
      pullIndicator.style.transform = '';
      pullIndicator.style.opacity = '';
    }
  }, { passive: true });
  
  // Swipe navigation
  let touchStartX = 0;
  let touchStartY = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        // Swipe right - go to previous view
        console.log('👈 HomeOps PWA: Swipe right detected');
        navigatePrevious();
      } else {
        // Swipe left - go to next view
        console.log('👉 HomeOps PWA: Swipe left detected');
        navigateNext();
      }
    }
  }, { passive: true });
});

// Navigation functions for swipe gestures
function navigatePrevious() {
  const currentView = document.querySelector('.view.active');
  if (currentView) {
    const viewId = currentView.id;
    const viewOrder = ['chat-view', 'dashboard-view', 'calendar-view'];
    const currentIndex = viewOrder.indexOf(viewId);
    if (currentIndex > 0) {
      const prevView = viewOrder[currentIndex - 1];
      if (window.activateView) {
        window.activateView(prevView.replace('-view', ''));
      }
    }
  }
}

function navigateNext() {
  const currentView = document.querySelector('.view.active');
  if (currentView) {
    const viewId = currentView.id;
    const viewOrder = ['chat-view', 'dashboard-view', 'calendar-view'];
    const currentIndex = viewOrder.indexOf(viewId);
    if (currentIndex < viewOrder.length - 1) {
      const nextView = viewOrder[currentIndex + 1];
      if (window.activateView) {
        window.activateView(nextView.replace('-view', ''));
      }
    }
  }
}

// Haptic feedback (if supported)
function hapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
}

// Add haptic feedback to buttons
document.addEventListener('click', (e) => {
  if (e.target.matches('button, .button, [role="button"]')) {
    hapticFeedback('light');
  }
});

console.log('✅ HomeOps PWA: Touch optimizations applied');
