import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// 發生錯誤時顯示訊息，而不是一片空白
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page-error">
        <p>頁面載入發生問題，請重新整理再試一次。</p>
        <p className="muted small">{String(this.state.error && this.state.error.message)}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>重新整理</button>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
