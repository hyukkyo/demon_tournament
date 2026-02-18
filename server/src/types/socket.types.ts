export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 클라이언트 → 서버 이벤트 페이로드
export interface CreateRoomPayload {
  username: string;
}

export interface JoinRoomPayload {
  roomId: string;
  username: string;
}

export interface SelectCharacterPayload {
  character: string;
}

export interface SelectCardsPayload {
  cards: string[];
}

export interface ReadyPayload {
  isReady: boolean;
}
