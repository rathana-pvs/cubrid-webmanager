import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchLogContent } from '../brokerSlice';

import { Icon } from '../../../components/ds/foundation/Icon';

const HighlightedLine = ({ line }) => {
  if (!line) return <span>&nbsp;</span>;

  // Regex patterns
  const patterns = [
    { type: 'timestamp', regex: /(\d{2,4}[-./]\d{2}[-./]\d{2,4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)/g },
    { type: 'error', regex: /\b(ERROR|FATAL|ERR|FAIL)\b/gi },
    { type: 'warn', regex: /\b(WARN|WARNING)\b/gi },
    { type: 'info', regex: /\b(INFO|NOTIFICATION)\b/gi },
    { type: 'success', regex: /\b(SUCCESS)\b/gi },
    { type: 'debug', regex: /\b(DEBUG|TRACE)\b/gi },
    { type: 'path', regex: /(\/[a-zA-Z0-9._\-/]+)/g },
    { type: 'keyword', regex: /\b(SQL|TRAN|CLIENT|SERVER|EID|CODE|FILE|LINE|Time|Tran)\b/g },
    { type: 'number', regex: /\b(-?\d+(?:\.\d+)?)\b/g },
  ];

  // Helper to get all matches for all patterns
  let matches = [];
  patterns.forEach(p => {
    let match;
    const regex = new RegExp(p.regex);
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: p.type
      });
    }
  });

  // Sort matches by start position, and handle overlaps (prioritize first found correctly)
  matches.sort((a, b) => a.start - b.start);
  
  // Filter out overlaps
  let filteredMatches = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }

  // Build the content
  const content = [];
  let currentPos = 0;

  filteredMatches.forEach((match, i) => {
    // Add text before match
    if (match.start > currentPos) {
      content.push(line.substring(currentPos, match.start));
    }

    // Add highlighted match
    let colorClass = 'text-slate-300';
    switch (match.type) {
      case 'timestamp': colorClass = 'text-slate-500'; break;
      case 'error': colorClass = 'text-rose-400 font-bold'; break;
      case 'warn': colorClass = 'text-amber-300 font-bold'; break;
      case 'info': colorClass = 'text-sky-300 font-bold'; break;
      case 'success': colorClass = 'text-emerald-400 font-bold'; break;
      case 'debug': colorClass = 'text-slate-400'; break;
      case 'path': colorClass = 'text-slate-500 italic underline decoration-slate-600/30'; break;
      case 'keyword': colorClass = 'text-indigo-300'; break;
      case 'number': colorClass = 'text-orange-300'; break;
    }

    content.push(
      <span key={`m-${i}`} className={colorClass}>
        {match.text}
      </span>
    );
    currentPos = match.end;
  });

  // Add remaining text
  if (currentPos < line.length) {
    content.push(line.substring(currentPos));
  }

  return <span>{content}</span>;
};

function LogViewer({ hostUid, path }) {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;
  
  const logState = useSelector((state) => state.broker.viewingLogs[path]);
  const fileName = path.split('/').pop();

  const startLine = (currentPage - 1) * pageSize + 1;
  const endLine = currentPage * pageSize;

  useEffect(() => {
    dispatch(fetchLogContent({ hostUid, path, start: String(startLine), end: String(endLine) }));
  }, [dispatch, hostUid, path, currentPage]);

  const handleRefresh = () => {
    dispatch(fetchLogContent({ hostUid, path, start: String(startLine), end: String(endLine) }));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    const total = parseInt(logState?.data?.total || '0');
    if (endLine < total) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (logState?.loading && !logState?.data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-bk-main">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-bk-yellow/20 border-t-bk-yellow rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading log content...</p>
        </div>
      </div>
    );
  }

  const logLines = logState?.data?.log?.[0]?.line || [];
  const totalLines = parseInt(logState?.data?.total || '0');
  const hasNext = endLine < totalLines;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-bk-main overflow-hidden">
      {/* Log Header / Toolbar */}
      <div className="shrink-0 px-4 py-2.5 bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Icon name="description" size="sm" weight={300} className="text-amber-600 dark:text-bk-yellow" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">{fileName}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px] lg:max-w-md">{path}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1 || logState?.loading}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-bk-yellow rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous 100 lines"
            >
              <Icon name="chevron_left" size="sm" weight={300} />
            </button>
            <div className="px-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 min-w-[100px] text-center">
              {startLine} - {Math.min(endLine, totalLines)}
            </div>
            <button 
              onClick={handleNextPage}
              disabled={!hasNext || logState?.loading}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-bk-yellow rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next 100 lines"
            >
              <Icon name="chevron_right" size="sm" weight={300} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

          <button 
             onClick={handleRefresh}
             disabled={logState?.loading}
             className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
             title="Refresh Current View"
          >
            <span className={`material-symbols-outlined text-[18px] ${logState?.loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Log Content Area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-bk-side selection:bg-bk-yellow/30 relative">
        {logState?.loading && logState?.data && (
          <div className="absolute inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-bk-yellow/20 border-t-bk-yellow rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="min-w-full inline-block font-mono text-[12px] leading-relaxed py-4">
          {logLines.length === 0 && !logState?.loading ? (
            <div className="px-6 text-slate-500 italic">No log entries found.</div>
          ) : (
            logLines.map((line, idx) => (
              <div key={idx} className="flex hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="w-14 shrink-0 text-right pr-4 text-slate-400 dark:text-slate-500 select-none border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-bk-side sticky left-0 group-hover:text-slate-500 dark:group-hover:text-slate-400">
                  {startLine + idx}
                </div>
                <div className="px-4 text-slate-700 dark:text-slate-300 whitespace-pre min-w-0 flex-1">
                  <HighlightedLine line={line} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="shrink-0 px-4 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span>Format: UTF-8</span>
          <span>Page: {currentPage} / {Math.ceil(totalLines / pageSize) || 1}</span>
          <span>Total Lines: {totalLines.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Online
          </span>
        </div>
      </div>
    </div>
  );
}

export default LogViewer;
