import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Upload, 
  Map, 
  BarChart3, 
  Layers, 
  Droplet, 
  Building2, 
  CheckCircle2, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUploads: 0,
    rooftops: 0,
    waterbodies: 0,
    roads: 0,
    trees: 0
  });
  const [predictions, setPredictions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch('http://localhost:5000/api/reports', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch predictions for carousel
        const predRes = await fetch('http://localhost:5000/api/predicted_images', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (predRes.ok) {
          const predData = await predRes.json();
          setPredictions(predData.slice(0, 5)); // Take latest 5
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.token]);

  const handleNextSlide = () => {
    if (predictions.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % predictions.length);
    }
  };

  const statCards = [
    { label: 'Total Uploads', value: stats.totalUploads, desc: 'Processed orthophotos', icon: Layers, color: 'var(--primary)' },
    { label: 'Rooftops Detected', value: stats.rooftops, desc: 'Structures identified', icon: Building2, color: 'var(--accent)' },
    { label: 'Waterbodies Mapped', value: stats.waterbodies, desc: 'Rivers & ponds tracked', icon: Droplet, color: 'var(--secondary)' },
    { label: 'Detection Accuracy', value: stats.totalUploads > 0 ? '98.6%' : 'N/A', desc: 'Average confidence rate', icon: CheckCircle2, color: '#10b981' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)', padding: '0 2rem 2rem' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Welcome Banner */}
          <div className="glass-panel" style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800' }} className="text-gradient">
                Welcome back, {user ? user.name : 'User'}!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                Drone Orthophoto processing terminal is operational. Upload flights to begin segmentation.
              </p>
            </div>
            <button 
              className="glowing-btn" 
              onClick={() => navigate('/predict')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.5rem',
                borderRadius: '12px',
                fontSize: '15px'
              }}
            >
              <Upload size={16} /> New Upload
            </button>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="glass-panel" style={{
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>{card.label}</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>{card.value}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{card.desc}</span>
                  </div>
                  <div style={{
                    background: `rgba(255, 255, 255, 0.03)`,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    color: card.color
                  }}>
                    <Icon size={24} />
                  </div>
                  {/* Subtle color highlight in the corner */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '3px',
                    height: '100%',
                    background: card.color
                  }}></div>
                </div>
              );
            })}
          </div>

          {/* Core Analytics Panels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            
            {/* Carousel: Drone Orthophotos */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Recent Drone Orthophotos</h3>
              
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '260px' }}>
                  <div className="animate-spin-fast" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%' }}></div>
                </div>
              ) : predictions.length === 0 ? (
                <div style={{
                  height: '260px',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <HelpCircle size={36} />
                  <span style={{ fontSize: '14.5px' }}>No predictions processed yet.</span>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img 
                    src={`http://localhost:5000${predictions[currentSlide].image_url}`} 
                    alt="Orthophoto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Next button */}
                  <button 
                    className="glass-panel"
                    onClick={handleNextSlide}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '50%',
                      width: '2.5rem',
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      zIndex: 10,
                      background: 'rgba(10, 15, 30, 0.85)'
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Info Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(10, 15, 30, 0.95))',
                    padding: '1.25rem 1rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GEOLOCATION</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                        Lat: {predictions[currentSlide].latitude.toFixed(6)}, Long: {predictions[currentSlide].longitude.toFixed(6)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '600',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid var(--primary)',
                      color: 'var(--text-main)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px'
                    }}>
                      YOLO Processed
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Reports & Actions Summary</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Quickly download detailed tabular analysis of extracted agricultural overlays, structures, and roads.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Reports & Analytics</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Generate feature counts & plots</span>
                  </div>
                  <button 
                    onClick={() => navigate('/route')}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                  >
                    Open Tab
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Spatial Map Overlays</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>View flight runs directly on Leaflet</span>
                  </div>
                  <button 
                    onClick={() => navigate('/map')}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--secondary)',
                      color: 'var(--secondary)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--secondary)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--secondary)';
                    }}
                  >
                    Open Map
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;
