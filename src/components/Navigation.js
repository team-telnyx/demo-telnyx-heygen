'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Agent Dashboard', href: '/dashboard', icon: '📞' },
    { name: 'AI Coaching', href: '/coaching', icon: '🤖' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Contact Center AI
            </Link>
          </div>

          <div className="flex space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <div className="text-sm text-gray-500">
              MVP Demo
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}