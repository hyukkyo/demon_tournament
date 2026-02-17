import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import styles from './BattlePage.module.css';

type BattlePhase = 'revealing' | 'simulating' | 'waiting';

export const BattlePage = () => {
  const { room, updateRoom } = useRoomStore();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<BattlePhase>('revealing');
  const [message, setMessage] = useState('');
  const executedRef = useRef(false);

  // Socket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 카드 실행 완료
    socket.on('game:cards_executed', (data) => {
      console.log('[BattlePage] Cards executed:', data);
      if (data.room) {
        updateRoom(data.room);
        setPhase('waiting');
      }
    });

    // 게임 종료
    socket.on('game:finished', (data) => {
      console.log('[BattlePage] Game finished:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    // 라운드 종료 (다음 라운드로)
    socket.on('game:round_finished', (data) => {
      console.log('[BattlePage] Round finished:', data);
      if (data.room) {
        updateRoom(data.room);
        setMessage('라운드 종료! 다음 라운드 카드를 선택하세요.');
        setTimeout(() => {
          navigate('/card-select');
        }, 2000);
      }
    });

    return () => {
      socket.off('game:cards_executed');
      socket.off('game:finished');
      socket.off('game:round_finished');
    };
  }, [socket, updateRoom, navigate]);

  // 자동 카드 실행
  useEffect(() => {
    if (!socket || !room || room.status !== 'battle') return;
    
    const cardIndex = room.currentCardIndex;
    
    // 아직 실행하지 않은 카드가 있고, 대기 중일 때 자동 실행
    if (phase === 'waiting' && cardIndex < 3 && !executedRef.current) {
      executedRef.current = true;
      
      // 카드 공개 단계
      setPhase('revealing');
      setMessage(`${cardIndex + 1}번 카드 공개!`);

      setTimeout(() => {
        // 시뮬레이션 단계
        setPhase('simulating');
        setMessage('카드 실행 중...');

        // 카드 실행
        socket.emit('game:execute_both_cards', (response: any) => {
          console.log('[BattlePage] Execute response:', response);
          executedRef.current = false;
          
          if (response.success) {
            if (response.data.status === 'finished') {
              // 게임 종료
              updateRoom(response.data);
            } else if (response.data.status === 'card_select') {
              // 라운드 종료
              setMessage('라운드 종료!');
            } else {
              // 다음 카드 대기
              setTimeout(() => {
                setPhase('waiting');
              }, 1000);
            }
          } else {
            setMessage('오류: ' + (response.error?.message || '카드 실행 실패'));
            setPhase('waiting');
          }
        });
      }, 2000); // 2초 카드 공개
    }
  }, [socket, room, phase]);

  // 배틀 시작 시 첫 카드 자동 실행
  useEffect(() => {
    if (!room || room.status !== 'battle') return;
    
    if (room.currentCardIndex === 0 && !executedRef.current) {
      console.log('[BattlePage] Starting battle, executing first card');
      setPhase('waiting');
    }
  }, [room]);

  if (!room) {
    return null;
  }

  const myPlayer = room.players.find((p) => p.playerId === socket?.id);
  const opponentPlayer = room.players.find((p) => p.playerId !== socket?.id);

  if (!myPlayer || !opponentPlayer) {
    return <div>플레이어를 찾을 수 없습니다.</div>;
  }

  // 게임 종료 화면
  if (room.status === 'finished') {
    const isWinner = room.winner === myPlayer.playerId;
    const isDraw = room.winner === 'draw';

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.finishScreen}>
            <div className={styles.finishIcon}>
              {isDraw ? '🤝' : isWinner ? '🏆' : '💔'}
            </div>
            <h1 className={styles.finishTitle}>
              {isDraw ? '무승부!' : isWinner ? '승리!' : '패배...'}
            </h1>
            <div className={styles.finalStats}>
              <div className={styles.statRow}>
                <span>내 체력:</span>
                <span className={myPlayer.health > 50 ? styles.healthy : styles.damaged}>
                  {myPlayer.health}
                </span>
              </div>
              <div className={styles.statRow}>
                <span>상대 체력:</span>
                <span className={opponentPlayer.health > 50 ? styles.healthy : styles.damaged}>
                  {opponentPlayer.health}
                </span>
              </div>
            </div>
            <button className={styles.homeButton} onClick={() => navigate('/')}>
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 현재 카드 정보
  const currentCardIndex = room.currentCardIndex;
  const myCardId = myPlayer.selectedCards[currentCardIndex];
  const opponentCardId = opponentPlayer.selectedCards[currentCardIndex];

  // 4x3 보드 생성
  const renderBoard = () => {
    const board = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        const isMyPosition = myPlayer.position.x === x && myPlayer.position.y === y;
        const isOpponentPosition = opponentPlayer.position.x === x && opponentPlayer.position.y === y;

        board.push(
          <div
            key={`${x}-${y}`}
            className={`${styles.cell} ${isMyPosition ? styles.myCell : ''} ${
              isOpponentPosition ? styles.opponentCell : ''
            }`}
          >
            {isMyPosition && (
              <div className={styles.player}>
                <div className={styles.playerIcon}>😈</div>
                <div className={styles.playerName}>{myPlayer.username}</div>
              </div>
            )}
            {isOpponentPosition && (
              <div className={styles.player}>
                <div className={styles.playerIcon}>👹</div>
                <div className={styles.playerName}>{opponentPlayer.username}</div>
              </div>
            )}
          </div>
        );
      }
    }
    return board;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>배틀 - 라운드 {room.currentRound}</h1>

        {/* 상태 메시지 */}
        {message && (
          <div className={`${styles.message} ${phase === 'revealing' ? styles.revealing : ''}`}>
            {message}
          </div>
        )}

        {/* 플레이어 정보 */}
        <div className={styles.playerInfo}>
          <div className={styles.infoPanel}>
            <h3>{myPlayer.username} (나)</h3>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>❤️ 체력:</span>
                <span className={myPlayer.health > 50 ? styles.healthy : styles.damaged}>
                  {myPlayer.health}
                </span>
              </div>
              <div className={styles.stat}>
                <span>⚡ 에너지:</span>
                <span>{myPlayer.energy}</span>
              </div>
              {myPlayer.defense && myPlayer.defense > 0 && (
                <div className={styles.stat}>
                  <span>🛡️ 방어:</span>
                  <span>{myPlayer.defense}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.infoPanel}>
            <h3>{opponentPlayer.username}</h3>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>❤️ 체력:</span>
                <span className={opponentPlayer.health > 50 ? styles.healthy : styles.damaged}>
                  {opponentPlayer.health}
                </span>
              </div>
              <div className={styles.stat}>
                <span>⚡ 에너지:</span>
                <span>{opponentPlayer.energy}</span>
              </div>
              {opponentPlayer.defense && opponentPlayer.defense > 0 && (
                <div className={styles.stat}>
                  <span>🛡️ 방어:</span>
                  <span>{opponentPlayer.defense}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4x3 보드 */}
        <div className={styles.board}>{renderBoard()}</div>

        {/* 카드 공개 */}
        {phase === 'revealing' && (
          <div className={styles.cardReveal}>
            <div className={styles.revealCard}>
              <div className={styles.cardLabel}>내 카드</div>
              <div className={styles.cardName}>{myCardId}</div>
            </div>
            <div className={styles.vsText}>VS</div>
            <div className={styles.revealCard}>
              <div className={styles.cardLabel}>상대 카드</div>
              <div className={styles.cardName}>{opponentCardId}</div>
            </div>
          </div>
        )}

        {/* 진행 상태 */}
        <div className={styles.progress}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`${styles.progressDot} ${
                index < currentCardIndex ? styles.completed : index === currentCardIndex ? styles.current : ''
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
