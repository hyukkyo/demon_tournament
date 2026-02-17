import { useState, FormEvent } from 'react';
import { useRoom } from '../../hooks/useRoom';
import { useRoomStore } from '../../store/roomStore';
import styles from './HomePage.module.css';

export const HomePage = () => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { createRoom, joinRoom } = useRoom();
  const { isLoading, error } = useRoomStore();

  const handleCreateRoom = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      createRoom(username.trim());
    }
  };

  const handleJoinRoom = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomCode.trim()) {
      joinRoom(roomCode.trim().toUpperCase(), username.trim());
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>🎮 Demon Tournament</h1>
        <p className={styles.subtitle}>1대1 멀티플레이 턴제 전략 배틀 게임</p>

        {error && <div className={styles.error}>{error}</div>}

        {isLoading && <div className={styles.loading}>연결 중...</div>}

        <form onSubmit={handleCreateRoom} className={styles.form}>
          <input
            type="text"
            placeholder="사용자 이름을 입력하세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            className={styles.input}
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isLoading || !username.trim()}
          >
            새 게임 만들기
          </button>
        </form>

        <div className={styles.divider}>
          <span>또는</span>
        </div>

        <form onSubmit={handleJoinRoom} className={styles.form}>
          <input
            type="text"
            placeholder="룸 코드 (6자리)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className={styles.input}
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoading || !username.trim() || !roomCode.trim()}
          >
            게임 참가하기
          </button>
        </form>
      </div>
    </div>
  );
};
