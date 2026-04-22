import { forwardRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';

// ── Lightweight CSS Animation Wrapper ──
// Replaces framer-motion viewport animations with simple CSS classes for performance

interface AnimationProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Simple fade-in animation (triggers on mount)
export const FadeIn = forwardRef<HTMLDivElement, AnimationProps & { delay?: number }>(
  ({ children, className = '', delay = 0, style, ...props }, ref) => (
    <div
      ref={ref}
      className={`animate-fade-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
FadeIn.displayName = 'FadeIn';

// Stagger container (just applies flex/grid layout)
interface StaggerProps extends AnimationProps {
  stagger?: number;
}

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(
  ({ children, className = '', stagger, ...props }, ref) => (
    <div
      ref={ref}
      className={`animate-stagger-in ${className}`}
      data-stagger={stagger}
      {...props}
    >
      {children}
    </div>
  )
);
Stagger.displayName = 'Stagger';

// Hover lift effect (CSS only, no JS overhead)
interface HoverLiftProps extends AnimationProps {}

export const HoverLift = forwardRef<HTMLDivElement, HoverLiftProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`transition-transform duration-200 hover:-translate-y-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
HoverLift.displayName = 'HoverLift';

// Re-export motion for components that need it (e.g., PageTransition)
export { motion };
