import React from 'react';
import { Wallet, LogOut, Link2, ShieldCheck } from 'lucide-react';

export default function WalletConnector({ account, balance, network, isConnecting, connectWallet, disconnectWallet }) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="glass-card glow-cyan-hover">
      <div className="card-title-container">
        <h3 className="card-title font-orbitron">
          <Wallet size={18} className="text-cyan" />
          Web3 Connection
        </h3>
        {account && (
          <span className="blinking-dot"></span>
        )}
      </div>

      {!account ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Connect your MetaMask or Web3 browser wallet to start copy-trading and automating actions.
          </p>
          <button 
            className="btn-neon" 
            onClick={connectWallet}
            disabled={isConnecting}
            style={{ width: '100%' }}
          >
            {isConnecting ? 'Initializing...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="stat-box">
              <span className="stat-label">Wallet Address</span>
              <span className="stat-value font-mono" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)' }}>
                {formatAddress(account)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">ETH Balance</span>
              <span className="stat-value font-mono" style={{ fontSize: '1rem' }}>
                {parseFloat(balance).toFixed(4)} ETH
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} className="text-green" />
              <span>Network: <strong className="text-green">{network || 'Ethereum Mainnet'}</strong></span>
            </div>
            <button 
              onClick={disconnectWallet}
              style={{ background: 'transparent', border: 'none', color: 'var(--neon-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
