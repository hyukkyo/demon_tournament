import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { HomePage } from './pages/HomePage';
import { LobbyPage } from './pages/LobbyPage';
import { CharacterSelectPage } from './pages/CharacterSelectPage';
import { CardSelectPage } from './pages/CardSelectPage';
import { BattlePage } from './pages/BattlePage';

function App() {
  // 앱 시작 시 Socket 연결 초기화
  useSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/character-select" element={<CharacterSelectPage />} />
        <Route path="/card-select" element={<CardSelectPage />} />
        <Route path="/battle" element={<BattlePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
