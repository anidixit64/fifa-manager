'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceLayoutProps {
  children: React.ReactNode;
}

export const PerformanceLayout = ({ children }: PerformanceLayoutProps) => {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Preload next likely routes based on current page
    const preloadNextRoutes = () => {
      const routeMap: Record<string, string[]> = {
        '/': ['/create-team'],
        '/create-team': ['/manager'],
        '/manager': ['/edit-tactics', '/player-stats', '/best-xi'],
        '/edit-tactics': ['/manager', '/best-xi'],
        '/player-stats': ['/manager', '/best-xi'],
        '/best-xi': ['/manager', '/edit-tactics'],
      };

      const currentRoutes = routeMap[pathname] || [];
      currentRoutes.forEach(route => {
        // Use link preloading for faster navigation
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    if (prevPathname.current !== pathname) {
      preloadNextRoutes();
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Add performance optimizations
  useEffect(() => {
    // Enable hardware acceleration for smoother animations
    document.body.style.transform = 'translateZ(0)';
    document.body.style.willChange = 'auto';
    
    // Optimize scroll performance
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="performance-optimized-layout">
      {children}
      <style jsx global>{`
        /* Performance optimizations */
        * {
          box-sizing: border-box;
        }
        
        /* Enable hardware acceleration for animations */
        .performance-optimized-layout {
          transform: translateZ(0);
          will-change: auto;
        }
        
        /* Optimize transitions */
        * {
          transition-property: transform, opacity, color, background-color;
          transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        
        /* Reduce layout thrashing */
        .layout-stable {
          contain: layout style paint;
        }
        
        /* Optimize button interactions */
        button {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}; 