'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  LayoutGrid,
  Menu,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Plus,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

interface Crumb {
  label: string;
  icon?: 'grid' | 'plus';
}

function crumbFromPath(p: string): Crumb {
  if (p.startsWith('/assignments/create')) return { label: 'Create New', icon: 'plus' };
  if (p.startsWith('/assignments')) return { label: 'Assignment', icon: 'grid' };
  if (p.startsWith('/groups')) return { label: 'My Groups', icon: 'grid' };
  if (p.startsWith('/library')) return { label: 'My Library', icon: 'grid' };
  if (p.startsWith('/toolkit')) return { label: "AI Teacher's Toolkit", icon: 'grid' };
  if (p.startsWith('/settings')) return { label: 'Settings', icon: 'grid' };
  return { label: 'Home', icon: 'grid' };
}

export default function TopBar(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const crumb = crumbFromPath(pathname);
  const { toggleSidebar } = useUiStore();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setBellOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="sticky top-0 z-20 px-4 md:px-8 pt-4">
      <header className="h-14 bg-brand-card rounded-full shadow-card flex items-center px-3 md:px-4 gap-3">
        <button
          className="md:hidden p-2 rounded hover:bg-brand-page"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-brand-page text-brand-text"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 text-brand-subtext">
          {crumb.icon === 'plus' ? (
            <Plus size={16} className="text-brand-orange" strokeWidth={2.5} />
          ) : (
            <LayoutGrid size={16} />
          )}
          <span className="text-[14px] font-medium">{crumb.label}</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5" ref={wrapRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setBellOpen((v) => !v);
                setUserOpen(false);
              }}
              className="relative p-2 rounded-full hover:bg-brand-page"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-brand-text" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full" />
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-12 w-72 bg-brand-card border border-brand-border rounded-lg shadow-card p-4 text-sm">
                <p className="font-semibold mb-1">Notifications</p>
                <p className="text-brand-subtext">You&apos;re all caught up.</p>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserOpen((v) => !v);
                setBellOpen(false);
              }}
              className="flex items-center gap-2 hover:bg-brand-page rounded-full pl-1 pr-2.5 py-1"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-yellow-400 flex items-center justify-center text-white font-bold text-sm">
                J
              </div>
              <span className="text-[13.5px] font-semibold hidden sm:inline">John Doe</span>
              <ChevronDown size={15} className="text-brand-subtext" />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-12 w-56 bg-brand-card border border-brand-border rounded-lg shadow-card overflow-hidden">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-page"
                  onClick={() => setUserOpen(false)}
                >
                  <UserIcon size={14} /> Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-page"
                  onClick={() => setUserOpen(false)}
                >
                  <SettingsIcon size={14} /> Settings
                </Link>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setUserOpen(false);
                    alert('Sign out is wired up to your auth flow in production.');
                  }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
