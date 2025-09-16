'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-4.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
        </svg>
      )
    },
    {
      name: 'Agent Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      )
    },
    {
      name: 'AI Coaching',
      href: '/coaching',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="bg-background border-b border-border-light backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-foreground tracking-tight">
              Contact Center AI
            </Link>
          </div>

          <div className="flex space-x-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-foreground text-background'
                    : 'text-text-muted hover:text-foreground hover:bg-background-secondary'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <div className="text-sm font-medium text-text-muted uppercase tracking-wide">
              MVP Demo
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}