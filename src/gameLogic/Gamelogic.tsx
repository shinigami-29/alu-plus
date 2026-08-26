import React, { useState, useRef, useEffect } from 'react';
import { Player, BoxCell, Screen } from './Type';
import database, {
  FirebaseDatabaseTypes,
} from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {
  recordGameResult as recordBracketMatchResult,
  generateNextRound,
} from '../components/Utils/bracketGenerator';
import firestore from '@react-native-firebase/firestore';

const GameLogic = (myAvatarId?: string | null, myPhoto?: string | null) => {
  const [board, setBoard] = useState<BoxCell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | null>(null);
  const [screen, setScreen] = useState<Screen>('Start');

  const [myName, setMyName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [eventMatchOver, setEventMatchOver] = useState(false);
  const [isEventMatch, setIsEventMatch] = useState(false);
const [eventInfo, setEventInfo] = useState<{ eventId: string; roundKey: string; totalRounds: number } | null>(null);

  const roomCodeRef = useRef('');
  const setRoomCodeState = (code: string) => {
    roomCodeRef.current = code;
    setRoomCode(code);
  };
  const [joinCode, setJoinCode] = useState('');
  const [leaderboard, setLeaderboard] = useState<
    {
      name: string;
      wins: number;
      uid: string | null;
      photo: string | null;
      avatarId: string | null;
    }[]
  >([]);
  const [recentOpponents, setRecentOpponents] = useState<
    { name: string; photo: string | null; avatarId: string | null }[]
  >([]);
  const [gameFriends, setGameFriends] = useState<
    {
      name: string;
      uid: string | null;
      photo: string | null;
      avatarId: string | null;
    }[]
  >([]);

  // Match history reset thresholds
  const MATCH_HISTORY_THRESHOLD = 20;
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  const listenedCodeRef = useRef<string | null>(null);
  const opponentLeftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const roomHasLoadedRef = useRef(false);

  const recordedResultKeyRef = useRef<string | null>(null);
  const activeSessionKeyRef = useRef<string | null>(null);
  const sessionStatsRef = useRef<{
    wins: number;
    losses: number;
    draws: number;
  }>({ wins: 0, losses: 0, draws: 0 });
  const isLeavingRef = useRef(false);

  // Room list (lobby) — includes both "waiting" and "playing" rooms
  const [allRooms, setAllRooms] = useState<
    {
      roomCode: string;
      roomName: string;
      host: string;
      hostPhoto: string | null;
      hostAvatarId: string | null;
      guest: string | null;
      guestPhoto: string | null;
      guestAvatarId: string | null;
      status: 'waiting' | 'playing';
      isPrivate: boolean;
    }[]
  >([]);

  const [incomingInvitations, setIncomingInvitations] = useState<
    {
      from: string;
      status: string;
      fromAvatarId: string | null;
      fromPhoto: string | null;
          timestamp: number; 
    }[]
  >([]);

  const [incomingFriendRequests, setIncomingFriendRequests] = useState<
    {
      from: string;
      status: string;
      fromAvatarId: string | null;
      fromPhoto: string | null;
    }[]
  >([]);

  // myRoleRef mirrors myRole so Firebase listeners always read the latest
  // value, even inside a stale closure. setMyRole() keeps both in sync.
  const [myRole, setMyRoleState] = useState<'X' | 'O' | null>(null);
  const myRoleRef = useRef<'X' | 'O' | null>(null);
  const setMyRole = (role: 'X' | 'O' | null) => {
    myRoleRef.current = role;
    setMyRoleState(role);
  };

  const processingMoveRef = useRef(false);

  const [opponentName, setOpponentName] = useState('');
  const [opponentPhoto, setOpponentPhoto] = useState<string | null>(null);
  const [opponentAvatarId, setOpponentAvatarId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [multiplayerError, setMultiplayerError] = useState('');
  const [roomIsPrivate, setRoomIsPrivate] = useState(false);

  // Rematch tracking — board only resets once both players have agreed
  const [myRematchRequested, setMyRematchRequested] = useState(false);
  const [opponentRematchRequested, setOpponentRematchRequested] =
    useState(false);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const presenceRefsRef = useRef<
    Record<string, FirebaseDatabaseTypes.Reference>
  >({});

  const invitationsListenerRef = useRef<FirebaseDatabaseTypes.Reference | null>(
    null,
  );
  const friendReqListenerRef = useRef<FirebaseDatabaseTypes.Reference | null>(
    null,
  );
  const sentInvListenerRef = useRef<FirebaseDatabaseTypes.Reference | null>(
    null,
  );
  const eventMatchInfoRef = useRef<{
  eventId: string;
  roundKey: string;
  matchId: string;
} | null>(null);
const eventBracketResultKeyRef = useRef<string | null>(null);
  const gameStartedRef = useRef(false);
  // Raw invitation snapshot cache — used by the periodic expiry sweep below,
  // since the on('value') listener only fires on a DB write, not on the
  // passage of time.
  const rawInvitationsRef = useRef<any>(null);
  const INVITE_TTL_MS = 60 * 1000; // invitations auto-expire after 1 minute

  // Match history (session-based)
  const [matchHistory, setMatchHistory] = useState<
    {
      opponent: string;
      wins: number;
      losses: number;
      draws: number;
      totalGames: number;
      roomCode: string;
      timestamp: number;
    }[]
  >([]);

  // Random match state
  const [randomMatchStatus, setRandomMatchStatus] = useState<
    'idle' | 'searching' | 'found'
  >('idle');
  const randomMatchRef = useRef<FirebaseDatabaseTypes.Reference | null>(null);

  const roomRef = useRef<FirebaseDatabaseTypes.Reference | null>(null);
  const roomsListenerRef = useRef<FirebaseDatabaseTypes.Reference | null>(null);
  const creatingRoomRef = useRef(false);
  const ROOM_WAITING_TTL_MS = 5 * 60 * 1000;

  const hostUidRef = useRef<string | null>(null);
  const guestUidRef = useRef<string | null>(null);

  // Tracks the Firebase ref for the current session's match-history record,
  // so subsequent moves update it instead of creating duplicates.
  const currentSessionRecordRef =
    useRef<FirebaseDatabaseTypes.Reference | null>(null);

  const lastLocalFirstRef = useRef<Player>('X');

  // Username search state
  const [searchResults, setSearchResults] = useState<
    {
      uid: string;
      username: string;
      photo: string | null;
      avatarId: string | null;
    }[]
  >([]);

  // Converts Firebase's array-or-object board shape into a fixed 9-cell array
  const normalizeBoard = (data: any): BoxCell[] => {
    const fixed: BoxCell[] = Array(9).fill(null);

    if (Array.isArray(data)) {
      data.forEach((v, i) => {
        fixed[i] = v ?? null;
      });
      return fixed;
    }

    if (data && typeof data === 'object') {
      Object.keys(data).forEach(k => {
        fixed[Number(k)] = data[k];
      });
    }

    return fixed;
  };

  const checkwin = (board: BoxCell[]): Player | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b1, c] of lines) {
      if (board[a] && board[a] === board[b1] && board[a] === board[c]) {
        return board[a] as Player;
      }
    }
    return null;
  };

  // Local (offline / same-device) move handler
  const handlePress = (index: number): void => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const win = checkwin(newBoard);

    setBoard(newBoard);
    setWinner(win);

    setCurrentPlayer(currentPlayer => (currentPlayer === 'X' ? 'O' : 'X'));
  };

  // Resets the local board, alternating who goes first each round
  const resetGame = () => {
    const nextFirst: Player = lastLocalFirstRef.current === 'X' ? 'O' : 'X';
    lastLocalFirstRef.current = nextFirst;
    setBoard(Array(9).fill(null));
    setCurrentPlayer(nextFirst);
    setWinner(null);
  };

  const requestRematch = () => {
    if (!roomRef.current || !myRoleRef.current) return;
    const field = myRoleRef.current === 'X' ? 'rematchX' : 'rematchO';
    roomRef.current
      .update({ [field]: true })
      .then(() => console.log('Rematch request sent:', field))
      .catch(err => console.log('Rematch request FAILED:', err.message));
  };

  // Creates a new room with a random 6-digit code, retrying on collision
  const generateRoomCode = (isPrivate: boolean = false): void => {
    if (!myName || myName === 'undefined' || myName.trim() === '') return;

    if (roomRef.current || creatingRoomRef.current) return;
    creatingRoomRef.current = true;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ref = database().ref(`/rooms/${code}`);

    ref
      .once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          creatingRoomRef.current = false;
          generateRoomCode(isPrivate);
          return;
        }

        roomRef.current = ref;
        ref
          .set({
            roomName: roomName || `${myName}'s Room`,
            host: myName,
            hostUid: auth().currentUser?.uid ?? null,
            hostPhoto: myPhoto ?? null,
            hostAvatarId: myAvatarId ?? null,
            guest: null,
            guestUid: null,
            guestPhoto: null,
            guestAvatarId: null,
            board: Array(9).fill(null),
            currentTurn: 'X',
            lastFirst: 'X',
            winner: null,
            isDraw: false,
            status: 'waiting',
               isPrivate, 
            createdAt: database.ServerValue.TIMESTAMP,
          })
          .then(() => {
            ref.onDisconnect().remove();

            setRoomCodeState(code);
            setMyRole('X');
            setIsMyTurn(true);
            setOpponentAvatarId(null);
            setRoomIsPrivate(isPrivate);  
            setInGameStatus(true);
            startNewSession(code);

            listenToRoom(code);

            setScreen('waiting');
          })
          .catch(err => {
            creatingRoomRef.current = false;
            roomRef.current = null;
            console.log(err);
          });
      })
      .catch(err => {
        creatingRoomRef.current = false;
        console.log(err);
      });
  };

  // Updates the currently-open room's privacy in Firebase and keeps local
  // state in sync. Falls back to local-only if no room is open yet.
  const updateRoomPrivacy = (isPrivate: boolean) => {
    setRoomIsPrivate(isPrivate);
    if (!roomRef.current) return;
    roomRef.current
      .update({ isPrivate })
      .catch(err => console.log('updateRoomPrivacy FAILED:', err.message));
  };

  // Joins a room using the code currently held in joinCode state
  const joinRoom = (): void => {
    if (!myName || joinCode.length !== 6) return;
    setMultiplayerError('');

    const ref = database().ref(`/rooms/${joinCode}`);

    ref.once('value').then(snapshot => {
      const data = snapshot.val();

      if (!data) {
        setMultiplayerError('Room not found');
        return;
      }

      if (data.status !== 'waiting' && data.status !== 'playing') {
        setMultiplayerError('Room not found');
        return;
      }

      if (data.status === 'playing' && data.guest !== myName) {
        setMultiplayerError('Room is full');
        return;
      }

      const isHost = data.host === myName;

      ref
        .update({
          guest: isHost ? data.guest : myName,
          guestUid: isHost ? data.guestUid : auth().currentUser?.uid ?? null,
          guestPhoto: isHost ? data.guestPhoto : myPhoto ?? null,
          status: 'playing',
          guestAvatarId: isHost
            ? data.guestAvatarId ?? null
            : myAvatarId ?? null,
        })
        .then(() => {
          roomRef.current = ref;

          if (isHost) {
            ref.onDisconnect().remove();
          } else {
            ref.onDisconnect().update({
              guest: null,
              guestUid: null,
              guestPhoto: null,
              guestAvatarId: null,
              status: 'waiting',
              board: Array(9).fill(null),
              currentTurn: 'X',
              lastFirst: 'X',
              winner: null,
              isDraw: false,
              rematchX: false,
              rematchO: false,
            });
          }

          setRoomCodeState(joinCode);
          setMyRole(isHost ? 'X' : 'O');
          setIsMyTurn(
            isHost ? data.currentTurn === 'X' : data.currentTurn === 'O',
          );
          setOpponentName(isHost ? data.guest : data.host);
          setOpponentPhoto(
            isHost ? data.guestPhoto ?? null : data.hostPhoto ?? null,
          );
          setOpponentAvatarId(
            isHost ? data.guestAvatarId ?? null : data.hostAvatarId ?? null,
          );
          setGameStarted(true);
          setInGameStatus(true);
          startNewSession(joinCode);
          listenToRoom(joinCode);
          setScreen('multiplayerGame');
        });
    });
  };

  // Same as joinRoom, but takes an explicit code (e.g. from a deep link)
  const joinRoomWithCode = (code: string): void => {
    if (!myName || !code) return;
    setMultiplayerError('');

    const ref = database().ref(`/rooms/${code}`);

    ref
      .once('value')
      .then(snapshot => {
        const data = snapshot.val();

        if (!data) {
          setMultiplayerError('Room not found');
          return;
        }

        if (data.status !== 'waiting' && data.status !== 'playing') {
          setMultiplayerError('Room not found');
          return;
        }

        if (data.status === 'playing' && data.guest !== myName) {
          setMultiplayerError('Room is full');
          return;
        }

        const isHost = data.host === myName;

        ref
          .update({
            guest: isHost ? data.guest : myName,
            guestUid: isHost ? data.guestUid : auth().currentUser?.uid ?? null,
            guestPhoto: isHost ? data.guestPhoto : myPhoto ?? null,
            status: 'playing',
            guestAvatarId: isHost
              ? data.guestAvatarId ?? null
              : myAvatarId ?? null,
          })
          .then(() => {
            roomRef.current = ref;

            if (isHost) {
              ref.onDisconnect().remove();
            } else {
              ref.onDisconnect().update({
                guest: null,
                guestUid: null,
                guestPhoto: null,
                guestAvatarId: null,
                status: 'waiting',
                board: Array(9).fill(null),
                currentTurn: 'X',
                lastFirst: 'X',
                winner: null,
                isDraw: false,
                rematchX: false,
                rematchO: false,
              });
            }

            setRoomCodeState(code);
            setMyRole(isHost ? 'X' : 'O');
            setIsMyTurn(
              isHost ? data.currentTurn === 'X' : data.currentTurn === 'O',
            );
            setOpponentName(isHost ? data.guest : data.host);
            setOpponentPhoto(
              isHost ? data.guestPhoto ?? null : data.hostPhoto ?? null,
            );
            setOpponentAvatarId(
              isHost ? data.guestAvatarId ?? null : data.hostAvatarId ?? null,
            );
            setGameStarted(true);
            setInGameStatus(true);
            startNewSession(code);
            listenToRoom(code);
            setScreen('multiplayerGame');
          });
      })
      .catch(err => console.log(err));
  };


  // event satrt

