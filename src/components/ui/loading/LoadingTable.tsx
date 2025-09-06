"use client";
import React from "react";

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

const LoadingTable: React.FC<LoadingTableProps> = ({
  rows = 5,
  columns = 4,
  className,
  showHeader = true
}) => {
  const tableClasses = [
    "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={tableClasses}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {showHeader && (
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <th key={colIndex} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse">
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const cellClasses = [
                    "h-4 bg-gray-200 dark:bg-gray-700 rounded",
                    colIndex === 0 ? "w-3/4" : colIndex === columns - 1 ? "w-1/2" : "w-full"
                  ].join(" ");

                  return (
                    <td key={colIndex} className="px-6 py-4">
                      <div className={cellClasses} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoadingTable;
