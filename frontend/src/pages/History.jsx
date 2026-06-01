import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Calendar, Compass, BarChart2, Download, Layers, Trash2, Eye } from 'lucide-react';

function History() {
  const { user } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/predicted_images', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch flight history');
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.token]);

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

      if (!response.ok) throw new Error('Failed to generate report PDF');

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
        
        <main className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Flight Run History</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Historical directory of all uploaded flight runs and their corresponding YOLO segment classifications.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <div className="animate-spin-fast" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%' }}></div>
            </div>
          ) : error ? (
            <div style={{ color: 'var(--text-error)', fontSize: '14.5px', textAlign: 'center', margin: '2rem' }}>{error}</div>
          ) : records.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5rem 2rem',
              gap: '1rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
              marginTop: '1rem'
            }}>
              <Layers size={40} />
              <span style={{ fontSize: '15px' }}>No flight runs found in your history log.</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '2rem',
              marginTop: '0.5rem'
            }}>
              {records.map((rec) => (
                <div key={rec._id} className="glass-panel" style={{
                  padding: '1.25rem',
                  borderRadius: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  
                  {/* MetaHeader: Date & Coordinates */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      <span>{new Date(rec.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' }}>
                      <Compass size={13} />
                      <span>{rec.latitude.toFixed(5)}, {rec.longitude.toFixed(5)}</span>
                    </div>
                  </div>

                  {/* Thumbnail Previews: side-by-side or stacked */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', height: '110px' }}>
                    {/* Raw thumbnail */}
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img 
                        src={`http://localhost:5000/static/uploads/${rec.originalFilename}`} 
                        alt="Raw" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '3px' }}>RAW</span>
                    </div>
                    {/* Segmented thumbnail */}
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img 
                        src={`http://localhost:5000/static/predictions/${rec.predictedFilename}`} 
                        alt="Segment" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--primary)', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '3px' }}>YOLO</span>
                    </div>
                  </div>

                  {/* Detection badge pills list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      <BarChart2 size={12} />
                      <span>EXTRACTION SUMMARY</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {Object.keys(rec.objectCounts || {}).length === 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No features mapped.</span>
                      ) : (
                        Object.keys(rec.objectCounts).map((key) => (
                          <span 
                            key={key} 
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border-color)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              color: 'var(--text-main)'
                            }}
                          >
                            {key}: {rec.objectCounts[key]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      ID: {rec._id.substring(rec._id.length - 8).toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDownloadPDF(rec.objectCounts)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        padding: '0.4rem 0.8rem',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }}
                    >
                      <Download size={13} /> Report PDF
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default History;
