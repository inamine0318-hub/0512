import React from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: {children: React.ReactNode}) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#0a150a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>エラーが発生しました</div>
          <pre style={{ fontSize: 12, color: '#f87171', maxWidth: 400, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 24, padding: '8px 24px', background: '#4ade80', color: '#000', borderRadius: 24, fontWeight: 'bold' }}>リロード</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
