'use client';

import { useState, useEffect } from 'react';

export default function ProveniqPrimeWrapper() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Only import on client side after mount
    import('./ProveniqPrime').then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) return null;
  
  return <Component />;
}
