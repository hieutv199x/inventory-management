"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoadingOverlay } from '@/components/ui/loading';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const showLoading = (newMessage = 'Loading...') => {
    setMessage(newMessage);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const setLoadingMessage = (newMessage: string) => {
    setMessage(newMessage);
  };

  const value: LoadingContextType = {
    isLoading,
    message,
    showLoading,
    hideLoading,
    setLoadingMessage,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={message} />
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
