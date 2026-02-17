import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-white mb-4 animate-bounce-in">
                    🎮 Demon Tournament
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">
                    1대1 멀티플레이 턴제 전략 배틀 게임
                  </p>
                  <div className="space-y-4">
                    <div className="text-green-400 text-lg">✓ 서버 연결 준비 완료</div>
                    <div className="text-blue-400 text-lg">✓ 클라이언트 설정 완료</div>
                    <div className="text-yellow-400 text-lg">🚧 Phase 1 진행 중...</div>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