const startEventMatch = (
  eventId: string,
  roundKey: string,
  matchId: string,
  player1Uid: string,
  player2Uid: string,
  totalRounds: number, 
) => {
  const myUid = auth().currentUser?.uid;
  if (!myUid || !myName) return;

  const amPlayer1 = myUid === player1Uid;
  const amPlayer2 = myUid === player2Uid;
  if (!amPlayer1 && !amPlayer2) return; // spectator/stale nav — bail

  const opponentUid = amPlayer1 ? player2Uid : player1Uid;
  const role: 'X' | 'O' = amPlayer1 ? 'X' : 'O';
  const code = `event_${eventId}_${roundKey}_${matchId}`;
  const ref = database().ref(`/rooms/${code}`);

  eventMatchInfoRef.current = { eventId, roundKey, matchId };
  setIsEventMatch(true);
  setEventInfo({ eventId, roundKey,totalRounds });
setEventMatchOver(false);

  firestore()
    .collection('users')
    .doc(opponentUid)
    .get()
    .then(doc => {
      const o = doc.data();
      const oName = (o?.username && o.username.trim()) || (o?.name && o.name.trim()) || 'Opponent';
      const oPhoto = o?.photoURL ?? null;
      const oAvatarId = o?.avatarId ?? null;

  roomRef.current = ref;
      ref.onDisconnect().update({
        [amPlayer1 ? 'hostDisconnected' : 'guestDisconnected']: true,
      });
      ref.once('value').then(snap => {
        if (!snap.exists()) {
          ref
            .set({
              roomName: 'Bracket Match',
              host: amPlayer1 ? myName : oName,
              hostUid: player1Uid,
              hostPhoto: amPlayer1 ? myPhoto ?? null : oPhoto,
              hostAvatarId: amPlayer1 ? myAvatarId ?? null : oAvatarId,
              guest: amPlayer1 ? oName : myName,
              guestUid: player2Uid,
              guestPhoto: amPlayer1 ? oPhoto : myPhoto ?? null,
              guestAvatarId: amPlayer1 ? oAvatarId : myAvatarId ?? null,
              board: Array(9).fill(null),
              currentTurn: 'X',
              lastFirst: 'X',
              winner: null,
              isDraw: false,
              status: 'playing',
              isEventMatch: true,
              hostGameWins: 0,
    guestGameWins: 0,
              eventId,
              roundKey,
              matchId,
            })
            .catch(err => console.log('startEventMatch create FAILED:', err.message));
        }

        setMyRole(role);
        setOpponentName(oName);
        setOpponentPhoto(oPhoto);
        setOpponentAvatarId(oAvatarId);
        setRoomCodeState(code);
        setGameStarted(true);
        setInGameStatus(true, code);
        startNewSession(code);
        listenToRoom(code);
        setScreen('multiplayerGame');
      });
    })
    .catch(err => console.log('startEventMatch lookup FAILED:', err.message));
};


const recordEventMatchResult = (
  gameWinnerRole: Player,
  hostUid: string | null,
  guestUid: string | null,
  lastFirst: Player,
) => {
  const info = eventMatchInfoRef.current;
  if (!info) return;
  const gameWinnerUid = gameWinnerRole === 'X' ? hostUid : guestUid;
  if (!gameWinnerUid) return;

  const matchRef = database().ref(
    `/events/${info.eventId}/bracket/rounds/${info.roundKey}/${info.matchId}`,
  );

  matchRef
    .transaction(current => {
      if (!current || current.status === 'completed') return current;
      return recordBracketMatchResult(current, gameWinnerUid);
    })
    .then(result => {
      if (!result.committed) return;
      const updatedMatch = result.snapshot.val();
      const isMatchOver = updatedMatch?.status === 'completed';
      console.log('[EVENT] recordEventMatchResult', { isMatchOver, updatedMatch });

      if (isMatchOver) {
        maybeAdvanceRound(info.eventId, info.roundKey);
        if (myRoleRef.current === 'X') {
          roomRef.current
            ?.update({ status: 'event_match_over' })
            .catch(err => console.log('event_match_over update FAILED:', err.message));
        }
      } else if (myRoleRef.current === 'X') {
        const nextFirst: Player = lastFirst === 'X' ? 'O' : 'X';
        roomRef.current
          ?.update({
            board: Array(9).fill(null),
            currentTurn: nextFirst,
            winner: null,
            isDraw: false,
            lastFirst: nextFirst,
            rematchX: false,
            rematchO: false,
          })
          .catch(err => console.log('event auto-continue FAILED:', err.message));
      }
    })
    .catch(err => console.log('recordEventMatchResult FAILED:', err.message));
};


