'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Sparkles,
  BookOpen,
  Settings,
  Plus,
  X,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import Logo from './Logo';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  badge?: number;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Sparkles },
  { href: '/library', label: 'My Library', icon: BookOpen },
];

export default function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-[260px] bg-brand-card border-r border-brand-border flex flex-col transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="font-bold text-[19px] tracking-tight">VedaAI</span>
          </Link>
          <button
            className="md:hidden p-1 rounded hover:bg-brand-page"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-4">
          <Link
            href="/assignments/create"
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-dark text-white rounded-full py-3 text-[13.5px] font-medium ring-2 ring-brand-orange hover:opacity-95 transition"
          >
            <Plus size={15} className="text-brand-orange" strokeWidth={2.5} />
            Create Assignment
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition ${
                  active
                    ? 'bg-brand-page text-brand-text font-semibold'
                    : 'text-brand-subtext hover:bg-brand-page hover:text-brand-text'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-orange text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-brand-border p-3 space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] text-brand-subtext hover:bg-brand-page hover:text-brand-text"
          >
            <Settings size={17} strokeWidth={1.8} /> Settings
          </Link>
          <div className="flex items-center gap-3 p-3 rounded-card bg-brand-page">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-yellow-400 flex items-center justify-center text-white font-bold shrink-0">
              D
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold leading-tight truncate">Delhi Public School</p>
              <p className="text-xs text-brand-subtext truncate">Bokaro Steel City</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
