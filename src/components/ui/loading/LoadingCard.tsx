"use client";
import React from "react";

interface LoadingCardProps {
  count?: number;
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  count = 1,
  className,
  showAvatar = true,
  lines = 3
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const cardClasses = [
          "bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse",
          className
        ].filter(Boolean).join(" ");

        return (
          <div key={index} className={cardClasses}>
            <div className="flex items-start space-x-4">
              {showAvatar && (
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                {Array.from({ length: lines }).map((_, lineIndex) => {
                  const lineClasses = [
                    "h-3 bg-gray-200 dark:bg-gray-700 rounded",
                    lineIndex === lines - 1 ? "w-1/2" : "w-full"
                  ].join(" ");

                  return (
                    <div key={lineIndex} className={lineClasses} />
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        );
      })}
    </>
  );
};

export default LoadingCard;
