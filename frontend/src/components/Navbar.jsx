import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Bell, Globe, ChevronDown, User as UserIcon } from 'lucide-react';

function Navbar() {
  const { user } = useContext(AuthContext);

  return (
    <nav className="glass-panel" style={{
      display: 'flex',
      justify-content: 'space-between',
      alignItems: 'center',
      padding: '0.85rem 2rem',
      borderRadius: '0 0 16px 16px',
      marginBottom: '1.5rem',
      borderTop: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Simple inline SVG for Logo */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: '22px', fontWeight: '800', tracking: '0.5px' }}>
          <span style={{ color: 'var(--primary)' }}>Fusion</span>
          <span style={{ color: '#ffffff' }}>AI</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Notifications */}
        <button style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justify-content: 'center',
          cursor: 'pointer',
          color: 'var(--text-main)',
          transition: 'var(--transition)',
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent)'
          }}></span>
        </button>

        {/* Language */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '14px',
          background: 'rgba(255,255,255,0.03)',
          padding: '0.4rem 0.8rem',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)'
        }}>
          <Globe size={14} />
          <span>English</span>
          <ChevronDown size={12} />
        </div>

        {/* Profile Card */}
        {user && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            paddingLeft: '1.25rem',
            borderLeft: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justify-content: 'center',
              color: '#ffffff',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
            }}>
              <UserIcon size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                {user.name.toUpperCase()}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Administrator
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
