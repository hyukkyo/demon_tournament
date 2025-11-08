import { Position } from '../../../../shared/types';

export class BattleField {
  public readonly width = 4; // 가로 4칸
  public readonly height = 3; // 세로 3칸

  // 위치가 필드 범위 내에 있는지 확인
  public isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
  }

  // 초기 위치 반환
  public getInitialPositions(): { player1: Position; player2: Position } {
    return {
      player1: { x: 0, y: 1 }, // 왼쪽 중앙
      player2: { x: 3, y: 1 }, // 오른쪽 중앙
    };
  }

  // 이동 후 위치 계산
  public calculateMove(
    current: Position,
    direction: 'up' | 'down' | 'left' | 'right'
  ): Position | null {
    let newPos: Position;

    switch (direction) {
      case 'up':
        newPos = { x: current.x, y: current.y - 1 };
        break;
      case 'down':
        newPos = { x: current.x, y: current.y + 1 };
        break;
      case 'left':
        newPos = { x: current.x - 1, y: current.y };
        break;
      case 'right':
        newPos = { x: current.x + 1, y: current.y };
        break;
    }

    return this.isValidPosition(newPos) ? newPos : null;
  }

  // 공격 범위 계산 (패턴을 현재 위치에 적용)
  public getAttackTargets(casterPos: Position, pattern: Position[]): Position[] {
    return pattern
      .map((offset) => ({
        x: casterPos.x + offset.x,
        y: casterPos.y + offset.y,
      }))
      .filter((pos) => this.isValidPosition(pos));
  }

  // 두 위치가 같은지 확인
  public isSamePosition(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  // 필드를 텍스트로 출력 (디버깅용)
  public printField(player1Pos: Position, player2Pos: Position): string {
    let output = '\n┌─────────────┐\n';

    for (let y = 0; y < this.height; y++) {
      output += '│ ';
      for (let x = 0; x < this.width; x++) {
        const pos = { x, y };
        if (this.isSamePosition(pos, player1Pos)) {
          output += 'P1 ';
        } else if (this.isSamePosition(pos, player2Pos)) {
          output += 'P2 ';
        } else {
          output += '·  ';
        }
      }
      output += '│\n';
    }

    output += '└─────────────┘\n';
    return output;
  }
}
