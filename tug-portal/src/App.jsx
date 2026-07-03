import React, { useState } from 'react';
import { Gamepad2, MessageSquareCode, Terminal, Sparkles, Home, ArrowLeft } from 'lucide-react';
import TugLobbies from './components/TugLobbies';
import OmegleDebate from './components/OmegleDebate';
import DevSpace from './components/DevSpace';

function App() {
  const [currentView, setCurrentView] = useState('hub');

  const renderView = () => {
    switch (currentView) {
      case 'tug':
        return <TugLobbies onBack={() => setCurrentView('hub')} />;
      case 'debate':
        return <OmegleDebate onBack={() => setCurrentView('hub')} />;
      case 'devspace':
        return <DevSpace onBack={() => setCurrentView('hub')} />;
      default:
        return renderHub();
    }
  };

  const renderHub = () => {
    return (
      <main style={styles.hubContainer}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroGlow}></div>
          <div className="float-animation" style={styles.iconWrapper}>
            <Sparkles size={48} color="var(--accent-cyan)" />
          </div>
          <h1 style={styles.heroTitle}>
            NEON<span className="glow-text-purple">PORTAL</span>
          </h1>
          <p style={styles.heroSubtitle}>
            A futuristic hub for real-time physics duels, high-stakes debates, and instant web hosting.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid-cols-3" style={styles.gridSection}>
          {/* Card 1: Tug Lobbies */}
          <div 
            className="glass-panel glass-panel-hover" 
            style={styles.card}
            onClick={() => setCurrentView('tug')}
          >
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(138, 43, 226, 0.15)', borderColor: 'var(--accent-purple)' }}>
              <Gamepad2 size={32} color="var(--accent-purple)" />
            </div>
            <h2 style={styles.cardTitle}>Tug Lobbies</h2>
            <p style={styles.cardDesc}>
              Join interactive, high-speed clicking lobbies. Compete with simulated players in a real-time tug-of-war match.
            </p>
            <span style={{ ...styles.cardLink, color: 'var(--accent-purple)' }}>
              Enter Lobbies &rarr;
            </span>
          </div>

          {/* Card 2: Omegle Debate */}
          <div 
            className="glass-panel glass-panel-hover" 
            style={styles.card}
            onClick={() => setCurrentView('debate')}
          >
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(255, 0, 128, 0.15)', borderColor: 'var(--accent-pink)' }}>
              <MessageSquareCode size={32} color="var(--accent-pink)" />
            </div>
            <h2 style={styles.cardTitle}>Omegle Debate</h2>
            <p style={styles.cardDesc}>
              Pair with random automated debaters or choose a topic to argue. Watch spectator votes swing in real-time.
            </p>
            <span style={{ ...styles.cardLink, color: 'var(--accent-pink)' }}>
              Start Debating &rarr;
            </span>
          </div>

          {/* Card 3: Dev Space */}
          <div 
            className="glass-panel glass-panel-hover" 
            style={styles.card}
            onClick={() => setCurrentView('devspace')}
          >
            <div style={{ ...styles.cardIconBox, backgroundColor: 'rgba(0, 242, 254, 0.15)', borderColor: 'var(--accent-cyan)' }}>
              <Terminal size={32} color="var(--accent-cyan)" />
            </div>
            <h2 style={styles.cardTitle}>Developer Space</h2>
            <p style={styles.cardDesc}>
              Drop your HTML/CSS/JS files or write code in real-time. Render your website instantly inside a sandboxed live preview.
            </p>
            <span style={{ ...styles.cardLink, color: 'var(--accent-cyan)' }}>
              Launch Sandbox &rarr;
            </span>
          </div>
        </section>
      </main>
    );
  };

  return (
    <div className="app-container" style={styles.appWrapper}>
      {/* Top Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.logoContainer} onClick={() => setCurrentView('hub')}>
          <div style={styles.logoDot}></div>
          <span style={styles.logoText}>NEONPORTAL</span>
        </div>
        <nav style={styles.nav}>
          {currentView !== 'hub' && (
            <button className="btn btn-secondary" onClick={() => setCurrentView('hub')} style={styles.backButton}>
              <ArrowLeft size={16} /> Back to Hub
            </button>
          )}
          <button 
            className={`btn ${currentView === 'hub' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentView('hub')}
          >
            <Home size={16} /> Home
          </button>
        </nav>
      </header>

      {/* Dynamic Content */}
      <div style={styles.contentBody}>
        {renderView()}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} NeonPortal. Powered by ESP32 & Railway concept styling.</p>
      </footer>
    </div>
  );
}

const styles = {
  appWrapper: {
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 40px',
    borderRadius: '0px 0px 24px 24px',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    zIndex: 100,
    position: 'sticky',
    top: 0,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  logoDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-cyan)',
    boxShadow: '0 0 10px var(--accent-cyan)',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '1px',
    background: 'linear-gradient(90deg, #fff, var(--text-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  contentBody: {
    flex: 1,
    padding: '40px 20px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  hubContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '60px',
    padding: '20px 0',
  },
  heroSection: {
    textAlign: 'center',
    position: 'relative',
    padding: '40px 0',
  },
  heroGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    height: '300px',
    backgroundColor: 'var(--accent-purple)',
    borderRadius: '50%',
    filter: 'blur(120px)',
    opacity: 0.15,
    zIndex: -1,
  },
  iconWrapper: {
    marginBottom: '20px',
    display: 'inline-flex',
  },
  heroTitle: {
    fontSize: '4.5rem',
    fontWeight: '800',
    letterSpacing: '-2px',
    lineHeight: '1.1',
    marginBottom: '16px',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    margin: '0 auto',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  gridSection: {
    marginTop: '20px',
  },
  card: {
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cardIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  cardDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    flexGrow: 1,
  },
  cardLink: {
    fontWeight: '700',
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition-smooth)',
  },
  footer: {
    textAlign: 'center',
    padding: '30px 20px',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    borderTop: '1px solid var(--border-glass)',
    marginTop: '40px',
  }
};

export default App;
