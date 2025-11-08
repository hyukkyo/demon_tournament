import { Socket } from 'socket.io';
import { MatchmakingService } from '../services/MatchmakingService';
import { CardSelection } from '../../../shared/types';

export function setupGameHandlers(socket: Socket, matchmaking: MatchmakingService) {
  const playerId = socket.id;

  console.log(`\n👤 Player connected: ${playerId}`);

  // 매칭 시작
  socket.on('joinMatchmaking', () => {
    console.log(`\n🔍 Matchmaking request from ${playerId}`);

    const gameRoom = matchmaking.joinMatchmaking(playerId);

    if (gameRoom) {
      // 매칭 성공 - 양쪽 플레이어에게 알림
      const player1Id = gameRoom.gameState.player1.playerId;
      const player2Id = gameRoom.gameState.player2.playerId;

      // Socket.IO 룸에 참가
      socket.join(gameRoom.id);
      const opponentSocket = socket.to(player2Id === playerId ? player1Id : player2Id);
      opponentSocket.socketsJoin(gameRoom.id);

      // 양쪽에게 게임 시작 알림
      socket.server?.to(gameRoom.id).emit('matchFound', gameRoom.gameState);

      console.log(`  📢 Both players notified - Game room: ${gameRoom.id}`);
    } else {
      console.log(`  ⏳ ${playerId} is waiting for opponent...`);
    }
  });

  // 카드 선택
  socket.on('selectCards', (cards: CardSelection) => {
    console.log(`\n🎴 Card selection from ${playerId}`);

    const gameRoom = matchmaking.getGameRoom(playerId);

    if (!gameRoom) {
      socket.emit('error', 'You are not in a game');
      return;
    }

    const result = gameRoom.selectCards(playerId, cards);

    if (!result.success) {
      socket.emit('error', result.error || 'Invalid card selection');
      return;
    }

    // 상대방에게 준비 완료 알림
    const opponentId = gameRoom.getOpponentId(playerId);
    if (opponentId) {
      socket.to(opponentId).emit('gameStateUpdate', gameRoom.gameState);
    }

    // 양쪽 플레이어가 준비되었으면 전투 시작
    if (gameRoom.isBothPlayersReady()) {
      console.log(`\n⚔️  Both players ready - Starting battle!`);

      const events = gameRoom.startBattle();

      // 전투 이벤트를 양쪽에게 전송
      socket.server?.to(gameRoom.id).emit('battleEvents', events);

      // 업데이트된 게임 상태 전송
      socket.server?.to(gameRoom.id).emit('gameStateUpdate', gameRoom.gameState);

      // 게임 종료 체크
      if (gameRoom.isGameEnded()) {
        console.log(`\n🏁 Game ended - Room: ${gameRoom.id}`);
        console.log(`  Result: ${gameRoom.gameState.result}`);

        // 게임 종료 후 정리
        setTimeout(() => {
          matchmaking.endGame(gameRoom.id);
        }, 5000); // 5초 후 정리
      }
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`\n👋 Player disconnected: ${playerId}`);
    matchmaking.handlePlayerDisconnect(playerId);

    // 통계 출력
    const stats = matchmaking.getStats();
    console.log(`  📊 Server stats: ${stats.activeGames} games, ${stats.waitingPlayers} waiting`);
  });
}
