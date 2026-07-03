import React from 'react';
import { TrendingUp, TrendingDown, Layers, Activity } from 'lucide-react';

export default function PriceChart({ candles, currentPrice, priceChange, buyTrigger, sellTrigger }) {
  // Find min and max to scale chart bars
  const priceValues = candles.map(c => c.price);
  const minPrice = Math.min(...priceValues, buyTrigger || Infinity, sellTrigger || 0) * 0.98;
  const maxPrice = Math.max(...priceValues, buyTrigger || 0, sellTrigger || 0) * 1.02;
  const priceRange = maxPrice - minPrice || 1;

  const getPercentHeight = (price) => {
    return ((price - minPrice) / priceRange) * 100;
  };

  const isPositive = priceChange >= 0;

  return (
    <div className="glass-card glow-cyan-hover">
      <div className="card-title-container">
        <h3 className="card-title font-orbitron">
          <Activity size={18} className="text-cyan" />
          BARRON / ETH Live Feed
        </h3>
        <span className="brand-badge font-mono" style={{ fontSize: '0.7rem' }}>
          0x9361...331
        </span>
      </div>

      <div className="chart-container">
        {/* Price Info Header Overlay */}
        <div className="chart-price-display">
          <span className="chart-price-current font-mono">
            {currentPrice.toFixed(8)} ETH
          </span>
          <span className={`chart-price-change ${isPositive ? 'text-green' : 'text-red'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}% (24h)
          </span>
        </div>

        {/* Dynamic Grid Lines */}
        {[0.25, 0.5, 0.75].map((ratio, idx) => {
          const gridVal = minPrice + priceRange * ratio;
          return (
            <div 
              key={idx} 
              className="chart-grid-line" 
              style={{ bottom: `${ratio * 100}%` }}
            >
              <span style={{ position: 'absolute', right: '5px', top: '-10px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {gridVal.toFixed(8)}
              </span>
            </div>
          );
        })}

        {/* Trigger Line: Sell */}
        {sellTrigger > 0 && (
          <div 
            className="chart-trigger-line sell-trigger"
            style={{ bottom: `${getPercentHeight(sellTrigger)}%` }}
          >
            <span className="chart-trigger-label sell font-orbitron">
              SELL TARGET: {sellTrigger.toFixed(8)} ETH
            </span>
          </div>
        )}

        {/* Trigger Line: Buy */}
        {buyTrigger > 0 && (
          <div 
            className="chart-trigger-line buy-trigger"
            style={{ bottom: `${getPercentHeight(buyTrigger)}%` }}
          >
            <span className="chart-trigger-label buy font-orbitron">
              BUY TARGET: {buyTrigger.toFixed(8)} ETH
            </span>
          </div>
        )}

        {/* Animated Chart Bars */}
        <div className="chart-bar-container">
          {candles.map((candle, idx) => {
            const height = getPercentHeight(candle.price);
            const direction = idx === 0 ? 'up' : (candles[idx].price >= candles[idx-1].price ? 'up' : 'down');
            
            return (
              <div 
                key={idx} 
                className={`chart-bar ${direction}`}
                style={{ 
                  height: `${Math.max(height, 5)}%`, 
                  opacity: idx === candles.length - 1 ? 1 : 0.6 
                }}
                title={`Price: ${candle.price.toFixed(8)} ETH | Vol: ${candle.volume.toFixed(2)} ETH`}
              >
                {idx === candles.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: direction === 'up' ? 'var(--neon-green)' : 'var(--neon-red)',
                    boxShadow: direction === 'up' ? 'var(--glow-green)' : 'var(--glow-red)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Token Details Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>LIQUIDITY</div>
          <div className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--neon-gold)' }}>1,420 ETH</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>MARKET CAP</div>
          <div className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>$12.4M</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>VOLUME (24H)</div>
          <div className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>310.5 ETH</div>
        </div>
      </div>
    </div>
  );
}
