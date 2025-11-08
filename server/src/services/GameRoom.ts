import { GameState, CardSelection, PlayerId, GamePhase } from '../../../shared/types';
import { GameEngine } from '../game/engine/GameEngine';

export class GameRoom {
  public readonly id: string;
  public gameState: GameState;
  private engine: GameEngine;

  constructor(player1Id: PlayerId, player2Id: PlayerId) {
    this.id = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.engine = new GameEngine();
    this.gameState = this.engine.createNewGame(player1Id, player2Id);

    console.log(`\n🎮 Game Room Created: ${this.id}`);
    console.log(`  Player 1: ${player1Id}`);
    console.log(`  Player 2: ${player2Id}`);
  }

  // 카드 선택 처리
  public selectCards(playerId: PlayerId, cards: CardSelection): { success: boolean; error?: string } {
    // 준비 페이즈인지 확인
    if (this.gameState.phase !== GamePhase.PREPARATION) {
      return { success: false, error: '카드 선택 단계가 아닙니다' };
    }

    const isPlayer1 = this.gameState.player1.playerId === playerId;
    const character = isPlayer1 ? this.gameState.player1 : this.gameState.player2;

    // 카드 검증
    const validation = this.engine.validateCardSelection(character, cards);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 카드 선택 저장
    if (isPlayer1) {
      this.gameState.player1Selection = cards;
      this.gameState.player1Ready = true;
      console.log(`  ✓ Player 1 selected cards: ${cards.join(', ')}`);
    } else {
      this.gameState.player2Selection = cards;
      this.gameState.player2Ready = true;
      console.log(`  ✓ Player 2 selected cards: ${cards.join(', ')}`);
    }

    return { success: true };
  }

  // 양쪽 플레이어가 준비되었는지 확인
  public isBothPlayersReady(): boolean {
    return this.gameState.player1Ready && this.gameState.player2Ready;
  }

  // 전투 시작
  public startBattle() {
    if (!this.isBothPlayersReady()) {
      throw new Error('Both players must be ready to start battle');
    }

    console.log(`\n⚔️  Starting Battle - Round ${this.gameState.round}`);
    this.engine.printBattleField(this.gameState);

    this.gameState.phase = GamePhase.BATTLE;

    const { events, newState } = this.engine.simulateBattle(this.gameState);

    this.gameState = newState;

    console.log('\n📊 Battle Result:');
    this.engine.printBattleField(this.gameState);

    // 게임이 끝나지 않았으면 다음 라운드 준비
    if (this.gameState.phase !== GamePhase.ENDED) {
      this.prepareNextRound();
    }

    return events;
  }

  // 다음 라운드 준비
  private prepareNextRound() {
    this.gameState.round++;
    this.gameState.phase = GamePhase.PREPARATION;
    this.gameState.player1Selection = null;
    this.gameState.player2Selection = null;
    this.gameState.player1Ready = false;
    this.gameState.player2Ready = false;

    console.log(`\n🔄 Round ${this.gameState.round} - Preparation Phase`);
  }

  // 플레이어가 이 룸에 속해있는지 확인
  public hasPlayer(playerId: PlayerId): boolean {
    return (
      this.gameState.player1.playerId === playerId || this.gameState.player2.playerId === playerId
    );
  }

  // 상대방 ID 가져오기
  public getOpponentId(playerId: PlayerId): PlayerId | null {
    if (this.gameState.player1.playerId === playerId) {
      return this.gameState.player2.playerId;
    } else if (this.gameState.player2.playerId === playerId) {
      return this.gameState.player1.playerId;
    }
    return null;
  }

  // 게임이 끝났는지 확인
  public isGameEnded(): boolean {
    return this.gameState.phase === GamePhase.ENDED;
  }
}
