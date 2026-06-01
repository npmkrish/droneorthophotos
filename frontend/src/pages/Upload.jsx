import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import exifr from 'exifr';
import { Upload as UploadIcon, AlertCircle, Compass, Image as ImageIcon } from 'lucide-react';

function Upload() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [exifSuccess, setExifSuccess] = useState(false);

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError('');
    setExifSuccess(false);
    setMessage('Reading EXIF metadata...');

    try {
      const gps = await exifr.gps(selectedFile);
      if (gps && gps.latitude && gps.longitude) {
        setLatitude(gps.latitude.toFixed(6));
        setLongitude(gps.longitude.toFixed(6));
        setExifSuccess(true);
        setMessage('GPS coordinates extracted successfully from EXIF!');
      } else {
        setLatitude('');
        setLongitude('');
        setMessage('No embedded EXIF coordinates found. Please input coordinates manually.');
      }
    } catch (err) {
      console.warn('Failed to parse EXIF metadata:', err);
      setMessage('Failed to extract EXIF. Please input coordinates manually.');
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to process.');
      return;
    }
    if (!latitude || !longitude) {
      setError('Latitude and Longitude are required.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('Uploading flight imagery to server...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);

    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prediction process failed');
      }

      setMessage('Inference completed successfully. Redirecting...');
      setTimeout(() => {
        navigate('/scanning');
      }, 500);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)', padding: '0 2rem 2rem' }}>
      <Navbar />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        
        <main className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Upload Flight Imagery</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Drag and drop raw drone orthophotos. GPS flight parameters will resolve automatically if embedded.
            </p>
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

          {message && (
            <div style={{
              background: exifSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${exifSuccess ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`,
              borderRadius: '10px',
              padding: '0.8rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: exifSuccess ? 'var(--text-success)' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <Compass size={18} className={loading ? 'animate-spin-fast' : ''} />
              <span>{message}</span>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr',
            gap: '2rem',
            marginTop: '0.5rem',
            alignItems: 'start'
          }}>
            
            {/* Left: Drag & Drop upload container */}
            <div 
              onDragOver={onDragOver}
              onDrop={onDrop}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '16px',
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              onClick={() => document.getElementById('file-select').click()}
            >
              <input 
                id="file-select" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                padding: '1.25rem',
                borderRadius: '50%',
                color: 'var(--primary)'
              }}>
                <UploadIcon size={32} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Choose image or drag here</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Supports JPG, JPEG, PNG drone captures</span>
              </div>
            </div>

            {/* Right: Preview panel */}
            {previewUrl && (
              <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
                  <ImageIcon size={14} />
                  <span>PREVIEW</span>
                </div>
                <img 
                  src={previewUrl} 
                  alt="Upload preview" 
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
            )}

          </div>

          {/* Coordinate Form Inputs */}
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            marginTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="latitude" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-muted)' }}>Flight Latitude</label>
                <input
                  id="latitude"
                  type="text"
                  required
                  placeholder="e.g. 28.6139"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="longitude" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-muted)' }}>Flight Longitude</label>
                <input
                  id="longitude"
                  type="text"
                  required
                  placeholder="e.g. 77.2090"
                  className="form-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="glowing-btn"
              disabled={loading || !file}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '10px',
                fontSize: '15px',
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                opacity: !file ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <span className="animate-spin-fast" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%' }}></span>
                  Processing YOLO Segmentation...
                </>
              ) : 'Submit Flight Run'}
            </button>
          </form>

        </main>
      </div>
    </div>
  );
}

export default Upload;
