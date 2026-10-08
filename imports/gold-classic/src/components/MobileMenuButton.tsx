import React from 'react';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
    aria-expanded={isOpen}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(198,169,105,0.08)',
      border: '1px solid rgba(198,169,105,0.25)',
      borderRadius: 8,
      color: '#c6a969',
      width: 40,
      height: 40,
      fontSize: 24,
      cursor: 'pointer',
      padding: 0,
      lineHeight: 1,
      zIndex: 200,
    }}
    className="mobile-menu-btn"
  >
    {isOpen ? '✕' : '☰'}
  </button>
);