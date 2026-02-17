import apiClient from './client';
import { Character, Card } from '../../types';

export const gameApi = {
  /**
   * 모든 캐릭터 조회
   */
  async getCharacters(): Promise<Character[]> {
    const response = await apiClient.get('/characters');
    console.log('[gameApi] getCharacters response:', response);
    return response.data;
  },

  /**
   * 모든 카드 조회
   */
  async getCards(): Promise<Card[]> {
    const response = await apiClient.get('/cards');
    return response.data;
  },

  /**
   * 공통 카드 조회
   */
  async getCommonCards(): Promise<Card[]> {
    const response = await apiClient.get('/cards/common');
    return response.data;
  },

  /**
   * 공격 카드 조회
   */
  async getAttackCards(): Promise<Card[]> {
    const response = await apiClient.get('/cards/attack');
    return response.data;
  },
};
