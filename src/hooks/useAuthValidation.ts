import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { checkPasswordBreachCached } from '@/utils/validators';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://api.ohcselibrary.xyz/api/v1'
  : '/api/v1';

// ============================================================================
// Email Availability Check Hook
// ============================================================================

interface EmailCheckResult {
  available: boolean;
  isGovEmail: boolean;
  message: string;
}

interface UseEmailAvailabilityResult {
  isChecking: boolean;
  result: EmailCheckResult | null;
  error: string | null;
}

/**
 * Hook to check email availability with debouncing
 * @param email - The email to check
 * @param debounceMs - Debounce delay in milliseconds (default: 500ms)
 */
export function useEmailAvailability(
  email: string,
  debounceMs: number = 500
): UseEmailAvailabilityResult {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EmailCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedEmail = useDebounce(email, debounceMs);

  useEffect(() => {
    // Reset if email is empty or too short
    if (!debouncedEmail || debouncedEmail.length < 5) {
      setResult(null);
      setError(null);
      return;
    }

    // Basic email format check before API call
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(debouncedEmail)) {
      setResult(null);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const checkEmail = async () => {
      setIsChecking(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/auth/check-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: debouncedEmail.toLowerCase() }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            setError('Too many requests. Please wait a moment.');
            return;
          }
          throw new Error('Failed to check email');
        }

        const data = await response.json() as EmailCheckResult;
        setResult(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return; // Request was cancelled
        }
        setError('Unable to verify email availability');
        console.error('Email check error:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkEmail();

    return () => {
      abortController.abort();
    };
  }, [debouncedEmail]);

  return { isChecking, result, error };
}

// ============================================================================
// Password Breach Check Hook
// ============================================================================

interface PasswordBreachResult {
  breached: boolean;
  count: number;
}

interface UsePasswordBreachCheckResult {
  isChecking: boolean;
  result: PasswordBreachResult | null;
  error: string | null;
}

/**
 * Hook to check if password has been exposed in data breaches
 * Uses HaveIBeenPwned API with k-anonymity
 * @param password - The password to check
 * @param debounceMs - Debounce delay in milliseconds (default: 800ms)
 * @param minLength - Minimum password length before checking (default: 8)
 */
export function usePasswordBreachCheck(
  password: string,
  debounceMs: number = 800,
  minLength: number = 8
): UsePasswordBreachCheckResult {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PasswordBreachResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedPassword = useDebounce(password, debounceMs);

  useEffect(() => {
    // Don't check short passwords
    if (!debouncedPassword || debouncedPassword.length < minLength) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const checkPassword = async () => {
      setIsChecking(true);
      setError(null);

      try {
        const breachResult = await checkPasswordBreachCached(debouncedPassword);
        if (!cancelled) {
          setResult(breachResult);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to check password security');
          console.error('Password breach check error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    checkPassword();

    return () => {
      cancelled = true;
    };
  }, [debouncedPassword, minLength]);

  return { isChecking, result, error };
}

// ============================================================================
// Turnstile Hook
// ============================================================================

interface UseTurnstileResult {
  token: string | null;
  isReady: boolean;
  reset: () => void;
  error: string | null;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: Error) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

/**
 * Hook to integrate Cloudflare Turnstile
 * @param siteKey - The Turnstile site key
 * @param containerId - The ID of the container element
 */
export function useTurnstile(
  siteKey: string | undefined,
  containerId: string = 'turnstile-container'
): UseTurnstileResult {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setToken(null);
    setError(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    // Skip if no site key provided
    if (!siteKey) {
      setIsReady(true); // Mark as ready so form can proceed without Turnstile
      return;
    }

    const initTurnstile = () => {
      const container = document.getElementById(containerId);
      if (!container || !window.turnstile) return;

      // Clear existing widget if any
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (newToken: string) => {
          setToken(newToken);
          setError(null);
        },
        'error-callback': () => {
          setError('Verification failed. Please try again.');
          setToken(null);
        },
        'expired-callback': () => {
          setToken(null);
        },
        theme: 'auto',
        size: 'normal',
      });

      setIsReady(true);
    };

    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      initTurnstile();
    } else {
      // Load Turnstile script
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;

      window.onTurnstileLoad = initTurnstile;

      document.body.appendChild(script);

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
        script.remove();
        delete window.onTurnstileLoad;
      };
    }
  }, [siteKey, containerId]);

  return { token, isReady, reset, error };
}

// ============================================================================
// Combined Registration Validation Hook
// ============================================================================

interface RegistrationValidation {
  email: {
    isChecking: boolean;
    isAvailable: boolean | null;
    isGovEmail: boolean | null;
    message: string | null;
  };
  password: {
    isChecking: boolean;
    isBreached: boolean | null;
    breachCount: number | null;
  };
  turnstile: {
    token: string | null;
    isReady: boolean;
    reset: () => void;
  };
  isValidating: boolean;
}

/**
 * Combined hook for all registration validations
 */
export function useRegistrationValidation(
  email: string,
  password: string,
  turnstileSiteKey?: string
): RegistrationValidation {
  const emailCheck = useEmailAvailability(email);
  const passwordCheck = usePasswordBreachCheck(password);
  const turnstile = useTurnstile(turnstileSiteKey);

  return {
    email: {
      isChecking: emailCheck.isChecking,
      isAvailable: emailCheck.result?.available ?? null,
      isGovEmail: emailCheck.result?.isGovEmail ?? null,
      message: emailCheck.result?.message || emailCheck.error || null,
    },
    password: {
      isChecking: passwordCheck.isChecking,
      isBreached: passwordCheck.result?.breached ?? null,
      breachCount: passwordCheck.result?.count ?? null,
    },
    turnstile: {
      token: turnstile.token,
      isReady: turnstile.isReady,
      reset: turnstile.reset,
    },
    isValidating: emailCheck.isChecking || passwordCheck.isChecking,
  };
}
