import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  TachometerAlt, 
  LayoutDashboard, 
  Upload, 
  Map, 
  BarChart3, 
  LogOut, 
  Settings, 
  Image as ImageIcon 
} from 'lucide-react';

function Sidebar() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Image', path: '/predict', icon: Upload },
    { name: 'Predicted Images', path: '/predicted_images', icon: ImageIcon },
    { name: 'Reports & Analytics', path: '/route', icon: BarChart3 },
    { name: 'Find in Map', path: '/map', icon: Map }
  ];

  return (
    <aside className="glass-panel" style={{ 
      width: '16.5rem', 
      height: 'calc(100vh - 5.5rem)', 
      padding: '1.25rem', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '0.5rem',
      borderRadius: '16px',
      marginRight: '1.5rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%',
                background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <Icon size={18} style={{ color: isActive ? '#ffffff' : 'inherit' }} />
              {item.name}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            background: 'transparent',
            color: 'var(--text-muted)',
            textAlign: 'left',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Settings size={18} />
          Settings
        </button>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            background: 'transparent',
            color: 'var(--text-error)',
            textAlign: 'left',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
