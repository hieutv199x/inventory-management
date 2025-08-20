'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <button
                onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <span className={`${language === 'en' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                    EN
                </span>
                <span className="mx-1 text-gray-400">|</span>
                <span className={`${language === 'vi' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                    VI
                </span>
            </button>
        </div>
    );
};
