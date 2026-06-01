import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Calendar, Layers, Download, Info } from 'lucide-react';

// Create a custom SVG icon for Leaflet to prevent default asset paths from breaking in Vite
const customMarkerIcon = new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(99,102,241,0.5);
      border: 2px solid #ffffff;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  className: 'custom-leaflet-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

function MapView() {
  const { user } = useContext(AuthContext);
  
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [zoom, setZoom] = useState(5);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/predicted_images', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (response.ok && data.length > 0) {
          setPredictions(data);
          
          // Center the map at the coordinates of the latest prediction
          const latest = data[0];
          if (latest.latitude && latest.longitude) {
            setCenter([latest.latitude, latest.longitude]);
            setZoom(14);
          }
        }
      } catch (err) {
        console.error('Error fetching map points:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user.token]);

  // Download PDF helper
  const handleDownloadPDF = async (counts) => {
    try {
      const response = await fetch('http://localhost:5000/api/generate_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ object_counts: counts })
      });

      if (!response.ok) throw new Error('Report creation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flight_analysis_${Date.now()}.pdf`;
      a.click();
    } catch (err) {
      alert(`Download error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)', padding: '0 2rem 2rem' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        
        <main className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Spatial Flight Overlays</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Locations of processed flight captures. Click any map marker pin to reveal its segmented output and download PDF reports.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <div className="animate-spin-fast" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%' }}></div>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '450px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
              <MapContainer 
                center={center} 
                zoom={zoom} 
                style={{ width: '100%', height: '100%' }}
              >
                {/* Standard tile service overlay */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {predictions.map((pred) => (
                  <Marker 
                    key={pred._id} 
                    position={[pred.latitude, pred.longitude]}
                    icon={customMarkerIcon}
                  >
                    <Popup maxWidth={320}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '280px', color: 'var(--text-main)', padding: '0.2rem' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>
                          <Compass size={14} style={{ color: 'var(--secondary)' }} />
                          <span style={{ fontSize: '13px', fontWeight: '700' }}>
                            {pred.latitude.toFixed(5)}, {pred.longitude.toFixed(5)}
                          </span>
                        </div>

                        {/* Predicted Image Thumbnail */}
                        <div style={{ position: 'relative', height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img 
                            src={`http://localhost:5000/static/predictions/${pred.predictedFilename}`} 
                            alt="Segmented capture" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Counts list inside pop-up */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '80px', overflowY: 'auto' }}>
                          {Object.keys(pred.objectCounts || {}).length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No objects classified.</span>
                          ) : (
                            Object.keys(pred.objectCounts).map((key) => (
                              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                                <span style={{ fontWeight: '600' }}>{pred.objectCounts[key]} instances</span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer downloads in map */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <Calendar size={11} />
                            <span>{new Date(pred.timestamp).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => handleDownloadPDF(pred.objectCounts)}
                            style={{
                              background: 'var(--primary)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem 0.6rem',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              boxShadow: '0 2px 8px var(--primary-glow)'
                            }}
                          >
                            <Download size={10} /> Report
                          </button>
                        </div>

                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default MapView;
