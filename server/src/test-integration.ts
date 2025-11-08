import { io as ioClient, Socket } from 'socket.io-client';
import { CardType, GameState, BattleEvent } from '../../shared/types';

// 테스트용 클라이언트 래퍼
class TestClient {
  private socket: Socket;
  public playerId: string = '';
  public gameState: GameState | null = null;

  constructor(private name: string) {
    this.socket = ioClient('http://localhost:3000');

    this.socket.on('connect', () => {
      this.playerId = this.socket.id!;
      console.log(`✅ ${this.name} connected: ${this.playerId}`);
    });

    this.socket.on('matchFound', (state: GameState) => {
      console.log(`\n🎮 ${this.name} - Match found!`);
      this.gameState = state;
    });

    this.socket.on('gameStateUpdate', (state: GameState) => {
      console.log(`📊 ${this.name} - Game state updated`);
      this.gameState = state;
    });

    this.socket.on('battleEvents', (events: BattleEvent[]) => {
      console.log(`⚔️  ${this.name} - Received ${events.length} battle events`);
    });

    this.socket.on('error', (message: string) => {
      console.error(`❌ ${this.name} - Error: ${message}`);
    });
  }

  joinMatchmaking() {
    console.log(`\n🔍 ${this.name} - Joining matchmaking...`);
    this.socket.emit('joinMatchmaking');
  }

  selectCards(cards: [CardType, CardType, CardType]) {
    console.log(`\n🎴 ${this.name} - Selecting cards: ${cards.join(', ')}`);
    this.socket.emit('selectCards', cards);
  }

  disconnect() {
    this.socket.disconnect();
  }

  waitForState(): Promise<void> {
    return new Promise((resolve) => {
      if (this.gameState) {
        resolve();
      } else {
        this.socket.once('gameStateUpdate', () => resolve());
        this.socket.once('matchFound', () => resolve());
      }
    });
  }
}

// 테스트 시나리오
async function runIntegrationTest() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🧪 Integration Test Starting          ║');
  console.log('╚════════════════════════════════════════╝\n');

  const player1 = new TestClient('Player 1');
  const player2 = new TestClient('Player 2');

  // 연결 대기
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 1. 매칭 시작
  player1.joinMatchmaking();

  await new Promise((resolve) => setTimeout(resolve, 500));

  player2.joinMatchmaking();

  // 매칭 완료 대기
  await Promise.all([player1.waitForState(), player2.waitForState()]);

  console.log('\n✅ Both players matched!\n');

  // 2. 카드 선택
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Player 1: 오른쪽 이동 -> 공격
  player1.selectCards([CardType.MOVE_RIGHT, CardType.ATTACK_FORWARD, CardType.DEFEND]);

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Player 2: 왼쪽 이동 -> 방어
  player2.selectCards([CardType.MOVE_LEFT, CardType.DEFEND, CardType.ATTACK_CROSS]);

  // 전투 완료 대기
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ✅ Integration Test Completed         ║');
  console.log('╚════════════════════════════════════════╝\n');

  if (player1.gameState) {
    console.log('Final Game State:');
    console.log(`  Round: ${player1.gameState.round}`);
    console.log(`  Phase: ${player1.gameState.phase}`);
    console.log(`  Player 1 HP: ${player1.gameState.player1.stats.hp}`);
    console.log(`  Player 2 HP: ${player1.gameState.player2.stats.hp}`);
    console.log(`  Result: ${player1.gameState.result || 'Ongoing'}`);
  }

  // 정리
  await new Promise((resolve) => setTimeout(resolve, 1000));
  player1.disconnect();
  player2.disconnect();

  process.exit(0);
}

// 에러 핸들링
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// 테스트 실행
runIntegrationTest();
