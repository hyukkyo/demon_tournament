import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';

// 개발 중 Socket 이벤트 디버깅을 위해 StrictMode 비활성화
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
