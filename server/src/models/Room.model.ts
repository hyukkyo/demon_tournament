import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  playerId: string; // Socket ID
  username: string; // 사용자명
  character?: string; // 선택한 캐릭터 ID
  selectedCards: string[]; // 선택한 카드 ID 배열
  health: number; // 현재 체력
  energy: number; // 현재 에너지
  position: {
    x: number; // X 좌표 (0-3)
    y: number; // Y 좌표 (0-2)
  };
  defense?: number; // 방어력 (임시, 공격 받으면 소멸)
  isReady: boolean; // 준비 완료 여부
  isConnected: boolean; // 연결 상태
}

export interface IRoom extends Document {
  roomId: string; // 6자리 룸 코드
  status: 'waiting' | 'character_select' | 'card_select' | 'battle' | 'finished';
  players: IPlayer[]; // 최대 2명
  currentRound: number; // 현재 라운드
  currentCardIndex: number; // 현재 공개 중인 카드 인덱스 (0-2)
  winner?: string; // 승자 playerId
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // 자동 삭제 시간
}

const PlayerSchema = new Schema<IPlayer>(
  {
    playerId: { type: String, required: true },
    username: { type: String, required: true, maxlength: 20 },
    character: { type: String },
    selectedCards: [{ type: String }],
    health: { type: Number, default: 100, min: 0, max: 100 },
    energy: { type: Number, default: 100, min: 0 },
    position: {
      x: { type: Number, required: true, min: 0, max: 3 },
      y: { type: Number, required: true, min: 0, max: 2 },
    },
    defense: { type: Number, default: 0, min: 0 },
    isReady: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: true },
  },
  { _id: false }
);

const RoomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      length: 6,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'character_select', 'card_select', 'battle', 'finished'],
      default: 'waiting',
    },
    players: {
      type: [PlayerSchema],
      validate: {
        validator: (v: IPlayer[]) => v.length <= 2,
        message: 'Room can have maximum 2 players',
      },
      default: [],
    },
    currentRound: { type: Number, default: 1, min: 1 },
    currentCardIndex: { type: Number, default: 0, min: 0, max: 2 },
    winner: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스
RoomSchema.index({ roomId: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL 인덱스

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
