import { GameEngine } from '../engine/GameEngine';
import { CardType } from '../../../../shared/types';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  describe('createNewGame', () => {
    it('should create a new game with initial state', () => {
      const game = engine.createNewGame('player1', 'player2');

      expect(game.player1.playerId).toBe('player1');
      expect(game.player2.playerId).toBe('player2');
      expect(game.player1.stats.hp).toBe(100);
      expect(game.player2.stats.hp).toBe(100);
      expect(game.player1.stats.energy).toBe(100);
      expect(game.player2.stats.energy).toBe(100);
      expect(game.player1.position).toEqual({ x: 0, y: 1 });
      expect(game.player2.position).toEqual({ x: 3, y: 1 });
    });
  });

  describe('validateCardSelection', () => {
    it('should accept valid card selection', () => {
      const game = engine.createNewGame('p1', 'p2');
      const cards: [CardType, CardType, CardType] = [
        CardType.MOVE_RIGHT,
        CardType.ATTACK_CROSS,
        CardType.DEFEND,
      ];

      const result = engine.validateCardSelection(game.player1, cards);

      expect(result.valid).toBe(true);
    });

    it('should reject duplicate cards', () => {
      const game = engine.createNewGame('p1', 'p2');
      const cards: [CardType, CardType, CardType] = [
        CardType.MOVE_RIGHT,
        CardType.MOVE_RIGHT,
        CardType.DEFEND,
      ];

      const result = engine.validateCardSelection(game.player1, cards);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('중복');
    });
  });

  describe('simulateBattle - Movement', () => {
    it('should move characters correctly', () => {
      const game = engine.createNewGame('p1', 'p2');
      game.player1Selection = [CardType.MOVE_RIGHT, CardType.MOVE_RIGHT, CardType.MOVE_RIGHT];
      game.player2Selection = [CardType.MOVE_LEFT, CardType.MOVE_LEFT, CardType.MOVE_LEFT];

      console.log('\n=== Test: Movement ===');
      engine.printBattleField(game);

      const { newState } = engine.simulateBattle(game);

      console.log('\n=== After Battle ===');
      engine.printBattleField(newState);

      // Player 1 should move right: (0,1) -> (3,1)
      expect(newState.player1.position.x).toBe(3);
      // Player 2 should move left: (3,1) -> (0,1)
      expect(newState.player2.position.x).toBe(0);
    });
  });

  describe('simulateBattle - Combat', () => {
    it('should deal damage when attack hits', () => {
      const game = engine.createNewGame('p1', 'p2');

      // Player 1: 오른쪽 이동 -> 공격
      // Player 2: 왼쪽 이동 -> 방어
      game.player1Selection = [CardType.MOVE_RIGHT, CardType.ATTACK_FORWARD, CardType.MOVE_RIGHT];
      game.player2Selection = [CardType.MOVE_LEFT, CardType.DEFEND, CardType.MOVE_LEFT];

      console.log('\n=== Test: Combat ===');
      engine.printBattleField(game);

      const { newState } = engine.simulateBattle(game);

      console.log('\n=== After Battle ===');
      engine.printBattleField(newState);

      // Player 2가 데미지를 받았는지 확인
      expect(newState.player2.stats.hp).toBeLessThan(100);
    });

    it('should reduce damage when defending', () => {
      const game = engine.createNewGame('p1', 'p2');

      // 가까이 이동시킨 후
      game.player1.position = { x: 1, y: 1 };
      game.player2.position = { x: 2, y: 1 };

      // Player 1: 십자 공격
      // Player 2: 방어
      game.player1Selection = [CardType.ATTACK_CROSS, CardType.ENERGY_RECOVERY, CardType.DEFEND];
      game.player2Selection = [CardType.DEFEND, CardType.ENERGY_RECOVERY, CardType.ATTACK_CROSS];

      console.log('\n=== Test: Defense ===');
      engine.printBattleField(game);

      const { newState } = engine.simulateBattle(game);

      console.log('\n=== After Battle ===');
      engine.printBattleField(newState);

      // 방어로 인해 데미지가 감소했는지 확인
      // 십자 공격 = 30 데미지, 방어 = 15 감소 -> 15 데미지
      expect(newState.player2.stats.hp).toBe(85);
    });

    it('should end game when HP reaches 0', () => {
      const game = engine.createNewGame('p1', 'p2');

      // Player 2 HP를 낮게 설정
      game.player2.stats.hp = 20;
      game.player1.position = { x: 1, y: 1 };
      game.player2.position = { x: 2, y: 1 };

      // Player 1: 십자 공격 (30 데미지)
      game.player1Selection = [CardType.ATTACK_CROSS, CardType.ATTACK_CROSS, CardType.ATTACK_CROSS];
      game.player2Selection = [CardType.MOVE_UP, CardType.MOVE_DOWN, CardType.MOVE_UP];

      console.log('\n=== Test: Game End ===');
      engine.printBattleField(game);

      const { newState, events } = engine.simulateBattle(game);

      console.log('\n=== After Battle ===');
      engine.printBattleField(newState);

      expect(newState.player2.stats.hp).toBe(0);
      expect(newState.result).toBe('PLAYER1_WIN');
      expect(events.some((e) => e.type === 'GAME_END')).toBe(true);
    });
  });

  describe('simulateBattle - Priority', () => {
    it('should process cards by priority', () => {
      const game = engine.createNewGame('p1', 'p2');

      game.player1.position = { x: 1, y: 1 };
      game.player2.position = { x: 2, y: 1 };

      // Player 1: 공격 (우선순위 3)
      // Player 2: 이동 (우선순위 1) - 공격보다 먼저 처리되어 회피
      game.player1Selection = [CardType.ATTACK_CROSS, CardType.MOVE_RIGHT, CardType.MOVE_RIGHT];
      game.player2Selection = [CardType.MOVE_UP, CardType.MOVE_DOWN, CardType.MOVE_UP];

      console.log('\n=== Test: Priority ===');
      engine.printBattleField(game);

      const { newState } = engine.simulateBattle(game);

      console.log('\n=== After Battle ===');
      engine.printBattleField(newState);

      // Player 2가 먼저 이동하여 공격을 회피했으므로 HP가 100
      expect(newState.player2.stats.hp).toBe(100);
    });
  });
});
