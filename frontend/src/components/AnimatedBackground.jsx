import React from 'react';

/**
 * Animated Ambient Background Component
 * Multi-layer gradient aurora mesh, floating luminous orbs, and subtle cyber grid.
 */
export function AnimatedBackground({ variant = 'dashboard' }) {
  return (
    <div className={`animated-bg-container variant-${variant}`} aria-hidden="true">
      {/* Dynamic Floating Aurora Gradient Orbs */}
      <div className="bg-aurora-orb orb-primary" />
      <div className="bg-aurora-orb orb-secondary" />
      <div className="bg-aurora-orb orb-accent" />
      <div className="bg-aurora-orb orb-emerald" />

      {/* Cyber Grid & Shimmer Pattern Overlay */}
      <div className="bg-cyber-grid" />
      <div className="bg-radial-vignette" />

      {/* Subtle Floating Dust Particles */}
      <div className="bg-particles-container">
        {[...Array(16)].map((_, i) => (
          <div key={i} className={`bg-particle particle-${(i % 5) + 1}`} />
        ))}
      </div>
    </div>
  );
}