const forfeitEventMatch = (
  hostUid: string | null,
  guestUid: string | null,
) => {
  const info = eventMatchInfoRef.current;
  if (!info) return;
  const myUid = myRoleRef.current === 'X' ? hostUid : guestUid;
  if (!myUid) return;

  const matchRef = database().ref(
    `/events/${info.eventId}/bracket/rounds/${info.roundKey}/${info.matchId}`,
  );

  matchRef
    .transaction(current => {
      if (!current || current.status === 'completed') return current;
      return { ...current, winner: myUid, status: 'completed' };
    })
    .then(result => {
      if (result.committed && result.snapshot.val()?.status === 'completed') {
        maybeAdvanceRound(info.eventId, info.roundKey);
        roomRef.current
          ?.update({ status: 'event_match_over' })
          .catch(err => console.log('forfeit status update FAILED:', err.message));
      }
    })
    .catch(err => console.log('forfeitEventMatch FAILED:', err.message));
};

const maybeAdvanceRound = (eventId: string, roundKey: string) => {
  database()
    .ref(`/events/${eventId}`)
    .once('value')
    .then(snap => {
      const data = snap.val();
      const roundMatches = data?.bracket?.rounds?.[roundKey];
      if (!roundMatches) return;
      if (!Object.values(roundMatches).every((m: any) => m.status === 'completed')) return;

      const roundNum = parseInt(roundKey.replace('round', ''), 10);
      const totalRounds = data.bracket.totalRounds ?? 1;
      if (roundNum >= totalRounds) return; // final already decided

      const nextRoundKey = `round${roundNum + 1}`;
      if (data.bracket.rounds?.[nextRoundKey]) return; // already generated

      const nextMatches = generateNextRound(roundMatches);

      database()
        .ref(`/events/${eventId}/bracket/rounds/${nextRoundKey}`)
        .transaction(current => current ?? nextMatches)
        .then(() =>
          database()
            .ref(`/events/${eventId}/bracket/currentRound`)
            .transaction(current => Math.max(current ?? 1, roundNum + 1)),
        )
        .catch(err => console.log('maybeAdvanceRound FAILED:', err.message));
    });
};
  
  // Listens to /rooms and builds the public lobby list, sweeping out
  // ghost/duplicate/stale "waiting" rooms as it goes
  const fetchAllRooms = () => {
    if (roomsListenerRef.current) {
      roomsListenerRef.current.off();
    }
    const ref = database().ref('/rooms');
    roomsListenerRef.current = ref;

    ref.on('value', snapshot => {
      const data = snapshot.val();
      if (!data) {
        setAllRooms([]);
        return;
      }

      const now = Date.now();
      const cleanupUpdates: Record<string, null> = {};
      const seenWaitingHosts = new Map<string, string>();
      const codes = Object.keys(data);

      codes.forEach(code => {
        const room = data[code];

        if (!room?.host) {
          cleanupUpdates[`/rooms/${code}`] = null;
          return;
        }

        if (room.status === 'waiting' && !room.guest) {
          const created = room.createdAt ?? 0;
          const isStale = now - created > ROOM_WAITING_TTL_MS;
          if (isStale) {
            cleanupUpdates[`/rooms/${code}`] = null;
            return;
          }
          if (seenWaitingHosts.has(room.host)) {
            cleanupUpdates[`/rooms/${code}`] = null;
            return;
          }
          seenWaitingHosts.set(room.host, code);
        }
      });

      const list = codes
        .filter(code => cleanupUpdates[`/rooms/${code}`] === undefined)
        .map(code => ({
          roomCode: code,
          roomName: data[code].roomName ?? `${data[code].host}'s Room`,
          host: data[code].host,
          hostPhoto: data[code].hostPhoto ?? null,
          hostAvatarId: data[code].hostAvatarId ?? null,
          guest: data[code].guest ?? null,
          guestPhoto: data[code].guestPhoto ?? null,
          guestAvatarId: data[code].guestAvatarId ?? null,
          status: data[code].status,
           isPrivate: !!data[code].isPrivate, 
        }))
        .filter(
          room =>
            (room.status === 'waiting' || room.status === 'playing') &&
            room.host !== myName &&
            room.guest !== myName,
        );

      list.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'waiting' ? -1 : 1;
      });

      setAllRooms(list);

      if (Object.keys(cleanupUpdates).length > 0) {
        database()
          .ref()
          .update(cleanupUpdates)
          .catch(err => console.log('Ghost room cleanup FAILED:', err.message));
      }
    });
  };

  const stopFetchingAllRooms = () => {
    if (roomsListenerRef.current) {
      roomsListenerRef.current.off();
      roomsListenerRef.current = null;
    }
  };

  const guestWasPresentRef = useRef(false);
  const lastRoomDataRef = useRef<any>(null);

  const listenToRoom = (code: string) => {
    if (listenedCodeRef.current === code && roomRef.current) {
      console.log('Skipping duplicate listenToRoom for', code);
      return;
    }
    if (opponentLeftTimeoutRef.current) {
      clearTimeout(opponentLeftTimeoutRef.current);
      opponentLeftTimeoutRef.current = null;
    }

    listenedCodeRef.current = code;
    roomHasLoadedRef.current = false;
    guestWasPresentRef.current = false;
    lastRoomDataRef.current = null;

    if (!roomRef.current) {
      roomRef.current = database().ref(`/rooms/${code}`);
    }

    roomRef.current.off();

    const handleOpponentLeft = (message: string, alsoRemoveRoom: boolean) => {
      if (alsoRemoveRoom && roomRef.current) {
        roomRef.current.remove().catch(() => {});
      }

      if (roomRef.current) {
        roomRef.current.off();
        roomRef.current
          .onDisconnect()
          .cancel()
          .catch(() => {});
      }
      roomRef.current = null;
      listenedCodeRef.current = null;
      recordedResultKeyRef.current = null;
      activeSessionKeyRef.current = null;
      guestWasPresentRef.current = false;
      lastRoomDataRef.current = null;

      setInGameStatus(false);
      setMultiplayerError(message);
      setOpponentName('');
      setOpponentPhoto(null);
      setOpponentAvatarId(null);

      opponentLeftTimeoutRef.current = setTimeout(() => {
        opponentLeftTimeoutRef.current = null;
        setMyRole(null);
        setRoomCodeState('');
        setRoomIsPrivate(false);  
        setGameStarted(false);
        setMyRematchRequested(false);
        setOpponentRematchRequested(false);
        resetGame();
        setScreen('Mode');
      }, 2000);
    };

    roomRef.current.on('value', snap => {
      const data = snap.val();

      if (!data) {
        if (!roomHasLoadedRef.current) {
          // console.log('listenToRoom: waiting for initial data,', code);
          return;
        }
        if (lastRoomDataRef.current?.status === 'event_match_over') {
      // console.log('Room removed after event match completion — expected, ignoring');
      return;
    }

        const message =
          lastRoomDataRef.current?.hostLeaveReason === 'left'
            ? 'Opponent has left the game.'
            : 'Connection lost.';
        handleOpponentLeft(message, false);
        return;
      }

      roomHasLoadedRef.current = true;
      lastRoomDataRef.current = data;

      const isHost = data.host === myName;
      if (isHost) {
        if (data.guest) {
          guestWasPresentRef.current = true;
        } else if (
          guestWasPresentRef.current &&
          data.status === 'waiting' &&
          gameStartedRef.current
        ) {
          const message =
            data.guestLeaveReason === 'left'
              ? 'Opponent has left the game.'
              : 'Connection lost.';

          if (data.isRandomMatch) {
            // Random match: no rejoin possible — force exit as before
            handleOpponentLeft(message, true);
          } else {
            // Invite/created room: guest can rejoin with the same code —
            guestWasPresentRef.current = false;
            recordedResultKeyRef.current = null;
            activeSessionKeyRef.current = null;
            setOpponentName('');
            setOpponentPhoto(null);
            setOpponentAvatarId(null);
            setMyRematchRequested(false);
            setOpponentRematchRequested(false);
            setMultiplayerError(message);
            setGameStarted(false);
            setScreen('waiting');
          }
          return;
        }
      }

      setBoard(normalizeBoard(data.board));
      hostUidRef.current = data.hostUid ?? null;
      guestUidRef.current = data.guestUid ?? null;
      setCurrentPlayer(data.currentTurn ?? 'X');
      setWinner(data.winner ?? null);
      setRoomIsPrivate(!!data.isPrivate);

         if (eventMatchInfoRef.current || data.isEventMatch) {
  const opponentDisconnected =
    myRoleRef.current === 'X' ? data.guestDisconnected : data.hostDisconnected;

  if (opponentDisconnected && data.status !== 'event_match_over') {
    forfeitEventMatch(data.hostUid ?? null, data.guestUid ?? null);
  } else if (data.winner && data.status !== 'event_match_over' && myRoleRef.current === 'X') {
  recordEventMatchResult(
    data.winner,
    data.hostUid ?? null,
    data.guestUid ?? null,
    data.lastFirst ?? 'X',
  );
  } else if (data.isDraw && myRoleRef.current === 'X') {
    const nextFirst: Player = (data.lastFirst ?? 'X') === 'X' ? 'O' : 'X';
    roomRef.current
      ?.update({
        board: Array(9).fill(null),
        currentTurn: nextFirst,
        winner: null,
        isDraw: false,
        lastFirst: nextFirst,
      })
      .catch(err => console.log('event draw auto-continue FAILED:', err.message));
  }
}

if (data.status === 'event_match_over') {
  setEventMatchOver(true);
}

      if (data.status === 'playing') {
        setGameStarted(true);
        setScreen('multiplayerGame');
        setInGameStatus(true);
      }

      const opponent = data.host === myName ? data.guest : data.host;
      setOpponentName(opponent);

      const oppPhoto = data.host === myName ? data.guestPhoto : data.hostPhoto;
      setOpponentPhoto(oppPhoto ?? null);

      const oppAvatarId =
        data.host === myName ? data.guestAvatarId : data.hostAvatarId;
      setOpponentAvatarId(oppAvatarId ?? null);

      const currentRole = myRoleRef.current;

      // Once both sides have requested a rematch, host resets the board
      // and flips who goes first
      if (data.rematchX && data.rematchO && currentRole === 'X') {
        const prevFirst = data.lastFirst ?? 'X';
        const newFirst: Player = prevFirst === 'X' ? 'O' : 'X';
        roomRef.current
          ?.update({
            board: Array(9).fill(null),
            currentTurn: newFirst,
            winner: null,
            isDraw: false,
            status: 'playing',
            lastFirst: newFirst,
            rematchX: false,
            rematchO: false,
          })
          .then(() => console.log('Board reset for rematch'))
          .catch(err => console.log('Board reset FAILED:', err.message));
      }

      const myFlag = currentRole === 'X' ? data.rematchX : data.rematchO;
      const oppFlag = currentRole === 'X' ? data.rematchO : data.rematchX;
      setMyRematchRequested(!!myFlag);
      setOpponentRematchRequested(!!oppFlag);
    });
  };

  const handleMultiplayerPress = (i: number) => {
    if (!roomRef.current || !myRole) return;
    if (board[i] || winner) return;
    if (!isMyTurn) return;
    if (processingMoveRef.current) return;
    processingMoveRef.current = true;

    const newBoard = [...board];
    newBoard[i] = myRole;

    const win = checkwin(newBoard);
    const draw = newBoard.every(c => c !== null) && !win;
    const nextTurn: Player = myRole === 'X' ? 'O' : 'X';

    roomRef.current
      .update({
        board: newBoard,
        currentTurn: win || draw ? null : nextTurn,
        winner: win ?? null,
        isDraw: draw,
      })
      .then(() => {
        if (win) {
          updateLeaderboard(myName);

          const winnerUid =
            win === 'X' ? hostUidRef.current : guestUidRef.current;
          const loserUid =
            win === 'X' ? guestUidRef.current : hostUidRef.current;

          if (!winnerUid || !loserUid) {
            console.error('Missing UID for stats update:', {
              winnerUid,
              loserUid,
            });
          }

          updatePlayerStats(winnerUid, 'win');
          updatePlayerStats(loserUid, 'loss');
        } else if (draw) {
          updatePlayerStats(hostUidRef.current, 'draw');
          updatePlayerStats(guestUidRef.current, 'draw');
        }
      })
      .catch(err => console.log('handleMultiplayerPress error:', err.message))
      .finally(() => {
        processingMoveRef.current = false;
      });
  };

  useEffect(() => {
    if (myRole) {
      setIsMyTurn(currentPlayer === myRole);
    }
  }, [currentPlayer, myRole]);

  useEffect(() => {
    const names = [
      ...gameFriends.map(f => f.name),
      ...recentOpponents.map(o => o.name),
    ];
    listenToPresence(names);
  }, [gameFriends, recentOpponents]);

  useEffect(() => {
    const cleanup = setupPresence();
    return cleanup;
  }, [myName]);

  // Periodic sweep for expired invitations. Firebase's on('value') listener
  // only fires when the DB is written to — if nobody touches the invite
  // (sender doesn't cancel, receiver doesn't act), no new event will ever
  // arrive to signal that the TTL has passed. So we re-check locally on an
  // interval instead of relying purely on DB events.
  useEffect(() => {
    if (!myName) return;
    const id = setInterval(applyInvitationFilter, 15000);
    return () => clearInterval(id);
  }, [myName]);

  useEffect(() => {
    if (!multiplayerError) return;
    const id = setTimeout(() => setMultiplayerError(''), 3000);
    return () => clearTimeout(id);
  }, [multiplayerError]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  // Tracks online/offline presence for the current user via .info/connected
  const setupPresence = () => {
    if (!myName) return undefined;

    const myStatusRef = database().ref(`/status/${myName}`);
    const connectedRef = database().ref('.info/connected');

    const onConnectedChange = (snap: FirebaseDatabaseTypes.DataSnapshot) => {
      if (snap.val() === false) return;

       myStatusRef.onDisconnect().set({
    state: 'offline',
    last_changed: database.ServerValue.TIMESTAMP,
    inGame: false,
    inGameRoomCode: null,
  });
        myStatusRef
    .set({
      state: 'online',
      last_changed: database.ServerValue.TIMESTAMP,
      inGame: !!roomRef.current,
      inGameRoomCode: roomRef.current ? roomCodeRef.current : null,
    })
    .catch(err =>
      console.log('setupPresence onConnectedChange FAILED:', err.message),
    );
    };

    connectedRef.on('value', onConnectedChange);
    return () => {
      connectedRef.off('value', onConnectedChange);

      if (!auth().currentUser) return;
      myStatusRef
        .set({
          state: 'offline',
          last_changed: database.ServerValue.TIMESTAMP,
        })
        .catch(err =>
          console.log('setupPresence cleanup FAILED:', err.message),
        );
    };
  };

  // Subscribes to presence for a given list of names (friends + recent opponents)
  const listenToPresence = (names: string[]) => {
    Object.keys(presenceRefsRef.current).forEach(name => {
      if (!names.includes(name)) {
        presenceRefsRef.current[name].off();
        delete presenceRefsRef.current[name];
      }
    });

    names.forEach(name => {
      if (presenceRefsRef.current[name]) return;
      const ref = database().ref(`/status/${name}`);
      presenceRefsRef.current[name] = ref;

      ref.on('value', snap => {
        const data = snap.val();
        setOnlineStatus(prev => ({
          ...prev,
          [name]: data?.state === 'online',
        }));
      });
    });
  };

  // Marks this player as "in a game" (or not) in their presence record.
  // Used by acceptInvitation / random-match to avoid matching someone
  // who's already playing.
  const setInGameStatus = (inGame: boolean, roomCode?: string) => {
    if (!myName) return;
    database()
      .ref(`/status/${myName}`)
      .update({ 
        inGame,
        inGameRoomCode: inGame ? (roomCode ?? roomCodeRef.current) : null,
      
      })
      .catch(err => console.log('setInGameStatus FAILED:', err.message));
  };

 const leaveRoom = () => {
    console.log('leaveRoom() called, roomRef exists:', !!roomRef.current);
    if (!roomRef.current && opponentLeftTimeoutRef.current) {
      clearTimeout(opponentLeftTimeoutRef.current);
      opponentLeftTimeoutRef.current = null;

      listenedCodeRef.current = null;
      recordedResultKeyRef.current = null;
      activeSessionKeyRef.current = null;

      setInGameStatus(false);
      setMyRole(null);
      setOpponentName('');
      setOpponentPhoto(null);
      setOpponentAvatarId(null);
      setRoomCodeState('');
      setJoinCode('');
      setGameStarted(false);
      setMyRematchRequested(false);
      setOpponentRematchRequested(false);
      setMultiplayerError('');

      resetGame();
      creatingRoomRef.current = false;
      setScreen('Mode');
      return;
    }

    if (!roomRef.current || isLeavingRef.current) return;
    isLeavingRef.current = true;

    if (opponentName && myName && opponentName !== myName) {
      database()
        .ref(`/recentOpponents/${myName}/${opponentName}`)
        .set({
          name: opponentName,
          photo: opponentPhoto ?? null,
          avatarId: opponentAvatarId ?? null,
          timestamp: database.ServerValue.TIMESTAMP,
        });
      database()
        .ref(`/recentOpponents/${opponentName}/${myName}`)
        .set({
          name: myName,
          photo: myPhoto ?? null,
          avatarId: myAvatarId ?? null,
          timestamp: database.ServerValue.TIMESTAMP,
        });
    }

    const currentRef = roomRef.current;
    const iAmHost = myRole === 'X';
    // NEW: only random matches force-end the room when host leaves.
    // Invite/created rooms should stay alive so the guest can wait.
    const isRandom = lastRoomDataRef.current?.isRandomMatch === true;

    currentRef
      .onDisconnect()
      .cancel()
      .then(() => {
        if (iAmHost) {
          if (isRandom) {
            // Random match: no rejoin possible — end it for both, as before
            return currentRef
              .update({ hostLeaveReason: 'left' })
              .then(() => currentRef.remove());
          }
          // Invite/created room: keep the room alive so the guest can wait,
          // same treatment guest-leaving already gets on the host's side
          return currentRef.update({
            host: null,
            hostUid: null,
            hostPhoto: null,
            hostAvatarId: null,
            hostLeaveReason: 'left',
            status: 'waiting',
            currentTurn: 'X',
            lastFirst: 'X',
            winner: null,
            isDraw: false,
            rematchX: false,
            rematchO: false,
          });
        } else {
          return currentRef.update({
            guest: null,
            guestUid: null,
            guestPhoto: null,
            guestAvatarId: null,
            guestLeaveReason: 'left',
            status: 'waiting',
            currentTurn: 'X',
            lastFirst: 'X',
            winner: null,
            isDraw: false,
            rematchX: false,
            rematchO: false,
          });
        }
      })
      .then(() => console.log('leaveRoom cleanup successful'))
      .catch(err => console.log('leaveRoom cleanup FAILED:', err.message));

    currentRef.off();

    roomRef.current = null;
    listenedCodeRef.current = null;
    recordedResultKeyRef.current = null;
    activeSessionKeyRef.current = null;

    setMyRole(null);
    setOpponentName('');
    setOpponentPhoto(null);
    setOpponentAvatarId(null);
    setRoomCodeState('');
    setJoinCode('');
    setGameStarted(false);
    setMyRematchRequested(false);
    setOpponentRematchRequested(false);
    setRoomIsPrivate(false);

    resetGame();
    setInGameStatus(false);
    creatingRoomRef.current = false;

    setScreen('Mode');

    isLeavingRef.current = false;
  };

    const leaveEventRoom = () => {
    if (roomRef.current) {
      roomRef.current.off();
      roomRef.current.onDisconnect().cancel().catch(() => {});
      roomRef.current.remove().catch(() => {});
    }
    roomRef.current = null;
    listenedCodeRef.current = null;
    eventMatchInfoRef.current = null;
    recordedResultKeyRef.current = null;
    activeSessionKeyRef.current = null;

    setEventMatchOver(false);
    setMyRole(null);
    setOpponentName('');
    setOpponentPhoto(null);
    setOpponentAvatarId(null);
    setRoomCodeState('');
    setGameStarted(false);
    resetGame();
    setInGameStatus(false);
    setIsEventMatch(false);
setEventInfo(null);
  };

  const isDraw = board.every(c => c !== null) && !winner;

  // Increments the winner's weekly leaderboard win count (transaction-safe)
  const updateLeaderboard = (winnerName: string) => {
    const uid = auth().currentUser?.uid ?? null;
    if (!uid) return;
    const photo = myPhoto ?? null;
    const weekKey = getCurrentWeekKey();

    const lbRef = database().ref(`/leaderboard/${weekKey}/${uid}`);
    lbRef.transaction(current => {
      const prevWins =
        typeof current === 'number' ? current : current?.wins ?? 0;

      return {
        wins: prevWins + 1,
        uid,
        name: winnerName,
        photo,
        avatarId: myAvatarId ?? null,
      };
    });
  };

  // Migrates a username across all DB locations (recentOpponents,
  // gameFriends, presence status, match history) after a rename
  const renameUsernameEverywhere = (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;

    const db = database();
    const updates: Record<string, any> = {};

    // ---- migrate recentOpponents ----
    const recentPromise = db
      .ref(`/recentOpponents/${oldName}`)
      .once('value')
      .then(myRecentSnap => {
        const myRecentData = myRecentSnap.val();
        if (!myRecentData) return null;

        const opponentNames = Object.keys(myRecentData);

        const oppPromises = opponentNames.map(opponentName => {
          updates[`/recentOpponents/${newName}/${opponentName}`] =
            myRecentData[opponentName];
          updates[`/recentOpponents/${oldName}/${opponentName}`] = null;

          return db
            .ref(`/recentOpponents/${opponentName}/${oldName}`)
            .once('value')
            .then(oppEntrySnap => {
              const oppEntryData = oppEntrySnap.val();
              if (oppEntryData) {
                updates[`/recentOpponents/${opponentName}/${newName}`] = {
                  ...oppEntryData,
                  name: newName,
                  avatarId: myAvatarId ?? null,
                  photo: myPhoto ?? null,
                };
                updates[`/recentOpponents/${opponentName}/${oldName}`] = null;
              }
            });
        });

        return Promise.all(oppPromises);
      });

    // ---- migrate gameFriends ----
    const friendsPromise = db
      .ref(`/gameFriends/${oldName}`)
      .once('value')
      .then(myFriendsSnap => {
        const myFriendsData = myFriendsSnap.val();
        if (!myFriendsData) return null;

        const friendNames = Object.keys(myFriendsData);

        const friendPromises = friendNames.map(friendName => {
          updates[`/gameFriends/${newName}/${friendName}`] =
            myFriendsData[friendName];
          updates[`/gameFriends/${oldName}/${friendName}`] = null;

          return db
            .ref(`/gameFriends/${friendName}/${oldName}`)
            .once('value')
            .then(friendEntrySnap => {
              const friendEntryData = friendEntrySnap.val();
              if (friendEntryData) {
                updates[`/gameFriends/${friendName}/${newName}`] = {
                  ...friendEntryData,
                  name: newName,
                };
                updates[`/gameFriends/${friendName}/${oldName}`] = null;
              }
            });
        });

        return Promise.all(friendPromises);
      });

    // ---- migrate presence/status ----
    const statusPromise = db
      .ref(`/status/${oldName}`)
      .once('value')
      .then(statusSnap => {
        if (statusSnap.exists()) {
          updates[`/status/${newName}`] = statusSnap.val();
          updates[`/status/${oldName}`] = null;
        }
      });

    const matchHistoryPromise = db
      .ref(`/matchHistory/${oldName}`)
      .once('value')
      .then(historySnap => {
        const historyData = historySnap.val();
        if (historyData) {
          updates[`/matchHistory/${newName}`] = historyData;
          updates[`/matchHistory/${oldName}`] = null;
        }
      });

    Promise.all([
      recentPromise,
      friendsPromise,
      statusPromise,
      matchHistoryPromise,
    ])
      .then(() => {
        if (Object.keys(updates).length === 0) return null;
        return db.ref().update(updates);
      })
      .then(() => {
        updateLeaderboardName(newName);
        console.log('Username migration complete:', oldName, '->', newName);
      })
      .catch(err =>
        console.log('renameUsernameEverywhere FAILED:', err.message),
      );
  };

  // Updates the display name (and optionally photo/avatar) on this user's
  // current-week leaderboard entry, if one exists
  const updateLeaderboardName = (
    newName: string,
    overrideAvatarId?: string | null,
    overridePhoto?: string | null,
  ) => {
    const uid = auth().currentUser?.uid ?? null;
    if (!uid) return;
    const weekKey = getCurrentWeekKey();
    const lbRef = database().ref(`/leaderboard/${weekKey}/${uid}`);
    lbRef.once('value').then(snap => {
      if (snap.exists()) {
        lbRef
          .update({
            name: newName,
            avatarId:
              overrideAvatarId !== undefined
                ? overrideAvatarId
                : myAvatarId ?? null,
            photo:
              overridePhoto !== undefined ? overridePhoto : myPhoto ?? null,
          })
          .catch(err =>
            console.log('Leaderboard name update FAILED:', err.message),
          );
      }
    });
  };

  // ============ MATCH HISTORY ============

  // Starts (or resumes) a session-stats tracker tied to a room code
  const startNewSession = (code: string) => {
    if (activeSessionKeyRef.current === code) {
      console.log('Session already active for', code, '— skipping reset');
      return;
    }
    activeSessionKeyRef.current = code;
    sessionStatsRef.current = { wins: 0, losses: 0, draws: 0 };
    recordedResultKeyRef.current = null;
    currentSessionRecordRef.current = null;
  };

  const recordGameResult = (result: 'win' | 'loss' | 'draw') => {
    console.log('recordGameResult called:', result);
    if (result === 'win') sessionStatsRef.current.wins += 1;
    else if (result === 'loss') sessionStatsRef.current.losses += 1;
    else sessionStatsRef.current.draws += 1;
  };

  // Persists the current session's win/loss/draw tally to match history,
  // resetting the history cycle once it gets old/large enough
  const saveSessionMatchRecord = (opponent: string, code: string) => {
    if (!myName) return;
    const stats = sessionStatsRef.current;
    const totalGames = stats.wins + stats.losses + stats.draws;
    if (totalGames === 0) return;

    const recordData = {
      opponent: opponent || 'Unknown',
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      totalGames,
      roomCode: code,
      timestamp: database.ServerValue.TIMESTAMP,
    };

    if (currentSessionRecordRef.current) {
      currentSessionRecordRef.current
        .update(recordData)
        .catch(err =>
          console.log('saveSessionMatchRecord update FAILED:', err.message),
        );
      return;
    }

    const rootRef = database().ref(`/matchHistory/${myName}`);
    rootRef
      .once('value')
      .then(snap => {
        const data = snap.val();
        const records = data?.records ?? {};
        const cycleStartedAt = data?.cycleStartedAt ?? null;
        const count = Object.keys(records).length;
        const now = Date.now();

        const shouldReset =
          !cycleStartedAt ||
          (count > MATCH_HISTORY_THRESHOLD
            ? now - cycleStartedAt >= ONE_WEEK_MS
            : now - cycleStartedAt >= TWO_WEEKS_MS);

        const createRecord = () => {
          const newRecordRef = database()
            .ref(`/matchHistory/${myName}/records`)
            .push();
          currentSessionRecordRef.current = newRecordRef;
          return newRecordRef.set(recordData);
        };

        if (shouldReset) {
          return rootRef
            .set({
              cycleStartedAt: database.ServerValue.TIMESTAMP,
              records: {},
            })
            .then(() => createRecord());
        }
        return createRecord();
      })
      .catch(err => console.log('saveSessionMatchRecord FAILED:', err.message));
  };

  const fetchMatchHistory = () => {
    if (!myName) return;
    database()
      .ref(`/matchHistory/${myName}/records`)
      .orderByChild('timestamp')
      .once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (!data) {
          setMatchHistory([]);
          return;
        }
        const list = Object.values(data) as {
          opponent: string;
          wins: number;
          losses: number;
          draws: number;
          totalGames: number;
          roomCode: string;
          timestamp: number;
        }[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        setMatchHistory(list);
      })
      .catch(err => console.log('fetchMatchHistory error:', err.message));
  };

  // Returns the current ISO week key (e.g. "2026-W33") used to bucket
  // the weekly leaderboard
  const getCurrentWeekKey = (): string => {
    const now = new Date();
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
    target.setDate(target.getDate() - dayNr + 3); // nearest Thursday
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.getTime() - firstThursday.getTime();
    const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  const fetchLeaderboard = () => {
    const weekKey = getCurrentWeekKey();
    database()
      .ref(`/leaderboard/${weekKey}`)
      .once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (!data) {
          setLeaderboard([]);
          return;
        }
        const list = Object.keys(data).map(key => {
          const entry = data[key];
          if (typeof entry === 'number') {
            return {
              name: key,
              wins: entry,
              uid: null,
              photo: null,
              avatarId: null,
            };
          }
          return {
            name: entry?.name ?? key,
            wins: entry?.wins ?? 0,
            uid: entry?.uid ?? null,
            photo: entry?.photo ?? null,
            avatarId: entry?.avatarId ?? null,
          };
        });
        list.sort((a, b) => b.wins - a.wins);
        setLeaderboard(list);
      });
  };

  // ============ GAME INVITATIONS ============

  const sendInvitation = (toName: string) => {
    if (!myName || !toName) return;
    if (toName === myName) return;

  //     // Don't let the sender invite someone while they're already in a

     if (roomRef.current || gameStarted) {
    setMultiplayerError('Finish your current game before inviting someone.');
    return;
  }

    // Don't send an invite to someone we already know is offline —
    // avoids a guaranteed-dead invite sitting in their inbox.
    if (onlineStatus[toName] === false) {
      setMultiplayerError(`${toName} is offline right now.`);
      return;
    }

    database()
      .ref(`/invitations/${toName}/${myName}`)
      .set({
        from: myName,
        fromUid: auth().currentUser?.uid ?? null,
        fromPhoto: myPhoto ?? null,
        fromAvatarId: myAvatarId ?? null,
        status: 'pending',
        timestamp: database.ServerValue.TIMESTAMP,
      })
      .then(() => {
        console.log('Invitation sent to:', toName);
      })
      .catch(err => {
        console.log('FIREBASE WRITE FAILED:', err.message);
      });
  };

  // Accepts an invitation using a transaction to atomically claim the
  // inviter's presence slot, preventing two people from accepting at once
  const acceptInvitation = (fromName: string) => {
    if (!myName) return;

    const statusRef = database().ref(`/status/${fromName}`);

    statusRef
      .transaction(current => {
        if (!current || current.state !== 'online') {
          return; // abort — inviter is offline
        }
        if (current.inGame) {
          return; // abort — already claimed by someone else / already busy
        }
        return {
          ...current,
          inGame: true,
        };
      })
      .then(result => {
        if (!result.committed) {
          // Transaction aborted — figure out whether it was offline or
          // busy, just for the error message
          statusRef.once('value').then(snap => {
  const s = snap.val();
  const isOnline = s?.state === 'online';

  if (!isOnline) {
    setMultiplayerError(`${fromName} is offline right now.`);
    return;
  }

  const stuckRoomCode = s?.inGameRoomCode;

  if (!stuckRoomCode) {
    // inGame is true but there's no room reference — a stale/stuck
    // flag with nothing to verify against. Self-heal it immediately
    // instead of leaving the user stuck forever.
    statusRef.update({ inGame: false, inGameRoomCode: null }).catch(() => {});
    setMultiplayerError(`try inviting ${fromName} again.`);
    return;
  }

  database()
    .ref(`/rooms/${stuckRoomCode}`)
    .once('value')
    .then(roomSnap => {
      if (!roomSnap.exists()) {
        statusRef.update({ inGame: false, inGameRoomCode: null });
        setMultiplayerError(`try inviting ${fromName} again.`);
      } else {
        setMultiplayerError(`${fromName} is already playing.`);
      }
    });
     
          });
          database().ref(`/invitations/${myName}/${fromName}`).remove();
          database().ref(`/sentInvitations/${fromName}/${myName}`).remove();
          return;
        }

        // Claimed atomically — now safely create the room
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        database()
          .ref(`/invitations/${myName}/${fromName}`)
          .once('value')
          .then(snap => {
            const invitationData = snap.val();
            const hostUid = invitationData?.fromUid ?? null;
            const hostPhoto = invitationData?.fromPhoto ?? null;
            const hostAvatarId = invitationData?.fromAvatarId ?? null;

            const updates: Record<string, any> = {};
            updates[`/invitations/${myName}/${fromName}/status`] = 'accepted';
            updates[`/sentInvitations/${fromName}/${myName}/status`] =
              'accepted';
            updates[`/sentInvitations/${fromName}/${myName}/roomCode`] = code;
            updates[`/sentInvitations/${fromName}/${myName}/guestPhoto`] =
              myPhoto ?? null;
            updates[`/sentInvitations/${fromName}/${myName}/guestAvatarId`] =
              myAvatarId ?? null;

            database()
              .ref()
              .update(updates)
              .then(() => {
                const ref = database().ref(`/rooms/${code}`);
                roomRef.current = ref;
                ref
                  .set({
                    roomName: `${fromName}'s Room`,
                    host: fromName,
                    hostUid,
                    hostPhoto,
                    hostAvatarId,
                    guest: myName,
                    guestUid: auth().currentUser?.uid ?? null,
                    guestPhoto: myPhoto ?? null,
                    guestAvatarId: myAvatarId ?? null,
                    board: Array(9).fill(null),
                    currentTurn: 'X',
                    lastFirst: 'X',
                    winner: null,
                    isDraw: false,
                    status: 'playing',
                  })
                  .then(() => {
                    ref.onDisconnect().remove();
                    setRoomCodeState(code);
                    setMyRole('O');
                    setOpponentName(fromName);
                    setOpponentPhoto(hostPhoto);
                    setOpponentAvatarId(hostAvatarId);
                    setGameStarted(true);
                    setInGameStatus(true);
                    startNewSession(code);
                    listenToRoom(code);
                    setScreen('multiplayerGame');
                  })
                  .catch(err => {
                    console.log('Room creation FAILED:', err.message);
                    // Room creation failed — revert the claimed inGame flag,
                    // otherwise fromName stays stuck as "busy" forever
                    statusRef.update({ inGame: false }).catch(() => {});
                  });
              });
          });
      })
      .catch(err => {
        console.log('acceptInvitation transaction FAILED:', err);
        setMultiplayerError('Something went wrong. Please try again.');
      });
  };

  const rejectInvitation = (fromName: string) => {
    database().ref(`/invitations/${myName}/${fromName}`).remove();
  };

  const fetchRecentOpponents = () => {
    if (!myName) return;
    database()
      .ref(`/recentOpponents/${myName}`)
      .once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (!data) {
          setRecentOpponents([]);
          return;
        }
        const list = Object.keys(data)
          .filter(name => name !== myName)
          .map(name => ({
            name,
            photo: data[name]?.photo ?? null,
            avatarId: data[name]?.avatarId ?? null,
          }));
        setRecentOpponents(list);
      });
  };

  // ============ FRIEND REQUEST FLOW ============

  const sendFriendRequest = (toName: string) => {
    if (!myName || !toName || toName === myName) return;

    database()
      .ref(`/friendRequests/${toName}/${myName}`)
      .set({
        from: myName,
        fromUid: auth().currentUser?.uid ?? null,
        fromPhoto: myPhoto ?? null,
        fromAvatarId: myAvatarId ?? null,
        status: 'pending',
        timestamp: database.ServerValue.TIMESTAMP,
      })
      .then(() => console.log('Friend request sent to', toName))
      .catch(err => console.log('Friend request FAILED:', err.message));
  };

  const acceptFriendRequest = (fromName: string) => {
    if (!myName || !fromName) return;

    database()
      .ref(`/friendRequests/${myName}/${fromName}`)
      .once('value')
      .then(snap => {
        const reqData = snap.val();
        const fromUid = reqData?.fromUid ?? null;
        const fromPhoto = reqData?.fromPhoto ?? null;
        const fromAvatarId = reqData?.fromAvatarId ?? null;
        const myUid = auth().currentUser?.uid ?? null;
        const updates: Record<string, any> = {};

        // Add each other symmetrically to both users' friend lists
        updates[`/gameFriends/${myName}/${fromName}`] = {
          name: fromName,
          uid: fromUid,
          photo: fromPhoto,
          avatarId: fromAvatarId,
          timestamp: database.ServerValue.TIMESTAMP,
        };

        updates[`/gameFriends/${fromName}/${myName}`] = {
          name: myName,
          uid: myUid,
          photo: myPhoto,
          avatarId: myAvatarId ?? null,
          timestamp: database.ServerValue.TIMESTAMP,
        };

        updates[`/friendRequests/${myName}/${fromName}`] = null;

        database()
          .ref()
          .update(updates)
          .then(() => {
            setGameFriends(prev =>
              prev.some(f => f.name === fromName)
                ? prev
                : [
                    ...prev,
                    {
                      name: fromName,
                      uid: fromUid,
                      photo: fromPhoto,
                      avatarId: fromAvatarId,
                    },
                  ],
            );
          })
          .catch(err => console.log('Accept friend request error:', err));
      });
  };

  const rejectFriendRequest = (fromName: string) => {
    if (!myName) return;
    database().ref(`/friendRequests/${myName}/${fromName}`).remove();
  };

  const listenToFriendRequests = () => {
    if (!myName) return;
    if (friendReqListenerRef.current) friendReqListenerRef.current.off();
    const ref = database().ref(`/friendRequests/${myName}`);
    friendReqListenerRef.current = ref;
    ref.on('value', snap => {
      const data = snap.val();
      if (!data) {
        setIncomingFriendRequests([]);
        return;
      }
      const list = Object.keys(data)
        .filter(from => from !== myName)
        .map(from => ({
          from,
          status: data[from].status,
          fromAvatarId: data[from]?.fromAvatarId ?? null,
          fromPhoto: data[from]?.fromPhoto ?? null,
          timestamp: data[from]?.timestamp ?? 0,
        }));
      setIncomingFriendRequests(list.filter(i => i.status === 'pending'));
    });
  };

  // Fetches the friend list, refreshing each friend's live name/photo/avatar
  // from their Firestore user doc (falls back to the cached values)
  const fetchGameFriends = () => {
    if (!myName) return;
    database()
      .ref(`/gameFriends/${myName}`)
      .once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (!data) {
          setGameFriends([]);
          return null;
        }

        const names = Object.keys(data).filter(name => name !== myName);

        const promises = names.map(name => {
          const uid = data[name]?.uid ?? null;
          const photo = data[name]?.photo ?? null;
          const avatarId = data[name]?.avatarId ?? null;
          const displayName = data[name]?.name ?? name;

          if (!uid) {
            return Promise.resolve({ name: displayName, uid, photo, avatarId });
          }

          return firestore()
            .collection('users')
            .doc(uid)
            .get()
            .then(doc => {
              const liveData = doc.data();
              const resolvedName =
                (liveData?.username && liveData.username.trim()) ||
                (liveData?.name && liveData.name.trim()) ||
                displayName;
              return {
                name: resolvedName,
                uid,
                photo: liveData?.photoURL ?? photo,
                avatarId: liveData?.avatarId ?? avatarId,
              };
            })
            .catch(err => {
              console.log('fetchGameFriends live fetch error:', err);
              return { name: displayName, uid, photo, avatarId };
            });
        });

        return Promise.all(promises).then(list => {
          setGameFriends(list);
        });
      })
      .catch(err => console.log('fetchGameFriends error:', err.message));
  };

  const removeFriend = (friendName: string) => {
    if (!myName || !friendName) return;

    const updates: Record<string, any> = {};
    updates[`/gameFriends/${myName}/${friendName}`] = null;
    updates[`/gameFriends/${friendName}/${myName}`] = null;

    database()
      .ref()
      .update(updates)
      .then(() => {
        setGameFriends(prev => prev.filter(f => f.name !== friendName));
      })
      .catch(err => console.log('Remove friend error:', err));
  };

  // Filters the raw invitations snapshot down to non-expired, pending
  // entries. Also sweeps out anything older than INVITE_TTL_MS from both
  // sides (/invitations and /sentInvitations) so a stale invite doesn't
  // linger forever, even across app restarts.
  const applyInvitationFilter = () => {
    const data = rawInvitationsRef.current;
    if (!myName) return;
    if (!data) {
      setIncomingInvitations([]);
      return;
    }

    const now = Date.now();
    const staleUpdates: Record<string, any> = {};

    const list = Object.keys(data)
      .filter(from => from !== myName)
      .map(from => ({
        from,
        status: data[from].status,
        fromAvatarId: data[from]?.fromAvatarId ?? null,
        fromPhoto: data[from]?.fromPhoto ?? null,
        timestamp: data[from]?.timestamp ?? 0,
      }))
      .filter(inv => {
        if (inv.status !== 'pending') return false;
        const isExpired = inv.timestamp && now - inv.timestamp > INVITE_TTL_MS;
        if (isExpired) {
          staleUpdates[`/invitations/${myName}/${inv.from}`] = null;
          // staleUpdates[`/sentInvitations/${inv.from}/${myName}/status`] = null;
              staleUpdates[`/sentInvitations/${inv.from}/${myName}/status`] = 'expired';
          return false;
        }
        return true;
      });

    setIncomingInvitations(list);

    if (Object.keys(staleUpdates).length > 0) {
      database()
        .ref()
        .update(staleUpdates)
        .catch(err => console.log('Stale invite cleanup FAILED:', err.message));
    }
  };

  const listenToInvitations = () => {
    if (!myName) return;
    if (invitationsListenerRef.current) invitationsListenerRef.current.off();
    const ref = database().ref(`/invitations/${myName}`);
    invitationsListenerRef.current = ref;
    ref.on('value', snap => {
      rawInvitationsRef.current = snap.val();
      applyInvitationFilter();
    });
  };

  // Watches invitations this user sent out; when one gets accepted, joins
  // the resulting room as host
 const listenToSentInvitations = () => {
  if (!myName) return;
  if (sentInvListenerRef.current) sentInvListenerRef.current.off();
  const ref = database().ref(`/sentInvitations/${myName}`);
  sentInvListenerRef.current = ref;
  ref.on('value', snap => {
    const data = snap.val();
    if (!data) return;

    Object.keys(data).forEach(toName => {
      const info = data[toName];
      if (info.status === 'accepted' && info.roomCode) {
        if (
          roomRef.current &&
          roomCodeRef.current &&
          info.roomCode !== roomCodeRef.current
        ) {
          console.log(
            'Ignoring stray accepted invitation, already in a room:',
            toName,
          );
          database().ref(`/sentInvitations/${myName}/${toName}`).remove();
          database().ref(`/invitations/${toName}/${myName}`).remove();
          database()
            .ref(`/rooms/${info.roomCode}`)
            .remove()
            .catch(() => {});
          return;
        }

        roomRef.current = database().ref(`/rooms/${info.roomCode}`);
        roomRef.current.onDisconnect().remove();
        setRoomCodeState(info.roomCode);
        setMyRole('X');
        setOpponentName(toName);
        setOpponentPhoto(info.guestPhoto ?? null);
        setOpponentAvatarId(info.guestAvatarId ?? null);
        setGameStarted(true);
        setInGameStatus(true);
        startNewSession(info.roomCode);
        listenToRoom(info.roomCode);
        setScreen('multiplayerGame');

        database().ref(`/sentInvitations/${myName}/${toName}`).remove();
        database().ref(`/invitations/${toName}/${myName}`).remove();
      } else if (info.status === 'expired') {
        setMultiplayerError(`Invitation to ${toName} expired.`);
        database().ref(`/sentInvitations/${myName}/${toName}`).remove();
      }
    });
  });
};

  // Increments a win/loss/draw counter on the user's Firestore stats doc
  const updatePlayerStats = (
    uid: string | null,
    result: 'win' | 'loss' | 'draw',
  ) => {
    if (!uid) return;
    const field =
      result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draw';
    firestore()
      .collection('users')
      .doc(uid)
      .set(
        {
          [field]: firestore.FieldValue.increment(1),
        },
        { merge: true },
      )
      .catch(err => console.log('Stats update error:', err));
  };

  // Fetches wins/losses/draws from Firestore for the Player Profile screen
  const fetchPlayerStatsByUid = async (
    uid: string,
  ): Promise<{ wins: number; losses: number; draws: number }> => {
    try {
      const doc = await firestore().collection('users').doc(uid).get();
      const data = doc.data();
      return {
        wins: data?.wins ?? 0,
        losses: data?.losses ?? 0,
        draws: data?.draws ?? 0,
      };
    } catch (err) {
      console.log('fetchPlayerStatsByUid error:', err);
      return { wins: 0, losses: 0, draws: 0 };
    }
  };

  // Prefix search over the Firestore users collection, matching on
  // either username or name
  const searchPlayerByUsername = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const usernameQuery = firestore()
      .collection('users')
      .orderBy('username')
      .startAt(query)
      .endAt(query + '\uf8ff')
      .limit(15)
      .get();

    const nameQuery = firestore()
      .collection('users')
      .orderBy('name')
      .startAt(query)
      .endAt(query + '\uf8ff')
      .limit(15)
      .get();

    Promise.all([usernameQuery, nameQuery])
      .then(([usernameSnap, nameSnap]) => {
        const map = new Map<
          string,
          {
            uid: string;
            username: string;
            photo: string | null;
            avatarId: string | null;
          }
        >();

        [...usernameSnap.docs, ...nameSnap.docs].forEach(doc => {
          const data = doc.data();
          const displayIdentifier = data.username || data.name;
          if (!displayIdentifier || displayIdentifier === myName) return;
          if (!map.has(doc.id)) {
            map.set(doc.id, {
              uid: doc.id,
              username: displayIdentifier,
              photo: data.photoURL ?? null,
              avatarId: data.avatarId ?? null,
            });
          }
        });

        setSearchResults(Array.from(map.values()));
      })
      .catch(err => {
        console.log('searchPlayerByUsername error:', err);
        setSearchResults([]);
      });
  };

  // ============ RANDOM MATCH ============

  const cancelRandomMatch = () => {
    if (randomMatchRef.current) {
      randomMatchRef.current.off();
      randomMatchRef.current.onDisconnect().cancel();
      randomMatchRef.current.remove();
      randomMatchRef.current = null;
    }
    setRandomMatchStatus('idle');
  };

  // Matches this player against a waiting candidate in /matchmaking, or
  // joins the queue and waits to be matched
  const findRandomMatch = () => {
    if (!myName) return;
    const myUid = auth().currentUser?.uid;
    if (!myUid) return;

    cancelRandomMatch();

    setRandomMatchStatus('searching');

    const queueRef = database().ref('/matchmaking');
    const MATCH_QUEUE_TTL = 20 * 1000;

    queueRef.once('value').then(snapshot => {
      const data = snapshot.val() || {};
      const now = Date.now();
      const staleUpdates: Record<string, null> = {};

      let candidateUid: string | null = null;
      for (const uid of Object.keys(data)) {
        if (uid === myUid) continue;
        const entry = data[uid];
        if (entry?.status !== 'waiting') continue;

        const ts = entry?.timestamp ?? 0;
        if (ts && now - ts > MATCH_QUEUE_TTL) {
          // Stale/ghost entry — don't match against it, queue for deletion
          staleUpdates[`/matchmaking/${uid}`] = null;
          continue;
        }

        candidateUid = uid;
        break;
      }

      if (Object.keys(staleUpdates).length > 0) {
        database()
          .ref()
          .update(staleUpdates)
          .catch(err =>
            console.log('Ghost matchmaking cleanup FAILED:', err.message),
          );
      }

      if (candidateUid) {
        const candidateRef = database().ref(`/matchmaking/${candidateUid}`);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        candidateRef
          .transaction(current => {
            if (current && current.status === 'waiting') {
              return {
                ...current,
                status: 'matched',
                roomCode: code,
                matchedWithUid: myUid,
                matchedWithName: myName,
                matchedWithPhoto: myPhoto ?? null,
                matchedWithAvatarId: myAvatarId ?? null,
              };
            }
            return undefined; // abort — someone else already claimed this candidate
          })
          .then(result => {
            const won =
              result.committed &&
              result.snapshot.val()?.status === 'matched' &&
              result.snapshot.val()?.matchedWithUid === myUid;

            if (won) {
              const opponentData = result.snapshot.val();
              const ref = database().ref(`/rooms/${code}`);
              roomRef.current = ref;
              ref
                .set({
                  roomName: `${myName} vs ${opponentData.name}`,
                  host: myName,
                  hostUid: myUid,
                  hostPhoto: myPhoto ?? null,
                  hostAvatarId: myAvatarId ?? null,
                  guest: opponentData.name,
                  guestUid: candidateUid,
                  guestPhoto: opponentData.photoURL ?? null,
                  guestAvatarId: opponentData.avatarId ?? null,
                  board: Array(9).fill(null),
                  currentTurn: 'X',
                  lastFirst: 'X',
                  winner: null,
                  isDraw: false,
                  status: 'playing',
                  isRandomMatch: true,
                })
                .then(() => {
                  // Disconnect on this (host) side removes the room
                  ref.onDisconnect().remove();

                  setRoomCodeState(code);
                  setMyRole('X');
                  setOpponentName(opponentData.name);
                  setOpponentPhoto(opponentData.photoURL ?? null);
                  setOpponentAvatarId(opponentData.avatarId ?? null);
                  setGameStarted(true);
                  setInGameStatus(true);
                  startNewSession(code);
                  listenToRoom(code);

                  setRandomMatchStatus('found');
                  setTimeout(() => {
                    setScreen('multiplayerGame');
                    setRandomMatchStatus('idle');
                  }, 1500);
                })
                .catch(err => {
                  console.log('Room creation FAILED:', err.message);
                  setMultiplayerError('Failed to create match. Try again.');
                  setRandomMatchStatus('idle');
                });
            } else {
              // Someone else grabbed this candidate first — try again
              // (either find another candidate or fall back to waiting)
              findRandomMatch();
            }
          });
      } else {
        const myRef = database().ref(`/matchmaking/${myUid}`);
        randomMatchRef.current = myRef;

        // Auto-cleanup the matchmaking queue entry on disconnect —
        // otherwise it stays as a "waiting" ghost entry in the queue.
        myRef.onDisconnect().remove();

        myRef.set({
          name: myName,
          photoURL: myPhoto ?? null,
          avatarId: myAvatarId ?? null,
          status: 'waiting',
          timestamp: database.ServerValue.TIMESTAMP,
        });

        myRef.on('value', snap => {
          const val = snap.val();
          if (val?.status === 'matched' && val.roomCode) {
            myRef.off();
            myRef.onDisconnect().cancel();
            myRef.remove();
            randomMatchRef.current = null;

            const code = val.roomCode;
            roomRef.current = database().ref(`/rooms/${code}`);

            // Guest (matched) side: remove the room if this player disconnects
            roomRef.current.onDisconnect().cancel();

            setRoomCodeState(code);
            setMyRole('O');
            setOpponentName(val.matchedWithName ?? 'Opponent');
            setOpponentPhoto(val.matchedWithPhoto ?? null);
            setOpponentAvatarId(val.matchedWithAvatarId ?? null);
            setGameStarted(true);
            setInGameStatus(true);
            startNewSession(code);
            listenToRoom(code);

            setRandomMatchStatus('found');
            setTimeout(() => {
              setScreen('multiplayerGame');
              setRandomMatchStatus('idle');
            }, 1500);
          }
        });
      }
    });
  };

  return {
    board,
    currentPlayer,
    winner,
    isDraw,
    screen,
    setScreen,
    myName,
    setMyName,
    roomName,
    setRoomName,
    onlineStatus,
    roomCode,
    joinCode,
    listenToSentInvitations,
    setJoinCode,
    generateRoomCode,
    joinRoom,
    joinRoomWithCode,
    allRooms,
    fetchAllRooms,
    stopFetchingAllRooms,
    handlePress,
    handleMultiplayerPress,
    resetGame,
    leaveRoom,
    myRole,
    leaderboard,
    fetchLeaderboard,
    opponentName,
    opponentPhoto,
    opponentAvatarId,
    isMyTurn,
    multiplayerError,
    gameStarted,
    recentOpponents,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    incomingInvitations,
    listenToInvitations,
    fetchRecentOpponents,
    randomMatchStatus,
    findRandomMatch,
    cancelRandomMatch,
    gameFriends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    incomingFriendRequests,
    listenToFriendRequests,
    fetchGameFriends,
    removeFriend,
    fetchPlayerStatsByUid,
    searchPlayerByUsername,
    searchResults,
    recordGameResult,
    startNewSession,
    matchHistory,
    fetchMatchHistory,
    requestRematch,
    myRematchRequested,
    opponentRematchRequested,
    updateLeaderboardName,
    renameUsernameEverywhere,
    roomIsPrivate,
    updateRoomPrivacy,
     startEventMatch,   
    eventMatchOver,
    leaveEventRoom,
     forfeitEventMatch,
      isEventMatch,
  eventInfo,
   INVITE_TTL_MS
  };
};

export default GameLogic;