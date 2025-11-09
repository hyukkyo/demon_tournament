import {
  GameState,
  GamePhase,
  GameResult,
  Character,
  CardType,
  CardSelection,
  BattleEvent,
  BattleEventType,
  PlayerId,
  Position,
} from '../../../../shared/types';
import { BattleField } from '../models/BattleField';
import { getCardDefinition, DEFAULT_DECK } from '../models/cards';

export class GameEngine {
  private field: BattleField;

  constructor() {
    this.field = new BattleField();
  }

  // 새 게임 상태 생성
  public createNewGame(player1Id: PlayerId, player2Id: PlayerId): GameState {
    const initialPositions = this.field.getInitialPositions();

    return {
      phase: GamePhase.PREPARATION,
      round: 1,
      player1: this.createCharacter(player1Id, initialPositions.player1),
      player2: this.createCharacter(player2Id, initialPositions.player2),
      player1Selection: null,
      player2Selection: null,
      player1Ready: false,
      player2Ready: false,
      result: null,
    };
  }

  // 캐릭터 생성
  private createCharacter(playerId: PlayerId, position: Position): Character {
    return {
      playerId,
      stats: {
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
      },
      position,
      deck: [...DEFAULT_DECK],
      defenseActive: false,
      defenseAmount: 0,
    };
  }

  // 카드 선택 검증
  public validateCardSelection(
    character: Character,
    cards: CardSelection
  ): { valid: boolean; error?: string } {
    const usedCards: CardType[] = [];

    for (const cardType of cards) {
      // 덱에 있는 카드인지 확인
      if (!character.deck.includes(cardType)) {
        return { valid: false, error: `${cardType}는 덱에 없는 카드입니다` };
      }

      // 중복 사용 체크
      if (usedCards.includes(cardType)) {
        return { valid: false, error: `${cardType}를 중복으로 선택했습니다` };
      }

      const card = getCardDefinition(cardType);

      // 에너지 체크
      if (character.stats.energy < card.energyCost) {
        return { valid: false, error: `${cardType} 사용에 필요한 에너지가 부족합니다` };
      }

      usedCards.push(cardType);
    }

    return { valid: true };
  }

  // 전투 시뮬레이션 실행
  public simulateBattle(gameState: GameState): {
    events: BattleEvent[];
    newState: GameState;
  } {
    const events: BattleEvent[] = [];
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState; // deep copy

    if (!newState.player1Selection || !newState.player2Selection) {
      throw new Error('Both players must select cards before battle');
    }

    // 3장의 카드를 순서대로 처리
    for (let i = 0; i < 3; i++) {
      const card1 = newState.player1Selection[i];
      const card2 = newState.player2Selection[i];

      console.log(`\n=== 카드 ${i + 1} 처리 ===`);
      console.log(`Player 1: ${card1}`);
      console.log(`Player 2: ${card2}`);

      // 카드 공개 이벤트 추가
      events.push({
        type: BattleEventType.CARD_REVEAL,
        playerId: '',
        data: {
          cardIndex: i,
          player1Card: card1,
          player2Card: card2,
        },
        cardIndex: i,
      });

      // 방어 초기화 (매 카드마다)
      newState.player1.defenseActive = false;
      newState.player1.defenseAmount = 0;
      newState.player2.defenseActive = false;
      newState.player2.defenseAmount = 0;

      // 카드 우선순위별로 처리
      const roundEvents = this.processCardsByPriority(newState, card1, card2);
      // 각 이벤트에 cardIndex 추가
      roundEvents.forEach((event) => {
        event.cardIndex = i;
      });
      events.push(...roundEvents);

      // 승패 판정
      const result = this.checkGameEnd(newState);
      if (result) {
        newState.result = result;
        newState.phase = GamePhase.ENDED;
        events.push({
          type: BattleEventType.GAME_END,
          playerId: '',
          data: { result },
          cardIndex: i,
        });
        break;
      }
    }

    return { events, newState };
  }

