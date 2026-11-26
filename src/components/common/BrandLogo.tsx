import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#13223E" stroke="#263B63" strokeWidth="1.5" />
      <circle
        cx="20"
        cy="20"
        r="13.5"
        stroke="#3B82F6"
        strokeWidth="1.75"
        strokeDasharray="3.5 2.5"
      />
      <circle cx="20" cy="20" r="8.5" stroke="#60A5FA" strokeWidth="1.75" />
      <circle cx="20" cy="20" r="4.5" fill="#DC2626" />
      <path d="M20 17.5V22.5M17.5 20H22.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
