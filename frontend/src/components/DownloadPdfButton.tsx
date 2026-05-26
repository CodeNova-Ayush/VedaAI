'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { GeneratedPaper } from '@/types';

interface Props {
  paper: GeneratedPaper;
  className?: string;
}

export default function DownloadPdfButton({ paper, className }: Props): JSX.Element {
  const [busy, setBusy] = useState(false);

  const handle = async (): Promise<void> => {
    setBusy(true);
    try {
      const [{ pdf }, { default: PaperPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/PaperPdf'),
      ]);
      const blob = await pdf(<PaperPdf paper={paper} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.subject}-question-paper.pdf`.replace(/\s+/g, '-');
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      className={
        className ??
        'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[13px] font-medium hover:bg-white/15 disabled:opacity-60'
      }
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Download as PDF
    </button>
  );
}
