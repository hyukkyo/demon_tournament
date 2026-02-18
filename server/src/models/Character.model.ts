import mongoose, { Schema, Document } from 'mongoose';

export interface ICharacter extends Document {
  characterId: string; // 고유 ID (예: 'warrior', 'mage')
  name: string; // 캐릭터 이름
  description: string; // 설명
  baseHealth: number; // 기본 체력
  baseEnergy: number; // 기본 에너지
  attackCards: string[]; // 해당 캐릭터의 공격 카드 ID 배열
  imageUrl?: string; // 캐릭터 이미지 URL
  isActive: boolean; // 활성화 여부
}

const CharacterSchema = new Schema<ICharacter>(
  {
    characterId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    baseHealth: { type: Number, default: 100, min: 1 },
    baseEnergy: { type: Number, default: 100, min: 1 },
    attackCards: [{ type: String, ref: 'Card' }],
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

CharacterSchema.index({ characterId: 1 });
CharacterSchema.index({ isActive: 1 });

export const Character = mongoose.model<ICharacter>('Character', CharacterSchema);
