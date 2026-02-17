import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import { useRoom } from '../../hooks/useRoom';
import styles from './LobbyPage.module.css';

export const LobbyPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, updateRoom, updateRoomStatus } = useRoomStore();
  const { socket } = useSocket();
  const { leaveRoom } = useRoom();
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  // room.status가 변경되면 매칭 성공 화면 표시 후 이동
  useEffect(() => {
    console.log('[LobbyPage] Room status check:', room?.status, 'showMatchSuccess:', showMatchSuccess);
    
    if (room?.status === 'character_select' && !showMatchSuccess) {
      console.log('[LobbyPage] Showing match success screen');
      setShowMatchSuccess(true);
      
      // 2초 후 캐릭터 선택 화면으로 이동
      const timer = setTimeout(() => {
        console.log('[LobbyPage] Navigating to character-select');
        navigate('/character-select');
      }, 2000);

      return () => {
        console.log('[LobbyPage] Cleaning up timer');
        clearTimeout(timer);
      };
    }
  }, [room?.status, navigate]); // showMatchSuccess를 dependency에서 제거

  // Socket 이벤트 리스너 등록
  useEffect(() => {
    if (!socket || !roomId) return;

    console.log(`[LobbyPage] Setting up socket listeners for room: ${roomId}`);

    // 플레이어 참가 이벤트
    socket.on('room:player_joined', (data) => {
      console.log('[LobbyPage] Player joined:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    // 플레이어 나가기 이벤트
    socket.on('room:player_left', (data) => {
      console.log('[LobbyPage] Player left:', data);
      if (data.room) {
        updateRoom(data.room);
      }
    });

    // 상태 변경 이벤트
    socket.on('room:status_changed', (data) => {
      console.log('[LobbyPage] Room status changed:', data);
      if (data.room) {
        updateRoom(data.room);
      } else {
        updateRoomStatus(data.status);
      }
    });

    return () => {
      console.log(`[LobbyPage] Cleaning up socket listeners for room: ${roomId}`);
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:status_changed');
    };
  }, [socket, roomId, updateRoom, updateRoomStatus]);

  // room이 없고 loading도 끝났다면 홈으로 (단, roomId가 있으면 대기)
  if (!room && roomId) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>룸 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  const getStatusText = () => {
    if (room.players.length === 1) {
      return '상대방을 기다리는 중...';
    }
    return '모든 플레이어가 입장했습니다!';
  };

  // 매칭 성공 화면
  if (showMatchSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.matchSuccess}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>매칭 성공!</h1>
            <p className={styles.successSubtext}>곧 캐릭터 선택 화면으로 이동합니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>대기실</h1>
          <div className={styles.roomCode}>{room.roomId}</div>
        </div>

        <div className={styles.status}>
          <div className={styles.statusText}>{getStatusText()}</div>
          {room.players.length === 1 && (
            <div className={styles.statusSubtext}>
              친구에게 룸 코드를 공유하세요: <strong>{room.roomId}</strong>
            </div>
          )}
        </div>

        <div className={styles.players}>
          {room.players.map((player) => (
            <div
              key={player.playerId}
              className={`${styles.playerCard} ${
                player.isConnected ? styles.playerCardConnected : ''
              }`}
            >
              <div className={styles.playerName}>{player.username}</div>
              <div className={styles.playerStatus}>
                <div
                  className={`${styles.statusIndicator} ${
                    player.isConnected ? styles.statusIndicatorConnected : ''
                  }`}
                />
                {player.isConnected ? '접속 중' : '연결 끊김'}
              </div>
            </div>
          ))}

          {room.players.length < 2 && (
            <div className={`${styles.playerCard} ${styles.emptySlot}`}>
              플레이어 대기 중...
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={leaveRoom} className={`${styles.button} ${styles.buttonDanger}`}>
            나가기
          </button>
        </div>
      </div>
    </div>
  );
};
