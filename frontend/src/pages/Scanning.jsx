import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Scan, ArrowLeft, Layers, Compass, BarChart2, Eye } from 'lucide-react';

function Scanning() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    const fetchLatestPrediction = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/predict_image', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const resData = await response.json();
        
        if (!response.ok) {
          throw new Error(resData.error || 'Failed to retrieve prediction files');
        }

        setData(resData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPrediction();
  }, [user.token]);

  const runScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanComplete(true);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)', padding: '0 2rem 2rem' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        
        <main className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '20px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                onClick={() => navigate('/predict')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Flight Run Scan</h2>
            </div>
            
            {data && !scanComplete && (
              <button 
                className="glowing-btn" 
                onClick={runScan}
                disabled={isScanning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '10px',
                  fontSize: '14.5px'
                }}
              >
                <Scan size={16} /> Run Feature Scan
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <div className="animate-spin-fast" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%' }}></div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem', color: 'var(--text-muted)' }}>
              <Compass size={48} />
              <p>{error}</p>
              <button className="glowing-btn" onClick={() => navigate('/predict')} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px' }}>Upload Image</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Scan Progress Bar */}
              {isScanning && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    <span>Analyzing Orthophoto Layers...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${scanProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', transition: 'width 0.1s linear' }}></div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Images */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2.5rem'
              }}>
                {/* Left Panel: Raw */}
                <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '13.5px', fontWeight: '700' }}>
                    <Layers size={14} />
                    <span>UPLOADED RAW ORTHOPHOTO</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '350px',
                    borderRadius: '12px',
                    background: `url("http://localhost:5000${data.original_url}") no-repeat center/cover`,
                    border: '1px solid var(--border-color)'
                  }}></div>
                </div>

                {/* Right Panel: Scan Overlay */}
                <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '13.5px', fontWeight: '700' }}>
                    <Eye size={14} />
                    <span>YOLO FEATURE SEGMENTATION</span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '350px',
                    borderRadius: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: '#0b0f19'
                  }}>
                    {/* Render Image overlay once scanned/complete */}
                    {scanComplete ? (
                      <img 
                        src={`http://localhost:5000${data.image_url}`} 
                        alt="Segmented prediction" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'pulse 0.5s ease' }}
                      />
                    ) : isScanning ? (
                      <>
                        <img 
                          src={`http://localhost:5000${data.original_url}`} 
                          alt="Under scan" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                        />
                        {/* Vertical scanning line sweep */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'var(--secondary)',
                          boxShadow: '0 0 15px var(--secondary)',
                          top: `${scanProgress}%`
                        }}></div>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        <Scan size={36} />
                        <span style={{ fontSize: '14.5px' }}>Click 'Run Feature Scan' to reveal overlays</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Data summaries: GPS and Counts */}
              {scanComplete && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '2rem',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.5rem'
                }}>
                  {/* Metadata coordinates info */}
                  <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700' }}>
                      <Compass size={14} />
                      <span>GPS GEOLOCATION EXIF DATA</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '15px' }}>
                      <div>Latitude: <strong style={{ color: '#fff' }}>{data.latitude.toFixed(6)}° N</strong></div>
                      <div>Longitude: <strong style={{ color: '#fff' }}>{data.longitude.toFixed(6)}° E</strong></div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Coordinates embedded successfully into EXIF segment header.</div>
                    </div>
                  </div>

                  {/* Detected objects */}
                  <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700' }}>
                      <BarChart2 size={14} />
                      <span>YOLO EXTRACTIONS SUMMARY</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.keys(data.objectCounts).length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>No features detected.</span>
                      ) : (
                        Object.keys(data.objectCounts).map((key) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '14.5px' }}>
                            <span style={{ fontWeight: '500' }}>{key}</span>
                            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{data.objectCounts[key]} instances</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Scanning;
