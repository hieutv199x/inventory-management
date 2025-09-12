import React from 'react';
import { Info } from 'lucide-react';

interface TimezoneInfoProps {
    className?: string;
    showIcon?: boolean;
}

const TimezoneInfo: React.FC<TimezoneInfoProps> = ({ 
    className = "text-xs text-gray-500 dark:text-gray-400", 
    showIcon = true 
}) => {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {showIcon && <Info className="h-3 w-3" />}
            <span>Thời gian hiển thị theo múi giờ UK (TikTok Shop)</span>
        </div>
    );
};

export default TimezoneInfo;