  // 카드를 우선순위별로 처리
  private processCardsByPriority(
    state: GameState,
    card1: CardType,
    card2: CardType
  ): BattleEvent[] {
    const events: BattleEvent[] = [];
    const def1 = getCardDefinition(card1);
    const def2 = getCardDefinition(card2);

    // 우선순위 정렬
    const actions: Array<{ playerId: PlayerId; card: CardType; priority: number }> = [
      { playerId: state.player1.playerId, card: card1, priority: def1.priority },
      { playerId: state.player2.playerId, card: card2, priority: def2.priority },
    ].sort((a, b) => a.priority - b.priority);

    let currentPriority = actions[0].priority;
    let sameGroupActions: typeof actions = [];

    for (const action of actions) {
      if (action.priority === currentPriority) {
        sameGroupActions.push(action);
      } else {
        // 이전 우선순위 그룹 처리
        events.push(...this.processActionGroup(state, sameGroupActions));
        sameGroupActions = [action];
        currentPriority = action.priority;
      }
    }

    // 마지막 그룹 처리
    if (sameGroupActions.length > 0) {
      events.push(...this.processActionGroup(state, sameGroupActions));
    }

    return events;
  }

  // 같은 우선순위 액션들을 동시에 처리
  private processActionGroup(
    state: GameState,
    actions: Array<{ playerId: PlayerId; card: CardType; priority: number }>
  ): BattleEvent[] {
    const events: BattleEvent[] = [];

    for (const action of actions) {
      const character = this.getCharacter(state, action.playerId);
      const cardDef = getCardDefinition(action.card);

      // 에너지 소모
      character.stats.energy -= cardDef.energyCost;

      // 카드 타입별 처리
      if (action.card.startsWith('MOVE_')) {
        events.push(...this.processMove(state, action.playerId, action.card));
      } else if (action.card === CardType.DEFEND) {
        events.push(...this.processDefend(state, action.playerId));
      } else if (action.card === CardType.ENERGY_RECOVERY) {
        events.push(...this.processEnergyRecovery(state, action.playerId));
      } else if (action.card.startsWith('ATTACK_')) {
        events.push(...this.processAttack(state, action.playerId, action.card));
      }
    }

    return events;
  }

  // 이동 처리
  private processMove(state: GameState, playerId: PlayerId, cardType: CardType): BattleEvent[] {
    const character = this.getCharacter(state, playerId);
    let direction: 'up' | 'down' | 'left' | 'right';

    switch (cardType) {
      case CardType.MOVE_UP:
        direction = 'up';
        break;
      case CardType.MOVE_DOWN:
        direction = 'down';
        break;
      case CardType.MOVE_LEFT:
        direction = 'left';
        break;
      case CardType.MOVE_RIGHT:
        direction = 'right';
        break;
      default:
        return [];
    }

    const newPos = this.field.calculateMove(character.position, direction);

    if (newPos) {
      const oldPos = character.position;
      character.position = newPos;
      console.log(
        `${playerId} moved ${direction}: (${oldPos.x},${oldPos.y}) -> (${newPos.x},${newPos.y})`
      );
      return [
        {
          type: BattleEventType.MOVE,
          playerId,
          data: { from: oldPos, to: newPos, direction },
        },
      ];
    } else {
      console.log(`${playerId} tried to move ${direction} but hit the wall`);
      return [];
    }
  }

  // 방어 처리
  private processDefend(state: GameState, playerId: PlayerId): BattleEvent[] {
    const character = this.getCharacter(state, playerId);
    const cardDef = getCardDefinition(CardType.DEFEND);

    character.defenseActive = true;
    character.defenseAmount = cardDef.defenseAmount || 0;

    console.log(`${playerId} is defending (${character.defenseAmount} damage reduction)`);

    return [
      {
        type: BattleEventType.DEFEND,
        playerId,
        data: { amount: character.defenseAmount },
      },
    ];
  }

