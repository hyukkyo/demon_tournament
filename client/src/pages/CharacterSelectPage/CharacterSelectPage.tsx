import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import { gameApi } from '../../services/api/game.api';
import { Character } from '../../types';
import styles from './CharacterSelectPage.module.css';

export const CharacterSelectPage = () => {
  const { room, updateRoom } = useRoomStore();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 캐릭터 목록 로드
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        console.log('[CharacterSelectPage] Loading characters...');
        const data = await gameApi.getCharacters();
        console.log('[CharacterSelectPage] Characters loaded:', data);
        setCharacters(data);
        setLoading(false);
      } catch (err) {
        console.error('[CharacterSelectPage] Error loading characters:', err);
        setError('캐릭터 목록을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

  // room.status가 card_select로 변경되면 완료 화면 표시 후 이동
  useEffect(() => {
    if (room?.status === 'card_select' && !showSuccess) {
      console.log('[CharacterSelectPage] All characters selected, showing success screen');
      setShowSuccess(true);
      
      // 2초 후 카드 선택 화면으로 이동
      const timer = setTimeout(() => {
        console.log('[CharacterSelectPage] Navigating to card-select');
        navigate('/card-select');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [room?.status, navigate]);

  // Socket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 캐릭터 선택 이벤트
    socket.on('game:character_selected', (data) => {
      console.log('[CharacterSelectPage] Character selected:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    // 상태 변경 (카드 선택으로 이동)
    socket.on('room:status_changed', (data) => {
      console.log('[CharacterSelectPage] Status changed:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    return () => {
      socket.off('game:character_selected');
      socket.off('room:status_changed');
    };
  }, [socket, navigate, updateRoom]);

  // 캐릭터 선택 핸들러
  const handleSelectCharacter = (characterId: string) => {
    if (!socket || !room) return;
    
    setSelectedCharacter(characterId);
    
    socket.emit('game:select_character', { characterId }, (response: any) => {
      if (!response.success) {
        setError(response.error?.message || '캐릭터 선택에 실패했습니다.');
        setSelectedCharacter(null);
      }
    });
  };

  if (!room) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.error}>룸 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>캐릭터 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  const myPlayer = room.players.find((p) => p.playerId === socket?.id);
  const opponentPlayer = room.players.find((p) => p.playerId !== socket?.id);
  const bothSelected = room.players.every((p) => p.character);

  // 선택 완료 화면
  if (showSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.successScreen}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>캐릭터 선택 완료!</h1>
            <p className={styles.successSubtext}>곧 카드 선택 화면으로 이동합니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>캐릭터 선택</h1>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.status}>
          <div className={styles.playerStatus}>
            <span>내 선택:</span>
            <strong>
              {myPlayer?.character
                ? typeof myPlayer.character === 'string'
                  ? characters.find((c) => c.characterId === myPlayer.character)?.name || '선택됨'
                  : myPlayer.character.name
                : '대기 중...'}
            </strong>
          </div>
          <div className={styles.playerStatus}>
            <span>상대 선택:</span>
            <strong>
              {opponentPlayer?.character
                ? typeof opponentPlayer.character === 'string'
                  ? characters.find((c) => c.characterId === opponentPlayer.character)?.name || '선택됨'
                  : opponentPlayer.character.name
                : '대기 중...'}
            </strong>
          </div>
        </div>

        {bothSelected && (
          <div className={styles.readyMessage}>
            양쪽 모두 선택 완료! 곧 카드 선택 화면으로 이동합니다...
          </div>
        )}

        <div className={styles.characters}>
          {(characters || []).map((character) => (
            <div
              key={character._id}
              className={`${styles.characterCard} ${
                selectedCharacter === character.characterId ? styles.selected : ''
              } ${
                (typeof myPlayer?.character === 'string' ? myPlayer.character === character.characterId : myPlayer?.character?.characterId === character.characterId)
                  ? styles.mySelection
                  : ''
              }`}
              onClick={() => !myPlayer?.character && handleSelectCharacter(character.characterId)}
            >
              <div className={styles.characterName}>{character.name}</div>
              <div className={styles.characterStats}>
                <div>HP: {character.baseHealth}</div>
                <div>Energy: {character.baseEnergy}</div>
              </div>
              <div className={styles.characterDescription}>{character.description}</div>
              {(typeof myPlayer?.character === 'string' ? myPlayer.character === character.characterId : myPlayer?.character?.characterId === character.characterId) && (
                <div className={styles.selectedBadge}>선택됨</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
