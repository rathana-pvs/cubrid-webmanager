import React, { useRef } from 'react';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

export default function ConfigSourceEditor({ rawContent, handleSourceChange }) {
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  const syncScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const renderHighlightedContent = () => {
    return rawContent.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        return <span key={i} className="text-slate-400 dark:text-slate-500 italic opacity-80">{line}{'\n'}</span>;
      }
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        return <span key={i} className="text-bk-yellow font-bold">{line}{'\n'}</span>;
      }
      return <span key={i}>{line}{'\n'}</span>;
    });
  };

  return (
    <div className="flex-1 relative p-4 bg-slate-100 dark:bg-black/20">
      <div className="h-full w-full bg-white dark:bg-[#1a1c1e] rounded-xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
           <div className="flex items-center gap-2">
             <Icon name="description" size="14px" className="text-slate-400"  weight={300} />
             <Typography variant="overline" className="text-slate-500 dark:text-slate-400">cubrid_broker.conf</Typography>
           </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          <pre 
            ref={preRef}
            className="absolute inset-0 p-6 font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-300 pointer-events-none whitespace-pre-wrap break-all overflow-hidden"
            aria-hidden="true"
          >
            {renderHighlightedContent()}
          </pre>

          <textarea 
            ref={textareaRef}
            value={rawContent}
            onChange={handleSourceChange}
            onScroll={syncScroll}
            spellCheck="false"
            className="absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-[13px] leading-relaxed text-transparent caret-slate-800 dark:caret-bk-yellow outline-hidden resize-none custom-scrollbar whitespace-pre-wrap break-all overflow-auto"
            placeholder="# Enter broker configuration here..."
          />
        </div>

        <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
           <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-mono">Comments are preserved in Source View</Typography>
           <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-mono text-right">Lines: {rawContent.split('\n').length}</Typography>
        </div>
      </div>
    </div>
  );
}
