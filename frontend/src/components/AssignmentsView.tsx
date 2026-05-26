'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, Plus, Search, SlidersHorizontal, FileSearch } from 'lucide-react';
import { deleteAssignment } from '@/lib/api';
import type { AssignmentSummary } from '@/types';

function formatDate(d: string): string {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = date.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

interface Props {
  initial: AssignmentSummary[];
  loadError: string | null;
}

export default function AssignmentsView({ initial, loadError }: Props): JSX.Element {
  const [items, setItems] = useState<AssignmentSummary[]>(initial);
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => a.title.toLowerCase().includes(q));
  }, [items, query]);

  const handleDelete = async (id: string): Promise<void> => {
    setOpenMenu(null);
    if (!confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loadError) {
    return (
      <Header subtitle="Manage and create assignments for your classes.">
        <div className="bg-brand-card rounded-card shadow-card p-6">
          <p className="text-red-600">Could not load assignments: {loadError}</p>
          <p className="text-sm text-brand-subtext mt-2">
            Make sure the backend is running on{' '}
            <code className="bg-brand-page px-1.5 py-0.5 rounded">
              {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}
            </code>
          </p>
        </div>
      </Header>
    );
  }

  if (items.length === 0) {
    return (
      <Header subtitle="Manage and create assignments for your classes.">
        <div className="bg-brand-card rounded-card shadow-card p-12 flex flex-col items-center text-center">
          <div className="w-44 h-44 mb-4 rounded-full bg-gradient-to-b from-brand-page to-white flex items-center justify-center relative">
            <FileSearch size={68} className="text-brand-orange" strokeWidth={1.4} />
            <span className="absolute -top-2 right-6 w-3.5 h-3.5 bg-brand-page rounded-sm rotate-12" />
            <span className="absolute bottom-3 right-10 w-2 h-2 bg-brand-orange/60 rounded-full" />
          </div>
          <h2 className="text-[17px] font-bold mb-2">No assignments yet</h2>
          <p className="text-[13px] text-brand-subtext max-w-md mb-6 leading-relaxed">
            Create your first assignment to start collecting and grading student
            submissions. You can set up rubrics, define marking criteria, and let AI
            assist with grading.
          </p>
          <Link
            href="/assignments/create"
            className="inline-flex items-center gap-2 bg-brand-dark text-white rounded-full px-6 py-3 text-[13.5px] font-medium hover:opacity-90"
          >
            <Plus size={15} className="text-brand-orange" strokeWidth={2.5} />
            Create Your First Assignment
          </Link>
        </div>
      </Header>
    );
  }

  return (
    <Header subtitle="Manage and create assignments for your classes.">
      <div className="relative pb-24">
        <div className="bg-brand-card rounded-card shadow-card px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <button className="inline-flex items-center gap-2 text-[13.5px] font-medium text-brand-text">
            <SlidersHorizontal size={15} className="text-brand-subtext" />
            Filter By
          </button>
          <div className="relative w-full md:w-80">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Assignment"
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-full border border-brand-border bg-brand-card focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" ref={menuRef}>
          {filtered.map((a) => (
            <div key={a.id} className="bg-brand-card rounded-card shadow-card p-5 relative">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/assignments/${a.id}`}
                  className="font-bold text-[16px] underline underline-offset-4 decoration-brand-text/70 hover:decoration-brand-orange line-clamp-2"
                >
                  {a.title}
                </Link>
                <button
                  onClick={() => setOpenMenu(openMenu === a.id ? null : a.id)}
                  className="p-1 rounded hover:bg-brand-page"
                  aria-label="Menu"
                >
                  <MoreVertical size={18} className="text-brand-subtext" />
                </button>
                {openMenu === a.id && (
                  <div className="absolute right-4 top-12 w-44 bg-brand-card border border-brand-border rounded-lg shadow-card overflow-hidden z-10 text-[13px]">
                    <Link
                      href={`/assignments/${a.id}`}
                      className="block px-4 py-2 hover:bg-brand-page"
                      onClick={() => setOpenMenu(null)}
                    >
                      View Assignment
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-7 flex items-center justify-between text-[12.5px] text-brand-subtext">
                <span>
                  <span className="font-semibold text-brand-text">Assigned on</span> :{' '}
                  {formatDate(a.createdAt)}
                </span>
                <span>
                  <span className="font-semibold text-brand-text">Due</span> :{' '}
                  {formatDate(a.dueDate)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/assignments/create"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-brand-dark text-white rounded-full px-5 py-3 text-[13.5px] font-medium shadow-card hover:opacity-90 z-10"
        >
          <Plus size={15} className="text-brand-orange" strokeWidth={2.5} />
          Create Assignment
        </Link>
      </div>
    </Header>
  );
}

function Header({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}): JSX.Element {
  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-online" />
          <h1 className="text-[18px] font-bold leading-none">Assignments</h1>
        </div>
        <p className="text-[13px] text-brand-subtext ml-5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
