'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('dhobighat-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('dhobighat-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div 
        className="w-8 h-8 rounded-full border border-[var(--c-border)] bg-[var(--c-canvas-sunken)] opacity-50"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[var(--c-border)] bg-[var(--c-canvas-surface)] hover:bg-[var(--c-canvas-sunken)] hover:border-[var(--c-border-strong)] text-[var(--c-ink-muted)] hover:text-[var(--c-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 cursor-pointer"
      title={`Current: ${theme.toUpperCase()} mode. Click to toggle.`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
      ) : (
        <Moon className="w-4 h-4 text-stone-700 stroke-[2.2]" />
      )}
    </button>
  );
}
