import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Shield, ArrowRight, Play, FileText, CheckCircle2 } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15) 0%, #0b0f19 60%)' }}>
      
      {/* Header */}
      <header style={{
        display: 'flex',
        justify-content: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 6%',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '22px', fontWeight: '800' }}>
            <span style={{ color: 'var(--primary)' }}>Fusion</span>
            <span style={{ color: '#ffffff' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Features</a>
          <a href="#applications" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Applications</a>
          <button 
            className="glowing-btn" 
            onClick={() => navigate('/login')}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '20px',
              fontSize: '15px'
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem 6% 6rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '3rem',
          flexWrap: 'wrap'
        }}>
          {/* Hero Left */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* SVAMITVA Support Badge */}
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start' }} className="glass-panel">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 1rem',
                fontSize: '13px',
                fontWeight: '600',
                color: '#fff',
                borderRadius: '16px'
              }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} className="animate-pulse-slow"></span>
                <span>Supporting Digital India: SVAMITVA Scheme</span>
              </div>
            </div>

            <h1 style={{ fontSize: '3.75rem', fontWeight: '800', lineHeight: 1.15, letterSpacing: '-1px' }}>
              Transform Aerial Data <br />
              <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Into Actionable Intelligence
              </span>
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '540px' }}>
              Harness the power of AI to convert overlapping drone imagery into geometrically corrected orthophotos. Automatically extract boundaries, structures, and surface features in seconds.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
              <button 
                className="glowing-btn" 
                onClick={() => navigate('/login')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.9rem 1.8rem',
                  borderRadius: '25px',
                  fontSize: '16px'
                }}
              >
                Start Mapping Now <ArrowRight size={18} />
              </button>
              <button 
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.9rem 1.8rem',
                  borderRadius: '25px',
                  fontSize: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
              >
                <Play size={16} fill="#fff" /> Virtual Tour
              </button>
            </div>
          </div>

          {/* Hero Right: Premium Mockup Graphic */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              borderRadius: '24px',
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)'
            }}>
              <div style={{
                width: '100%',
                height: '320px',
                borderRadius: '16px',
                background: 'url("https://avt-as.eu/wp-content/uploads/2022/01/DOP_4_B-600x314.jpg") no-repeat center/cover',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                {/* Glowing Overlay grid to represent drone mapping */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}></div>
                {/* Scanning green line simulation */}
                <div className="animate-pulse-slow" style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'var(--secondary)',
                  boxShadow: '0 0 15px var(--secondary)',
                  animation: 'scanLine 4s infinite linear'
                }}></div>
              </div>
              
              {/* Quote bubble */}
              <div className="glass-panel" style={{
                position: 'absolute',
                bottom: '-25px',
                left: '20px',
                right: '20px',
                padding: '1rem',
                borderRadius: '14px',
                fontSize: '13.5px',
                background: 'rgba(10, 15, 30, 0.95)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>"Our innovators are proving every day that India has the talent to lead the AI revolution."</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid Section */}
        <div id="features" style={{ marginTop: '9rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '3rem' }}>
            Powered by Cutting-Edge <span className="text-gradient">GIS & AI Solutions</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', width: '3rem', height: '3rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <Compass size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Automated Georeferencing</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
                Extract coordinates dynamically from EXIF metadata headers and orthorectify overlapping boundaries automatically.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', width: '3rem', height: '3rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Segment-wise Feature Extraction</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
                Detect features such as roofs, water bodies, roads, and agricultural boundaries using custom deep learning segmentations.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(217, 70, 239, 0.1)', color: 'var(--accent)', width: '3rem', height: '3rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Comprehensive PDF Analytics</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
                Compile count summaries, class structures, and spatial conclusions directly into downloadable verified PDF reports.
              </p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div id="applications" style={{ marginTop: '7rem', display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Practical Applications Across Industries</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '15px' }}>
              Our drone orthophoto pipelines assist engineers, land surveyors, and government schemes in resolving land disputes and monitoring crops.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['Precision Agriculture & Crop Health Mapping', 'Urban Land Dispute & Boundary Resolutions', 'Disaster & Flooding Damage Assessment Mapping', 'Encroachment Monitoring & Forestry Planning'].map((appText, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--secondary)' }} />
                  <span style={{ fontWeight: '500', fontSize: '15px' }}>{appText}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '450px',
              height: '250px',
              borderRadius: '20px',
              background: 'linear-gradient(rgba(11,15,25,0.7), rgba(11,15,25,0.7)), url("https://avt-as.eu/wp-content/uploads/2022/01/DOP_4_B-600x314.jpg") center/cover',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '20px'
            }}>
              Digital India Cadastral Mapping Initiative
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '14px'
      }}>
        © 2026 Fusion AI mapping portal. Built for SIH 2024. All rights reserved.
      </footer>
    </div>
  );
}

export default Landing;
