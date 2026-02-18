import { Room, IRoom } from '../models/Room.model';
import { Character } from '../models/Character.model';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export class RoomService {
  /**
   * Room의 player.character를 수동으로 populate
   */
  private async populateCharacters(room: IRoom): Promise<IRoom> {
    // 각 플레이어의 character를 조회
    for (const player of room.players) {
      if (player.character) {
        const characterDoc = await Character.findOne({ characterId: player.character });
        if (characterDoc) {
          // character를 객체로 교체
          (player as any).character = characterDoc.toObject();
        }
      }
    }
    return room;
  }
  /**
   * 룸 생성
   */
  async createRoom(playerId: string, username: string): Promise<IRoom> {
    const roomId = this.generateRoomId();

    const room = new Room({
      roomId,
      status: 'waiting',
      players: [
        {
          playerId,
          username,
          selectedCards: [],
          health: 100,
          energy: 100,
          position: { x: 0, y: 1 },
          isReady: false,
          isConnected: true,
        },
      ],
      currentRound: 1,
      currentCardIndex: 0,
    });

    await room.save();
    logger.info(`Room created: ${roomId} by ${username}`);
    return room;
  }

  /**
   * 룸 참가
   */
  async joinRoom(roomId: string, playerId: string, username: string): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestError('Room is not accepting new players');
    }

    if (room.players.length >= 2) {
      throw new BadRequestError('Room is full');
    }

    // 이미 참가한 플레이어인지 확인
    const existingPlayer = room.players.find((p) => p.playerId === playerId);
    if (existingPlayer) {
      logger.info(`Player ${playerId} already in room ${roomId}`);
      return room;
    }

    // 플레이어 추가
    const playerIndex = room.players.length;
    const startPosition = playerIndex === 0 ? { x: 0, y: 1 } : { x: 3, y: 1 };

    room.players.push({
      playerId,
      username,
      selectedCards: [],
      health: 100,
      energy: 100,
      position: startPosition,
      isReady: false,
      isConnected: true,
    });

    // 2명이 모두 들어오면 캐릭터 선택 단계로
    if (room.players.length === 2) {
      room.status = 'character_select';
    }

    await room.save();
    logger.info(`Player ${username} joined room ${roomId}`);
    return this.populateCharacters(room);
  }

  /**
   * 룸 떠나기
   */
  async leaveRoom(roomId: string, playerId: string): Promise<IRoom | null> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // 플레이어 제거
    room.players = room.players.filter((p) => p.playerId !== playerId);

    // 플레이어가 없으면 대기 상태로
    if (room.players.length === 0) {
      await Room.deleteOne({ roomId });
      logger.info(`Room ${roomId} deleted (no players)`);
      return null;
    }

    // 게임 진행 중이었으면 종료
    if (room.status === 'battle') {
      room.status = 'finished';
      // 남은 플레이어가 승자
      if (room.players.length === 1) {
        room.winner = room.players[0].playerId;
      }
    } else {
      // 대기 상태로 복귀
      room.status = 'waiting';
    }

    await room.save();
    logger.info(`Player ${playerId} left room ${roomId}`);
    return this.populateCharacters(room);
  }

  /**
   * 룸 조회
   */
  async getRoomById(roomId: string): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return this.populateCharacters(room);
  }

  /**
   * 플레이어 연결 상태 업데이트
   */
  async updatePlayerConnection(
    roomId: string,
    playerId: string,
    isConnected: boolean
  ): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (player) {
      player.isConnected = isConnected;
      await room.save();
    }

    return this.populateCharacters(room);
  }

  /**
   * 플레이어가 모두 준비되었는지 확인
   */
  checkAllPlayersReady(room: IRoom): boolean {
    return room.players.length === 2 && room.players.every((p) => p.isReady);
  }

  /**
   * 다음 단계로 전환
   */
  async transitionToNextPhase(room: IRoom): Promise<IRoom> {
    switch (room.status) {
      case 'character_select':
        if (this.checkAllPlayersReady(room)) {
          room.status = 'card_select';
          room.players.forEach((p) => (p.isReady = false));
        }
        break;

      case 'card_select':
        if (this.checkAllPlayersReady(room)) {
          room.status = 'battle';
          room.currentCardIndex = 0;
          room.players.forEach((p) => (p.isReady = false));
        }
        break;

      case 'battle':
        // 3장의 카드를 모두 사용했으면 다시 카드 선택으로
        if (room.currentCardIndex >= 2) {
          room.status = 'card_select';
          room.currentRound += 1;
          room.currentCardIndex = 0;
          room.players.forEach((p) => {
            p.selectedCards = [];
            p.isReady = false;
          });
        }
        break;
    }

    await room.save();
    return room;
  }

  /**
   * 캐릭터 선택
   */
  async selectCharacter(roomId: string, playerId: string, characterId: string): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'character_select') {
      throw new BadRequestError('Not in character selection phase');
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) {
      throw new NotFoundError('Player not found in room');
    }

    // 캐릭터 정보 저장
    player.character = characterId as any;

    // 모든 플레이어가 캐릭터를 선택했는지 확인
    const allSelected = room.players.every((p) => p.character);
    if (allSelected) {
      room.status = 'card_select';
    }

    await room.save();
    logger.info(`Player ${playerId} selected character ${characterId} in room ${roomId}`);
    return this.populateCharacters(room);
  }

  /**
   * 카드 선택
   */
  async selectCards(roomId: string, playerId: string, cardIds: string[]): Promise<IRoom> {
    const room = await Room.findOne({ roomId });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'card_select') {
      throw new BadRequestError('Not in card selection phase');
    }

    if (cardIds.length !== 3) {
      throw new BadRequestError('Must select exactly 3 cards');
    }

    const player = room.players.find((p) => p.playerId === playerId);
    if (!player) {
      throw new NotFoundError('Player not found in room');
    }

    // 카드 선택 정보 저장
    player.selectedCards = cardIds;
    player.isReady = true;

    // 모든 플레이어가 카드를 선택했는지 확인
    const allSelected = room.players.every((p) => p.selectedCards.length === 3 && p.isReady);
    if (allSelected) {
      room.status = 'battle';
      room.currentCardIndex = 0;
    }

    await room.save();
    logger.info(`Player ${playerId} selected ${cardIds.length} cards in room ${roomId}`);
    return this.populateCharacters(room);
  }

  /**
   * 룸 ID 생성 (6자리 영숫자)
   */
  private generateRoomId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = '';

    for (let i = 0; i < 6; i++) {
      roomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return roomId;
  }
}

export const roomService = new RoomService();
