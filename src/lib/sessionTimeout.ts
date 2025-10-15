// Session timeout management
import { supabase } from './supabase';

export interface SessionTimeoutConfig {
  idleTimeoutMs: number;
  warningBeforeMs: number;
  checkIntervalMs: number;
  enabled: boolean;
}

export interface SessionTimeoutCallbacks {
  onWarning?: (secondsRemaining: number) => void;
  onTimeout?: () => void;
  onActivity?: () => void;
  onExtend?: () => void;
}

export class SessionTimeoutManager {
  private config: SessionTimeoutConfig;
  private callbacks: SessionTimeoutCallbacks;
  private lastActivity: number;
  private warningTimer: NodeJS.Timeout | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private checkTimer: NodeJS.Timeout | null = null;
  private isWarningShown: boolean = false;
  private isDestroyed: boolean = false;

  // Default configuration
  private static readonly DEFAULT_CONFIG: SessionTimeoutConfig = {
    idleTimeoutMs: 60 * 60 * 1000, // 1 hour
    warningBeforeMs: 5 * 60 * 1000, // 5 minutes before timeout
    checkIntervalMs: 30 * 1000, // Check every 30 seconds
    enabled: true
  };

  constructor(
    callbacks: SessionTimeoutCallbacks = {},
    config: Partial<SessionTimeoutConfig> = {}
  ) {
    this.config = { ...SessionTimeoutManager.DEFAULT_CONFIG, ...config };
    this.callbacks = {
      onWarning: callbacks.onWarning || (() => {}),
      onTimeout: callbacks.onTimeout || (() => {}),
      onActivity: callbacks.onActivity || (() => {}),
      onExtend: callbacks.onExtend || (() => {})
    };
    this.lastActivity = Date.now();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    // Listen for user activity
    this.addActivityListeners();

    // Start monitoring
    this.startMonitoring();

    // Listen for Supabase auth events
    this.setupAuthListener();
  }

  private addActivityListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll',
      'touchstart', 'click', 'focus', 'blur'
    ];

    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });

    // Also listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private removeActivityListeners(): void {
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll',
      'touchstart', 'click', 'focus', 'blur'
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleActivity = (): void => {
    if (this.isDestroyed) return;

    this.lastActivity = Date.now();

    // Clear warning if shown
    if (this.isWarningShown) {
      this.clearWarning();
    }

    if (this.callbacks.onActivity) {
      this.callbacks.onActivity();
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // User returned to tab - count as activity
      this.handleActivity();
    }
  };

  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      if (this.isDestroyed) return;

      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;
      const timeUntilTimeout = this.config.idleTimeoutMs - timeSinceActivity;
      const timeUntilWarning = this.config.idleTimeoutMs - this.config.warningBeforeMs - timeSinceActivity;

      // Check if timeout should trigger
      if (timeUntilTimeout <= 0) {
        this.triggerTimeout();
        return;
      }

      // Check if warning should be shown
      if (timeUntilWarning <= 0 && !this.isWarningShown) {
        this.showWarning(Math.ceil(timeUntilTimeout / 1000));
      }

      // Update warning countdown if already shown
      if (this.isWarningShown && this.callbacks.onWarning) {
        this.callbacks.onWarning(Math.ceil(timeUntilTimeout / 1000));
      }
    }, this.config.checkIntervalMs);
  }

  private showWarning(secondsRemaining: number): void {
    this.isWarningShown = true;
    if (this.callbacks.onWarning) {
      this.callbacks.onWarning(secondsRemaining);
    }
  }

  private clearWarning(): void {
    this.isWarningShown = false;
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private triggerTimeout(): void {
    this.clearTimers();
    if (this.callbacks.onTimeout) {
      this.callbacks.onTimeout();
    }
    this.signOut();
  }

  private setupAuthListener(): void {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.destroy();
      } else if (event === 'TOKEN_REFRESHED') {
        // Reset activity on token refresh
        this.resetTimeout();
      }
    });
  }

  private clearTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  // Public methods
  public resetTimeout(): void {
    this.lastActivity = Date.now();
    this.clearWarning();
  }

  public extendSession(): void {
    this.resetTimeout();
    if (this.callbacks.onExtend) {
      this.callbacks.onExtend();
    }
  }

  public getTimeRemaining(): number {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeRemaining = this.config.idleTimeoutMs - timeSinceActivity;
    return Math.max(0, timeRemaining);
  }

  public isActive(): boolean {
    return this.getTimeRemaining() > 0;
  }

  public async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even if signout fails
      window.location.href = '/login';
    }
  }

  public updateConfig(newConfig: Partial<SessionTimeoutConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (!this.config.enabled) {
      this.destroy();
    } else if (this.isDestroyed) {
      this.initialize();
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clearTimers();
    this.removeActivityListeners();
  }
}

// React hook for session timeout
export const useSessionTimeout = (
  enabled: boolean = true,
  config: Partial<SessionTimeoutConfig> = {}
) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [sessionManager, setSessionManager] = useState<SessionTimeoutManager | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (sessionManager) {
        sessionManager.destroy();
        setSessionManager(null);
      }
      return;
    }

    const callbacks: SessionTimeoutCallbacks = {
      onWarning: (secondsRemaining: number) => {
        setTimeRemaining(secondsRemaining);
        setIsWarningVisible(true);
      },
      onTimeout: () => {
        setIsWarningVisible(false);
        setTimeRemaining(null);
        // Show user a message that they've been logged out
        alert('Your session has expired due to inactivity. You will be redirected to the login page.');
      },
      onActivity: () => {
        setIsWarningVisible(false);
        setTimeRemaining(null);
      },
      onExtend: () => {
        setIsWarningVisible(false);
        setTimeRemaining(null);
      }
    };

    const manager = new SessionTimeoutManager(callbacks, config);
    setSessionManager(manager);

    return () => {
      manager.destroy();
    };
  }, [enabled, config]);

  const extendSession = () => {
    if (sessionManager) {
      sessionManager.extendSession();
    }
  };

  const getRemainingTime = () => {
    return sessionManager ? sessionManager.getTimeRemaining() : 0;
  };

  return {
    timeRemaining,
    isWarningVisible,
    extendSession,
    getRemainingTime,
    isActive: sessionManager?.isActive() ?? false
  };
};

// Import React hooks
import { useState, useEffect } from 'react';