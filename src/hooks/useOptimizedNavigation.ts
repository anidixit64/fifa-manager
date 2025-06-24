import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

interface UseOptimizedNavigationOptions {
  preload?: boolean;
  prefetch?: boolean;
  transitionDuration?: number;
}

export const useOptimizedNavigation = (options: UseOptimizedNavigationOptions = {}) => {
  const router = useRouter();
  const { preload = true, prefetch = true, transitionDuration = 150 } = options;
  const isNavigating = useRef(false);
  const preloadedRoutes = useRef<Set<string>>(new Set());

  // Preload routes for faster navigation
  const preloadRoute = useCallback((href: string) => {
    if (preloadedRoutes.current.has(href)) return;
    
    try {
      // Prefetch the route
      router.prefetch(href);
      preloadedRoutes.current.add(href);
    } catch (error) {
      console.warn('Failed to preload route:', href, error);
    }
  }, [router]);

  // Optimized navigation with transition
  const navigateTo = useCallback((href: string, options?: { replace?: boolean }) => {
    if (isNavigating.current) return;
    
    isNavigating.current = true;
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      if (options?.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
      
      // Reset navigation state after transition
      setTimeout(() => {
        isNavigating.current = false;
      }, transitionDuration);
    }, 50);
  }, [router, transitionDuration]);

  // Preload common routes on mount
  useEffect(() => {
    if (preload) {
      const commonRoutes = ['/manager', '/edit-tactics', '/player-stats', '/best-xi', '/create-team'];
      commonRoutes.forEach(route => preloadRoute(route));
    }
  }, [preload, preloadRoute]);

  return {
    navigateTo,
    preloadRoute,
    isNavigating: isNavigating.current,
  };
}; 