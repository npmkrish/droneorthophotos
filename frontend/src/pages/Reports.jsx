import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { FileText, BarChart2, Plus, Download, RefreshCw, AlertCircle } from 'lucide-react';

// Register ChartJS elements
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Reports() {
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  // Upload/Extraction states
  const [file, setFile] = useState(null);
  const [extractedCounts, setExtractedCounts] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('http://localhost:5000/api/reports', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch analytics');
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user.token]);

  // Handle instant analysis upload
  const handleExtract = async (e) => {
    e.preventDefault();
    if (!file) return;

    setExtracting(true);
    setExtractedCounts(null);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    // Send arbitrary coordinates for instant feature counting
    formData.append('latitude', '0.0');
    formData.append('longitude', '0.0');

    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Extraction failed');
      setExtractedCounts(data.objectCounts);
      // Reload overall stats since database got updated
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  // Download PDF Report
  const handleDownloadPDF = async (countsToReport) => {
    try {
      const response = await fetch('http://localhost:5000/api/generate_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ object_counts: countsToReport })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Report build error: ${text}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fusion_ai_analysis_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to download report: ${err.message}`);
    }
  };

  // Setup Pie Chart Configuration
  const getChartData = () => {
    if (!stats) return null;
    return {
      labels: ['Rooftops', 'Waterbodies', 'Roads', 'Vegetation'],
      datasets: [
        {
          label: 'Feature Counts',
          data: [stats.rooftops, stats.waterbodies, stats.roads, stats.trees],
          backgroundColor: [
            'rgba(217, 70, 239, 0.75)', /* Magenta */
            'rgba(6, 182, 212, 0.75)',  /* Cyan */
            'rgba(99, 102, 241, 0.75)', /* Indigo */
            'rgba(16, 185, 129, 0.75)'  /* Green */
          ],
          borderColor: [
            '#d946ef',
            '#06b6d4',
            '#6366f1',
            '#10b981'
          ],
          borderWidth: 1.5
        }
      ]
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#f3f4f6', font: { family: 'Outfit', size: 13 } }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)', padding: '0 2rem 2rem' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        
        <main style={{ flex: 1, display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'start' }}>
          
          {/* Left Column: Extraction & Reports download */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '320px' }}>
            
            {/* Extractor card */}
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Instant Feature Extraction</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Upload any aerial clip to query object counts immediately.</p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: '10px',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: 'var(--text-error)',
                  fontSize: '14px'
                }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleExtract} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-main)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  className="glowing-btn"
                  disabled={extracting || !file}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '14.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {extracting ? (
                    <RefreshCw className="animate-spin-fast" size={16} />
                  ) : (
                    <BarChart2 size={16} />
                  )}
                  {extracting ? 'Extracting...' : 'Analyze'}
                </button>
              </form>

              {/* Extraction result rendering */}
              {extractedCounts && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  animation: 'pulse 0.4s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>Extraction Results</span>
                    <button 
                      onClick={() => handleDownloadPDF(extractedCounts)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        padding: '0.3rem 0.8rem',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={12} /> PDF Report
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.keys(extractedCounts).length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No objects classified in this image.</span>
                    ) : (
                      Object.keys(extractedCounts).map((key) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.5px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                          <span style={{ fontWeight: '700' }}>{extractedCounts[key]} instances</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* General Database Summary downloads */}
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Cumulative Records</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Download compiled GIS summaries for all active mapped boundaries in your workspace history.
              </p>
              {stats && stats.totalUploads > 0 ? (
                <button
                  onClick={() => handleDownloadPDF({
                    'Rooftops/Buildings': stats.rooftops,
                    'Waterbodies/Rivers': stats.waterbodies,
                    'Roads/Streets': stats.roads,
                    'Vegetation/Trees': stats.trees
                  })}
                  className="glowing-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    fontSize: '15px',
                    marginTop: '0.5rem'
                  }}
                >
                  <Download size={16} /> Download Cumulative Report (PDF)
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    fontSize: '15px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    opacity: 0.6
                  }}
                >
                  No flight records available for download
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic charts representation */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Distribution of Extracted Features</h3>
              
              {loadingStats ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '260px' }}>
                  <div className="animate-spin-fast" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%' }}></div>
                </div>
              ) : !stats || stats.totalUploads === 0 ? (
                <div style={{
                  height: '260px',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14.5px'
                }}>
                  No flights maps logged to display chart.
                </div>
              ) : (
                <div style={{ height: '260px', position: 'relative' }}>
                  <Pie data={getChartData()} options={chartOptions} />
                </div>
              )}
              
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-0.5rem' }}>
                Chart maps proportional distributions across all processed orthophoto flight grids.
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Reports;
