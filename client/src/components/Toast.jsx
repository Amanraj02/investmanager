import React, { useEffect } from 'react';

const Toast = ({ message, type = 'error', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto close after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';

    return (
        <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-up`}>
            <span>{message}</span>
            <button 
                onClick={onClose}
                className="ml-2 hover:text-gray-200"
            >
                ×
            </button>
        </div>
    );
};

export default Toast; 