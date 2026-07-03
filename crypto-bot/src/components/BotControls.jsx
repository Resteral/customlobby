import React, { useState } from 'react';
import { Play, Square, Settings, Eye, EyeOff, Info, RefreshCw } from 'lucide-react';

export default function BotControls({
  buyTrigger,
  sellTrigger,
  tradeAmount,
  copyTarget,
  isActive,
  mode,
  privateKey,
  onStart,
  onStop,
  onParamChange,
  account
}) {
  const [showPk, setShowPk] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText("0x9361aDF2b72f413D96f81FF40D794B47CE13b331");
    alert("Token address copied to clipboard!");
  };

  return (
    <div className="glass-card glow-purple-hover" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="card-title-container">
        <h3 className="card-title font-orbitron">
          <Settings size={18} className="text-purple" />
          Bot Parameters
        </h3>
        <span className={`tag ${isActive ? 'tag-buy' : 'tag-sell'}`}>
          {isActive ? 'Active' : 'Stopped'}
        </span>
      </div>

      {/* Target Token Contract Info */}
      <div className="form-group">
        <label className="form-label">
          <span>Target Token Address (BARRON)</span>
          <span className="text-cyan" style={{ cursor: 'pointer' }} onClick={handleCopyClick}>Copy Address</span>
        </label>
        <div className="address-copyable" onClick={handleCopyClick}>
          <span className="font-mono">0x9361aDF2b72f413D96f81FF40D794B47CE13b331</span>
          <span className="key-badge">ERC-20</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Mode Selector */}
        <div className="form-group">
          <label className="form-label">Execution Mode</label>
          <select 
            className="form-select"
            value={mode}
            onChange={(e) => onParamChange('mode', e.target.value)}
            disabled={isActive}
          >
            <option value="prompted">Prompted (MetaMask)</option>
            <option value="privateKey">Auto Signer (Private Key)</option>
          </select>
        </div>

        {/* Trade Size */}
        <div className="form-group">
          <label className="form-label">Trade Size (ETH)</label>
          <input 
            type="number" 
            className="form-input font-mono" 
            value={tradeAmount}
            onChange={(e) => onParamChange('tradeAmount', parseFloat(e.target.value) || 0)}
            disabled={isActive}
            step="0.01"
            min="0.001"
          />
        </div>
      </div>

      {/* Private Key Input (Only if Mode is privateKey) */}
      {mode === 'privateKey' && (
        <div className="form-group">
          <label className="form-label">
            <span>Trade-Only Private Key</span>
            <span style={{ color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={12} /> Local Memory Only
            </span>
          </label>
          <div className="input-with-action">
            <input 
              type={showPk ? "text" : "password"} 
              className="form-input font-mono" 
              placeholder="0x..." 
              value={privateKey}
              onChange={(e) => onParamChange('privateKey', e.target.value)}
              disabled={isActive}
            />
            <button 
              type="button"
              className="btn-neon btn-neon-pink"
              style={{ padding: '0.5rem', width: '45px' }}
              onClick={() => setShowPk(!showPk)}
            >
              {showPk ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Auto Sniper triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <span>Buy Target</span>
            <span className="text-green">{buyTrigger.toFixed(8)}</span>
          </label>
          <input 
            type="range" 
            min="0.00000100" 
            max="0.00001000" 
            step="0.00000005"
            value={buyTrigger}
            onChange={(e) => onParamChange('buyTrigger', parseFloat(e.target.value))}
            disabled={isActive}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <span>Sell Target</span>
            <span className="text-red">{sellTrigger.toFixed(8)}</span>
          </label>
          <input 
            type="range" 
            min="0.00000500" 
            max="0.00003000" 
            step="0.00000005"
            value={sellTrigger}
            onChange={(e) => onParamChange('sellTrigger', parseFloat(e.target.value))}
            disabled={isActive}
          />
        </div>
      </div>

      {/* Target Wallet to Copy */}
      <div className="form-group">
        <label className="form-label">
          <span>Copy Trading: Wallet Target to Track</span>
          <span style={{ color: 'var(--neon-cyan)' }}>Auto-Executes on Target Swaps</span>
        </label>
        <input 
          type="text" 
          className="form-input font-mono" 
          placeholder="Paste wallet address (e.g. 0x83b...)" 
          value={copyTarget}
          onChange={(e) => onParamChange('copyTarget', e.target.value)}
          disabled={isActive}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '10px' }}>
        {!isActive ? (
          <button 
            className="btn-neon btn-neon-green" 
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            onClick={onStart}
            disabled={!account}
          >
            <Play size={18} fill="currentColor" />
            Start Trading Bot
          </button>
        ) : (
          <button 
            className="btn-neon btn-neon-pink" 
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            onClick={onStop}
          >
            <Square size={18} fill="currentColor" />
            Stop Trading Bot
          </button>
        )}
        {!account && (
          <p style={{ color: 'var(--neon-red)', fontSize: '0.75rem', textAlign: 'center', marginTop: '6px' }}>
            * Connect wallet to start live trading
          </p>
        )}
      </div>
    </div>
  );
}
