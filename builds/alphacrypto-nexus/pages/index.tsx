import React from 'react';

export default function StoreFront() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b12', color: '#fff', fontFamily: 'sans-serif', padding: '40px' }}>
      <header style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px' }}>AlphaCrypto Nexus</h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '32px' }}>Digital product portal and members area for Crypto Trading Alpha Portal</p>
        <div style={{ display: 'inline-block', background: '#6366f1', color: '#fff', padding: '14px 28px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          Unlock All-Access via Whop
        </div>
      </header>
    </div>
  );
}
