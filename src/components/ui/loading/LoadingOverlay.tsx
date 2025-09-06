"use client";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  backdrop?: boolean;
  zIndex?: number;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Loading...",
  backdrop = true,
  zIndex = 9999,
  className
}) => {
  if (!isVisible) return null;

  const overlayClasses = [
    "fixed inset-0 flex items-center justify-center",
    backdrop && "bg-gray-900/50 backdrop-blur-sm",
    className
  ].filter(Boolean).join(" ");

  return (
    <div 
      className={overlayClasses}
      style={{ zIndex }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3 shadow-xl max-w-sm mx-4">
        <LoadingSpinner size="md" color="primary" />
        <span className="text-gray-900 dark:text-white font-medium">
          {message}
        </span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
