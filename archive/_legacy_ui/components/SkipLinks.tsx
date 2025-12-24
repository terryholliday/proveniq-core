/**
 * Skip Links Component
 * L4.2.4 - Accessibility navigation for keyboard users
 * 
 * Provides keyboard-accessible skip links that appear on focus,
 * allowing users to bypass repetitive navigation and jump to main content.
 */

'use client';

import { useState } from 'react';

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  mainContentId?: string;
}

const DEFAULT_LINKS: SkipLink[] = [
  { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
];

export function SkipLinks({ 
  links = DEFAULT_LINKS,
  mainContentId = 'main-content' 
}: SkipLinksProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleClick = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, targetId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(targetId);
    }
  };

  return (
    <div className="skip-links" role="navigation" aria-label="Skip links">
      {links.map((link, index) => (
        <a
          key={link.id}
          href={`#${link.targetId}`}
          className={`
            fixed top-0 left-0 z-[9999]
            px-4 py-3
            bg-slate-900 text-white
            font-mono text-sm font-medium
            border-2 border-sky-500
            rounded-br-lg
            shadow-lg
            transform -translate-y-full
            focus:translate-y-0
            transition-transform duration-200
            outline-none
            focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950
          `}
          style={{
            left: `${index * 200}px`,
          }}
          onClick={(e) => {
            e.preventDefault();
            handleClick(link.targetId);
          }}
          onKeyDown={(e) => handleKeyDown(e, link.targetId)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

/**
 * Landmark wrapper component
 * Wraps main content with proper ARIA landmarks and focusable target
 */
interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function MainContent({ 
  children, 
  id = 'main-content',
  className = '' 
}: MainContentProps) {
  return (
    <main
      id={id}
      role="main"
      tabIndex={-1}
      className={`outline-none focus:outline-none ${className}`}
      aria-label="Main content"
    >
      {children}
    </main>
  );
}

/**
 * Navigation landmark wrapper
 */
interface NavigationLandmarkProps {
  children: React.ReactNode;
  id?: string;
  label?: string;
  className?: string;
}

export function NavigationLandmark({
  children,
  id = 'main-navigation',
  label = 'Main navigation',
  className = '',
}: NavigationLandmarkProps) {
  return (
    <nav
      id={id}
      role="navigation"
      tabIndex={-1}
      className={`outline-none focus:outline-none ${className}`}
      aria-label={label}
    >
      {children}
    </nav>
  );
}

/**
 * Hook to register skip link targets
 * Use this to dynamically add skip link targets
 */
export function useSkipLinkTarget(id: string) {
  return {
    id,
    tabIndex: -1,
    className: 'outline-none focus:outline-none',
  };
}

export default SkipLinks;
