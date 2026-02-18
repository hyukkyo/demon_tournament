import mongoose, { Schema, Document } from 'mongoose';

export type CardType = 'movement' | 'attack' | 'utility';

export interface ICard extends Document {
  cardId: string; // 고유 ID (예: 'move_up', 'attack_3x3')
  name: string; // 카드 이름
  type: CardType; // 카드 유형
  description: string; // 설명
  energyCost: number; // 에너지 소모 (음수/양수/0)
  damage?: number; // 데미지 (공격 카드만)
  healing?: number; // 회복량 (회복 카드만)
  defense?: number; // 방어력 (방어 카드만)
  movement?: {
    // 이동 (이동 카드만)
    x: number; // X축 이동량
    y: number; // Y축 이동량
  };
  pattern?: number[][]; // 공격 패턴 (3x3 배열)
  isCommon: boolean; // 공통 카드 여부
  imageUrl?: string; // 카드 이미지 URL
  isActive: boolean; // 활성화 여부
}

const CardSchema = new Schema<ICard>(
  {
    cardId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['movement', 'attack', 'utility'],
      required: true,
    },
    description: { type: String, required: true },
    energyCost: { type: Number, default: 0 },
    damage: { type: Number, min: 0 },
    healing: { type: Number, min: 0 },
    defense: { type: Number, min: 0 },
    movement: {
      x: { type: Number, min: -1, max: 1 },
      y: { type: Number, min: -1, max: 1 },
    },
    pattern: [[Number]],
    isCommon: { type: Boolean, default: false },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

CardSchema.index({ cardId: 1 });
CardSchema.index({ type: 1, isActive: 1 });
CardSchema.index({ isCommon: 1, isActive: 1 });

export const Card = mongoose.model<ICard>('Card', CardSchema);
