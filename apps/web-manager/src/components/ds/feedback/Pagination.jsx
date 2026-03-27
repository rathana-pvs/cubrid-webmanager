import React from 'react';
import { Icon } from '../foundation/Icon';
import { Button } from '../foundation/Button';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  // Simple logic to show window of numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }
      
      if (start > 1) pages.push(1, '...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) pages.push('...', totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={`flex items-center justify-center gap-1 ${className}`} aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        icon="chevron_left"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      />
      
      {getPageNumbers().map((page, idx) => {
        if (page === '...') {
          return <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>;
        }
        
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-amber-600 text-white border border-amber-600'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {page}
          </button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        icon="chevron_right"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    </nav>
  );
};
