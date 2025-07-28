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

// DISABLED: PWA Install Prompt (focusing on web app experience)
// This will be a browser-based web app, not a downloadable app
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 HomeOps: Install prompt suppressed for web app focus');
  e.preventDefault();
  // Don't show install button for web app experience
});

// DISABLED: Show install button (focusing on web app experience)
function showInstallButton() {
  // No install button for web app experience
  console.log('📱 HomeOps: Install button disabled for web app focus');
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
  
  // DISABLED: Pull-to-refresh (was too sensitive and awkward)
  // User feedback: "completely awkward and way too sensitive"
  
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
