import { PlayerId } from '../../../shared/types';
import { GameRoom } from './GameRoom';

export class MatchmakingService {
  private waitingPlayers: Set<PlayerId> = new Set();
  private activeGames: Map<string, GameRoom> = new Map();
  private playerToGameRoom: Map<PlayerId, string> = new Map();

  // 매칭 대기열에 추가
  public joinMatchmaking(playerId: PlayerId): GameRoom | null {
    // 이미 게임 중이면 매칭 불가
    if (this.playerToGameRoom.has(playerId)) {
      console.log(`  ⚠️  ${playerId} is already in a game`);
      return null;
    }

    // 대기 중인 플레이어가 있으면 매칭
    if (this.waitingPlayers.size > 0) {
      const opponent = Array.from(this.waitingPlayers)[0];
      this.waitingPlayers.delete(opponent);

      const gameRoom = new GameRoom(opponent, playerId);
      this.activeGames.set(gameRoom.id, gameRoom);
      this.playerToGameRoom.set(opponent, gameRoom.id);
      this.playerToGameRoom.set(playerId, gameRoom.id);

      console.log(`  ✅ Match found! ${opponent} vs ${playerId}`);
      return gameRoom;
    } else {
      // 대기열에 추가
      this.waitingPlayers.add(playerId);
      console.log(`  ⏳ ${playerId} added to matchmaking queue`);
      return null;
    }
  }

  // 매칭 취소
  public cancelMatchmaking(playerId: PlayerId): void {
    this.waitingPlayers.delete(playerId);
    console.log(`  ❌ ${playerId} left matchmaking queue`);
  }

  // 플레이어의 게임 룸 가져오기
  public getGameRoom(playerId: PlayerId): GameRoom | null {
    const roomId = this.playerToGameRoom.get(playerId);
    if (!roomId) return null;

    return this.activeGames.get(roomId) || null;
  }

  // 게임 룸 ID로 게임 룸 가져오기
  public getGameRoomById(roomId: string): GameRoom | null {
    return this.activeGames.get(roomId) || null;
  }

  // 게임 종료 처리
  public endGame(roomId: string): void {
    const room = this.activeGames.get(roomId);
    if (!room) return;

    // 플레이어 매핑 제거
    this.playerToGameRoom.delete(room.gameState.player1.playerId);
    this.playerToGameRoom.delete(room.gameState.player2.playerId);

    // 게임 룸 제거
    this.activeGames.delete(roomId);

    console.log(`  🏁 Game ended: ${roomId}`);
  }

  // 플레이어 연결 해제 처리
  public handlePlayerDisconnect(playerId: PlayerId): void {
    // 대기열에서 제거
    this.cancelMatchmaking(playerId);

    // 진행 중인 게임이 있으면 종료
    const room = this.getGameRoom(playerId);
    if (room) {
      console.log(`  🔌 ${playerId} disconnected from game ${room.id}`);
      this.endGame(room.id);
    }
  }

  // 통계
  public getStats() {
    return {
      waitingPlayers: this.waitingPlayers.size,
      activeGames: this.activeGames.size,
    };
  }
}
