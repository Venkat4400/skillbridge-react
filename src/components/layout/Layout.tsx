import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, Bell, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = user?.role === 'ngo'
    ? [
        { name: 'Dashboard', href: '#dashboard' },
        { name: 'Opportunities', href: '#opportunities' },
        { name: 'Applications', href: '#applications' },
        { name: 'Messages', href: '#messages' },
      ]
    : [
        { name: 'Dashboard', href: '#dashboard' },
        { name: 'Opportunities', href: '#opportunities' },
        { name: 'Applications', href: '#applications' },
        { name: 'Messages', href: '#messages' },
      ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">SkillBridge</h1>
            </div>

            <div className="hidden md:flex md:items-center md:space-x-6">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {user?.role === 'ngo' ? 'NGO' : 'Volunteer'}
              </span>

              <button className="text-slate-600 hover:text-slate-900 transition-colors">
                <Bell size={20} />
              </button>

              <button
                onClick={() => signOut()}
                className="text-slate-600 hover:text-slate-900 transition-colors"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>
    </div>
  );
}
