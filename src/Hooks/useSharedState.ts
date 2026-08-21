import { useState, useRef } from 'react';
import { Player, BoxCell, Screen } from '../Game2/Type';
import { FirebaseDatabaseTypes } from '@react-native-firebase/database';

export const useSharedState = () => {
  // ---------- Local board (also used to mirror multiplayer board) ----------
  const [board, setBoard] = useState<BoxCell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | null>(null);

  // ---------- Navigation ----------
  const [screen, setScreen] = useState<Screen>('Start');

  // ---------- Identity ----------
  const [myName, setMyName] = useState('');
  const [roomName, setRoomName] = useState('');

  // ---------- Room code (state + ref dual-write) ----------
  const [roomCode, setRoomCode] = useState('');
  const roomCodeRef = useRef('');
  const setRoomCodeState = (code: string) => {
    roomCodeRef.current = code;
    setRoomCode(code);
  };

  // ---------- Role (state + ref dual-write) ----------
  const [myRole, setMyRoleState] = useState<'X' | 'O' | null>(null);
  const myRoleRef = useRef<'X' | 'O' | null>(null);
  const setMyRole = (role: 'X' | 'O' | null) => {
    myRoleRef.current = role;
    setMyRoleState(role);
  };

  // ---------- Opponent info ----------
  const [opponentName, setOpponentName] = useState('');
  const [opponentPhoto, setOpponentPhoto] = useState<string | null>(null);
  const [opponentAvatarId, setOpponentAvatarId] = useState<string | null>(null);

  // ---------- Room / match flags ----------
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [multiplayerError, setMultiplayerError] = useState('');
  const [roomIsPrivate, setRoomIsPrivate] = useState(false);

  // ---------- Rematch ----------
  const [myRematchRequested, setMyRematchRequested] = useState(false);
  const [opponentRematchRequested, setOpponentRematchRequested] = useState(false);

  // ---------- Core Firebase refs ----------
  const roomRef = useRef<FirebaseDatabaseTypes.Reference | null>(null);
  const gameStartedRef = useRef(false);

  // ---------- Player identity refs (for stats/results) ----------
  const hostUidRef = useRef<string | null>(null);
  const guestUidRef = useRef<string | null>(null);

  // ---------- Room listener lifecycle refs ----------
  const listenedCodeRef = useRef<string | null>(null);
  const roomHasLoadedRef = useRef(false);
  const guestWasPresentRef = useRef(false);
  const lastRoomDataRef = useRef<any>(null);
  const opponentLeftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLeavingRef = useRef(false);
  const creatingRoomRef = useRef(false);

  // ---------- Move-processing guard ----------
  const processingMoveRef = useRef(false);

  // ---------- Local game "who goes first" tracker ----------
  const lastLocalFirstRef = useRef<Player>('X');

  return {
    // state
    board, setBoard,
    currentPlayer, setCurrentPlayer,
    winner, setWinner,
    screen, setScreen,
    myName, setMyName,
    roomName, setRoomName,
    roomCode, setRoomCodeState, roomCodeRef,
    myRole, setMyRole, myRoleRef,
    opponentName, setOpponentName,
    opponentPhoto, setOpponentPhoto,
    opponentAvatarId, setOpponentAvatarId,
    isMyTurn, setIsMyTurn,
    gameStarted, setGameStarted,
    multiplayerError, setMultiplayerError,
    roomIsPrivate, setRoomIsPrivate,
    myRematchRequested, setMyRematchRequested,
    opponentRematchRequested, setOpponentRematchRequested,

    // refs
    roomRef,
    gameStartedRef,
    hostUidRef,
    guestUidRef,
    listenedCodeRef,
    roomHasLoadedRef,
    guestWasPresentRef,
    lastRoomDataRef,
    opponentLeftTimeoutRef,
    isLeavingRef,
    creatingRoomRef,
    processingMoveRef,
    lastLocalFirstRef,
  };
};

export type SharedState = ReturnType<typeof useSharedState>;