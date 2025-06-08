'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/client', label: 'Dashboard' },
  { href: '/client/projects', label: 'Projects' },
  { href: '/client/tickets', label: 'Support Tickets' },
  { href: '/client/tickets/new', label: 'New Request' },
  { href: '/profile', label: 'My Profile' },
];

export const ClientNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="client-navigation bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="text-xl font-bold mb-8">Client Portal</div>
      <ul>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href} className="mb-2">
              <Link
                href={link.href}
                className={`block p-2 rounded-md ${
                  isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}; 