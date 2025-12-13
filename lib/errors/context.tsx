/**
 * Error Context Utility
 * L5.2.3 - Enhanced error context for observability
 * 
 * Provides structured error context collection for debugging,
 * including user state, environment info, and breadcrumbs.
 */

'use client';

import { createContext, useContext, useCallback, useRef, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface Breadcrumb {
  type: 'navigation' | 'click' | 'api' | 'console' | 'custom';
  category: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  organizationId?: string;
}

export interface EnvironmentContext {
  url: string;
  userAgent: string;
  language: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  online: boolean;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface ErrorContext {
  user: UserContext;
  environment: EnvironmentContext;
  breadcrumbs: Breadcrumb[];
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  release?: string;
  sessionId: string;
}

export interface ErrorContextState {
  setUser: (user: UserContext) => void;
  clearUser: () => void;
  addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => void;
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  getContext: () => ErrorContext;
  captureException: (error: Error, extra?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_BREADCRUMBS = 50;
const SESSION_ID = typeof crypto !== 'undefined' 
  ? crypto.randomUUID() 
  : Math.random().toString(36).substring(2);

// ============================================
// CONTEXT
// ============================================

const ErrorContextReact = createContext<ErrorContextState | null>(null);

// ============================================
// UTILITIES
// ============================================

function getEnvironmentContext(): EnvironmentContext {
  if (typeof window === 'undefined') {
    return {
      url: '',
      userAgent: '',
      language: '',
      platform: '',
      screenWidth: 0,
      screenHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      devicePixelRatio: 1,
      online: true,
    };
  }

  const env: EnvironmentContext = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    online: navigator.onLine,
  };

  // Memory info (Chrome only)
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    env.memory = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  return env;
}

// ============================================
// PROVIDER
// ============================================

interface ErrorContextProviderProps {
  children: ReactNode;
  release?: string;
  initialUser?: UserContext;
  onError?: (error: Error, context: ErrorContext) => void;
}

export function ErrorContextProvider({
  children,
  release,
  initialUser,
  onError,
}: ErrorContextProviderProps) {
  const userRef = useRef<UserContext>(initialUser || {});
  const breadcrumbsRef = useRef<Breadcrumb[]>([]);
  const tagsRef = useRef<Record<string, string>>({});
  const extraRef = useRef<Record<string, unknown>>({});

  const setUser = useCallback((user: UserContext) => {
    userRef.current = user;
  }, []);

  const clearUser = useCallback(() => {
    userRef.current = {};
  }, []);

  const addBreadcrumb = useCallback((breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    const newBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    breadcrumbsRef.current = [
      ...breadcrumbsRef.current.slice(-(MAX_BREADCRUMBS - 1)),
      newBreadcrumb,
    ];
  }, []);

  const setTag = useCallback((key: string, value: string) => {
    tagsRef.current = { ...tagsRef.current, [key]: value };
  }, []);

  const setExtra = useCallback((key: string, value: unknown) => {
    extraRef.current = { ...extraRef.current, [key]: value };
  }, []);

  const getContext = useCallback((): ErrorContext => {
    return {
      user: userRef.current,
      environment: getEnvironmentContext(),
      breadcrumbs: breadcrumbsRef.current,
      tags: tagsRef.current,
      extra: extraRef.current,
      release,
      sessionId: SESSION_ID,
    };
  }, [release]);

  const captureException = useCallback((error: Error, extra?: Record<string, unknown>) => {
    const context = getContext();
    if (extra) {
      context.extra = { ...context.extra, ...extra };
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorContext] Exception captured:', error);
      console.log('[ErrorContext] Context:', context);
    }

    // Call external handler
    if (onError) {
      onError(error, context);
    }

    // Add breadcrumb for the error
    addBreadcrumb({
      type: 'custom',
      category: 'error',
      message: error.message,
      data: { stack: error.stack },
    });
  }, [getContext, onError, addBreadcrumb]);

  const captureMessage = useCallback((
    message: string, 
    level: 'info' | 'warning' | 'error' = 'info'
  ) => {
    addBreadcrumb({
      type: 'custom',
      category: level,
      message,
    });

    if (level === 'error') {
      captureException(new Error(message));
    }
  }, [addBreadcrumb, captureException]);

  const value: ErrorContextState = {
    setUser,
    clearUser,
    addBreadcrumb,
    setTag,
    setExtra,
    getContext,
    captureException,
    captureMessage,
  };

  return (
    <ErrorContextReact.Provider value={value}>
      {children}
    </ErrorContextReact.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

export function useErrorContext(): ErrorContextState {
  const context = useContext(ErrorContextReact);
  
  if (!context) {
    // Return no-op implementation if not wrapped in provider
    return {
      setUser: () => {},
      clearUser: () => {},
      addBreadcrumb: () => {},
      setTag: () => {},
      setExtra: () => {},
      getContext: () => ({
        user: {},
        environment: getEnvironmentContext(),
        breadcrumbs: [],
        tags: {},
        extra: {},
        sessionId: SESSION_ID,
      }),
      captureException: (error) => console.error(error),
      captureMessage: (message) => console.log(message),
    };
  }

  return context;
}

// ============================================
// AUTOMATIC BREADCRUMB COLLECTORS
// ============================================

/**
 * Hook to automatically track navigation breadcrumbs
 */
export function useNavigationBreadcrumbs() {
  const { addBreadcrumb } = useErrorContext();

  const trackNavigation = useCallback((from: string, to: string) => {
    addBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      message: `Navigated from ${from} to ${to}`,
      data: { from, to },
    });
  }, [addBreadcrumb]);

  return { trackNavigation };
}

/**
 * Hook to automatically track click breadcrumbs
 */
export function useClickBreadcrumbs() {
  const { addBreadcrumb } = useErrorContext();

  const trackClick = useCallback((element: string, data?: Record<string, unknown>) => {
    addBreadcrumb({
      type: 'click',
      category: 'ui',
      message: `Clicked ${element}`,
      data,
    });
  }, [addBreadcrumb]);

  return { trackClick };
}

/**
 * Hook to automatically track API breadcrumbs
 */
export function useApiBreadcrumbs() {
  const { addBreadcrumb } = useErrorContext();

  const trackApiCall = useCallback((
    method: string,
    url: string,
    status?: number,
    duration?: number
  ) => {
    addBreadcrumb({
      type: 'api',
      category: 'http',
      message: `${method} ${url}`,
      data: { method, url, status, duration },
    });
  }, [addBreadcrumb]);

  return { trackApiCall };
}

// ============================================
// STANDALONE FUNCTIONS (for non-React contexts)
// ============================================

let globalContext: ErrorContext = {
  user: {},
  environment: typeof window !== 'undefined' ? getEnvironmentContext() : {} as EnvironmentContext,
  breadcrumbs: [],
  tags: {},
  extra: {},
  sessionId: SESSION_ID,
};

export function setGlobalUser(user: UserContext) {
  globalContext.user = user;
}

export function addGlobalBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
  globalContext.breadcrumbs = [
    ...globalContext.breadcrumbs.slice(-(MAX_BREADCRUMBS - 1)),
    { ...breadcrumb, timestamp: Date.now() },
  ];
}

export function setGlobalTag(key: string, value: string) {
  globalContext.tags[key] = value;
}

export function setGlobalExtra(key: string, value: unknown) {
  globalContext.extra[key] = value;
}

export function getGlobalContext(): ErrorContext {
  return {
    ...globalContext,
    environment: getEnvironmentContext(),
  };
}

export function captureGlobalException(error: Error, extra?: Record<string, unknown>) {
  const context = getGlobalContext();
  if (extra) {
    context.extra = { ...context.extra, ...extra };
  }

  console.error('[ErrorContext] Global exception:', error);
  console.log('[ErrorContext] Context:', context);

  addGlobalBreadcrumb({
    type: 'custom',
    category: 'error',
    message: error.message,
    data: { stack: error.stack },
  });

  return context;
}