  // 에너지 회복 처리
  private processEnergyRecovery(state: GameState, playerId: PlayerId): BattleEvent[] {
    const character = this.getCharacter(state, playerId);
    const cardDef = getCardDefinition(CardType.ENERGY_RECOVERY);
    const recovery = cardDef.energyRecovery || 0;

    const oldEnergy = character.stats.energy;
    character.stats.energy = Math.min(character.stats.maxEnergy, character.stats.energy + recovery);

    console.log(
      `${playerId} recovered ${recovery} energy: ${oldEnergy} -> ${character.stats.energy}`
    );

    return [
      {
        type: BattleEventType.ENERGY_RECOVERY,
        playerId,
        data: { amount: recovery, newEnergy: character.stats.energy },
      },
    ];
  }

  // 공격 처리
  private processAttack(state: GameState, playerId: PlayerId, cardType: CardType): BattleEvent[] {
    const attacker = this.getCharacter(state, playerId);
    const defender = this.getOpponent(state, playerId);
    const cardDef = getCardDefinition(cardType);

    if (!cardDef.attackPattern || !cardDef.damage) {
      return [];
    }

    // 공격 범위 계산
    const attackTargets = this.field.getAttackTargets(attacker.position, cardDef.attackPattern);

    // 상대방이 공격 범위 안에 있는지 확인
    const hit = attackTargets.some((pos) => this.field.isSamePosition(pos, defender.position));

    console.log(
      `${playerId} attacks with ${cardType} (damage: ${cardDef.damage}, targets: ${attackTargets.length})`
    );

    if (hit) {
      let damage = cardDef.damage;

      // 방어 적용
      if (defender.defenseActive) {
        damage = Math.max(0, damage - defender.defenseAmount);
        console.log(
          `  -> Hit! Damage reduced by defense: ${cardDef.damage} - ${defender.defenseAmount} = ${damage}`
        );
      } else {
        console.log(`  -> Hit! ${damage} damage dealt`);
      }

      defender.stats.hp -= damage;
      defender.stats.hp = Math.max(0, defender.stats.hp);

      console.log(`  -> ${defender.playerId} HP: ${defender.stats.hp}`);

      return [
        {
          type: BattleEventType.ATTACK,
          playerId,
          data: { cardType, hit: true },
        },
        {
          type: BattleEventType.DAMAGE_DEALT,
          playerId: defender.playerId,
          data: { damage, newHp: defender.stats.hp },
        },
      ];
    } else {
      console.log(`  -> Miss!`);
      return [
        {
          type: BattleEventType.ATTACK,
          playerId,
          data: { cardType, hit: false },
        },
      ];
    }
  }

  // 게임 종료 체크
  private checkGameEnd(state: GameState): GameResult | null {
    const p1Dead = state.player1.stats.hp <= 0;
    const p2Dead = state.player2.stats.hp <= 0;

    if (p1Dead && p2Dead) {
      console.log('\n🤝 DRAW - Both players defeated!');
      return GameResult.DRAW;
    } else if (p1Dead) {
      console.log('\n🎉 Player 2 WINS!');
      return GameResult.PLAYER2_WIN;
    } else if (p2Dead) {
      console.log('\n🎉 Player 1 WINS!');
      return GameResult.PLAYER1_WIN;
    }

    return null;
  }

  // 필드 상태 출력
  public printBattleField(state: GameState): void {
    console.log(this.field.printField(state.player1.position, state.player2.position));
    console.log(`Player 1: HP=${state.player1.stats.hp}, Energy=${state.player1.stats.energy}`);
    console.log(`Player 2: HP=${state.player2.stats.hp}, Energy=${state.player2.stats.energy}`);
  }

  // 헬퍼 함수들
  private getCharacter(state: GameState, playerId: PlayerId): Character {
    return state.player1.playerId === playerId ? state.player1 : state.player2;
  }

  private getOpponent(state: GameState, playerId: PlayerId): Character {
    return state.player1.playerId === playerId ? state.player2 : state.player1;
  }
}
