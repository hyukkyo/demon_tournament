import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import { gameApi } from '../../services/api/game.api';
import { Card } from '../../types';
import styles from './CardSelectPage.module.css';

export const CardSelectPage = () => {
  const { room, updateRoom } = useRoomStore();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 카드 로드
  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        console.log('[CardSelectPage] Loading cards...');
        console.log('[CardSelectPage] Room:', room);
        console.log('[CardSelectPage] Socket ID:', socket?.id);

        // 내 캐릭터 ID 찾기
        const myPlayer = room?.players.find((p) => p.playerId === socket?.id);
        console.log('[CardSelectPage] My player:', myPlayer);
        console.log('[CardSelectPage] My player.character:', myPlayer?.character);
        console.log('[CardSelectPage] Type of character:', typeof myPlayer?.character);
        
        const myCharacterId = typeof myPlayer?.character === 'string' 
          ? myPlayer.character 
          : myPlayer?.character?.characterId;

        if (!myCharacterId) {
          console.error('[CardSelectPage] No character selected');
          setError('캐릭터를 먼저 선택해주세요.');
          setLoading(false);
          return;
        }

        console.log('[CardSelectPage] My character ID:', myCharacterId);

        // 병렬로 데이터 로드
        const [commonCards, attackCards, allCharacters] = await Promise.all([
          gameApi.getCommonCards(),
          gameApi.getAttackCards(),
          gameApi.getCharacters(),
        ]);

        console.log('[CardSelectPage] Common cards loaded:', commonCards.length, commonCards);
        console.log('[CardSelectPage] Attack cards loaded:', attackCards.length, attackCards);
        console.log('[CardSelectPage] All characters loaded:', allCharacters.length, allCharacters);

        // 내 캐릭터 정보 찾기
        const myCharacter = allCharacters.find((char) => {
          console.log('[CardSelectPage] Comparing:', char.characterId, '===', myCharacterId, '?', char.characterId === myCharacterId);
          return char.characterId === myCharacterId;
        });

        console.log('[CardSelectPage] My character found:', myCharacter);

        if (!myCharacter) {
          console.error('[CardSelectPage] Character not found!');
          setError('캐릭터 정보를 불러올 수 없습니다.');
          setLoading(false);
          return;
        }

        if (!myCharacter.attackCards || myCharacter.attackCards.length === 0) {
          console.error('[CardSelectPage] Character has no attack cards!', myCharacter);
          setError('캐릭터에 공격 카드가 없습니다.');
          setLoading(false);
          return;
        }

        console.log('[CardSelectPage] My character attack cards:', myCharacter.attackCards);

        // 내 캐릭터의 공격 카드만 필터링 (대소문자 무시)
        const myAttackCards = attackCards.filter((card) => {
          const included = myCharacter.attackCards.some(
            (attackCardId) => attackCardId.toLowerCase() === card.cardId.toLowerCase()
          );
          console.log('[CardSelectPage] Card', card.cardId, 'included?', included);
          return included;
        });

        console.log('[CardSelectPage] My attack cards filtered:', myAttackCards.length, myAttackCards);

        // 공통 카드 + 내 공격 카드
        const availableCards = [...commonCards, ...myAttackCards];
        console.log('[CardSelectPage] Available cards total:', availableCards.length, availableCards);
        setCards(availableCards);
        setError(null);
      } catch (err) {
        console.error('[CardSelectPage] Error loading cards:', err);
        setError('카드 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (room && socket) {
      loadCards();
    }
  }, [room, socket]);

  // room.status가 battle로 변경되면 완료 화면 표시 후 이동
  useEffect(() => {
    if (room?.status === 'battle' && !showSuccess) {
      console.log('[CardSelectPage] All cards selected, showing success screen');
      setShowSuccess(true);

      // 2초 후 배틀 화면으로 이동
      const timer = setTimeout(() => {
        console.log('[CardSelectPage] Navigating to battle');
        navigate('/battle');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [room?.status, navigate]);

  // Socket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 상대방 카드 선택
    socket.on('game:cards_selected', (data) => {
      console.log('[CardSelectPage] Cards selected:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    // 상태 변경 (배틀로 이동)
    socket.on('room:status_changed', (data) => {
      console.log('[CardSelectPage] Status changed:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    return () => {
      socket.off('game:cards_selected');
      socket.off('room:status_changed');
    };
  }, [socket, updateRoom]);

  // 카드 선택/해제 토글
  const handleToggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      // 선택 해제
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    } else {
      // 선택 (최대 3장)
      if (selectedCardIds.length < 3) {
        setSelectedCardIds([...selectedCardIds, cardId]);
      }
    }
  };

  // 카드 선택 완료
  const handleConfirmSelection = () => {
    if (!socket || selectedCardIds.length !== 3) return;

    console.log('[CardSelectPage] Confirming card selection:', selectedCardIds);
    socket.emit('game:select_cards', { cardIds: selectedCardIds }, (response: any) => {
      if (response.success) {
        console.log('[CardSelectPage] Cards selected successfully');
      } else {
        console.error('[CardSelectPage] Failed to select cards:', response.error);
        setError(response.error?.message || '카드 선택에 실패했습니다.');
      }
    });
  };

  if (!room) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.message}>카드 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  const myPlayer = room.players.find((p) => p.playerId === socket?.id);
  const opponentPlayer = room.players.find((p) => p.playerId !== socket?.id);

  // 선택 완료 화면
  if (showSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.successScreen}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>카드 선택 완료!</h1>
            <p className={styles.successSubtext}>곧 배틀이 시작됩니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>카드 선택</h1>
        
        {/* 플레이어 상태 */}
        <div className={styles.playerStatus}>
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{myPlayer?.username} (나)</span>
            <span className={styles.selectionStatus}>
              {myPlayer?.isReady ? '✓ 준비 완료' : `${selectedCardIds.length}/3 선택`}
            </span>
          </div>
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{opponentPlayer?.username}</span>
            <span className={styles.selectionStatus}>
              {opponentPlayer?.isReady ? '✓ 준비 완료' : '선택 중...'}
            </span>
          </div>
        </div>

        {/* 카드 그리드 */}
        <div className={styles.cardGrid}>
          {(cards || []).map((card) => {
            const isSelected = selectedCardIds.includes(card.cardId);
            return (
              <div
                key={card.cardId}
                className={`${styles.cardItem} ${isSelected ? styles.selected : ''} ${
                  !myPlayer?.isReady ? styles.clickable : ''
                }`}
                onClick={() => !myPlayer?.isReady && handleToggleCard(card.cardId)}
              >
                <div className={styles.cardHeader}>
                  <span className={`${styles.cardType} ${styles[card.type]}`}>
                    {card.type === 'movement' && '이동'}
                    {card.type === 'attack' && '공격'}
                    {card.type === 'utility' && '유틸'}
                  </span>
                  {isSelected && <span className={styles.selectedBadge}>✓</span>}
                </div>
                <h3 className={styles.cardName}>{card.name}</h3>
                <p className={styles.cardDescription}>{card.description}</p>
                <div className={styles.cardStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>에너지</span>
                    <span className={styles.statValue}>{card.energyCost}</span>
                  </div>
                  {card.damage !== undefined && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>데미지</span>
                      <span className={styles.statValue}>{card.damage}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 확인 버튼 */}
        {!myPlayer?.isReady && (
          <button
            className={styles.confirmButton}
            onClick={handleConfirmSelection}
            disabled={selectedCardIds.length !== 3}
          >
            선택 완료 ({selectedCardIds.length}/3)
          </button>
        )}
        
        {myPlayer?.isReady && (
          <p className={styles.waitingText}>상대방의 선택을 기다리는 중...</p>
        )}
      </div>
    </div>
  );
};
