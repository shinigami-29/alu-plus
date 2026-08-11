import React, { useState, useRef, useEffect } from 'react';
import { Player, BoxCell, Screen } from './Type';
import database, {
  FirebaseDatabaseTypes,
} from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const listenedCodeRef: { current: string | null } = { current: null };
const recordedResultKeyRef: { current: string | null } = { current: null };
const activeSessionKeyRef: { current: string | null } = { current: null };
const sessionStatsRef: {
  current: { wins: number; losses: number; draws: number };
} = { current: { wins: 0, losses: 0, draws: 0 } };
const isLeavingRef: { current: boolean } = { current: false }; 

const GameLogic = (myAvatarId?: string | null, myPhoto?: string | null) => {
  const [board, setBoard] = useState<BoxCell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | null>(null);
  const [screen, setScreen] = useState<Screen>('Start');

  const [myName, setMyName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
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
  // const [recentOpponents, setRecentOpponents] = useState<string[]>([]);
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

  // match historu reset
  const MATCH_HISTORY_THRESHOLD = 20;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;


  // ROOM LIST (LOBBY) — waiting + playing both status haru
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
    }[]
  >([]);

  const [incomingInvitations, setIncomingInvitations] = useState<
    {
      from: string;
      status: string;
      fromAvatarId: string | null;
      fromPhoto: string | null;
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

  // myRole — Firebase listener (listenToRoom) jasto stale-closure hune
  // ठाउँमा sadhai latest value padhna paos bhanera myRoleRef pani राखेको।
  // when setMyRole() is call both state and ref both will be  sync.
  const [myRole, setMyRoleState] = useState<'X' | 'O' | null>(null);
  const myRoleRef = useRef<'X' | 'O' | null>(null);
  const setMyRole = (role: 'X' | 'O' | null) => {
    myRoleRef.current = role;
    setMyRoleState(role);
  };

  // const isLeavingRef: { current: boolean } = { current: false };
  const processingMoveRef: { current: boolean } = { current: false }; 

  const [opponentName, setOpponentName] = useState('');
  const [opponentPhoto, setOpponentPhoto] = useState<string | null>(null);
  // opponent ko avatarId pani track garne — room data ra invitation/random match dubai bata aauna sakcha
  const [opponentAvatarId, setOpponentAvatarId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [multiplayerError, setMultiplayerError] = useState('');

  // REMATCH tracking — if both players agree to rematch then only board reset
  const [myRematchRequested, setMyRematchRequested] = useState(false);
  const [opponentRematchRequested, setOpponentRematchRequested] =
    useState(false);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const presenceRefsRef = useRef<
    Record<string, FirebaseDatabaseTypes.Reference>
  >({});

  // MATCH HISTORY (session-based)
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

  // RANDOM MATCH state
  const [randomMatchStatus, setRandomMatchStatus] = useState<
    'idle' | 'searching' | 'found'
  >('idle');
  const randomMatchRef = useRef<FirebaseDatabaseTypes.Reference | null>(null);

  const roomRef = useRef<FirebaseDatabaseTypes.Reference | null>(null);

   const hostUidRef = useRef<string | null>(null);
  const guestUidRef = useRef<string | null>(null);
  const currentSessionRecordRef: { current: FirebaseDatabaseTypes.Reference | null } = { current: null };

  const lastLocalFirstRef = useRef<Player>('X');
  // USERNAME SEARCH state
  const [searchResults, setSearchResults] = useState<
    {
      uid: string;
      username: string;
      photo: string | null;
      avatarId: string | null;
    }[]
  >([]);

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

  const handlePress = (index: number): void => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const win = checkwin(newBoard);

    setBoard(newBoard);
    setWinner(win);

    setCurrentPlayer(currentPlayer => (currentPlayer === 'X' ? 'O' : 'X'));
  };

  const resetGame = () => {
    const nextFirst: Player = lastLocalFirstRef.current === 'X' ? 'O' : 'X';
    lastLocalFirstRef.current = nextFirst;
    setBoard(Array(9).fill(null));
    // setCurrentPlayer('X');
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

  // CREATE ROOM
  const generateRoomCode = (): void => {
    if (!myName || myName === 'undefined' || myName.trim() === '') return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const ref = database().ref(`/rooms/${code}`);

    ref
      .once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          generateRoomCode();
          return;
        }

        roomRef.current = ref;

        // ref
        //   .set({
        //     roomName: roomName || `${myName}'s Room`,
        //     host: myName,
        //     hostUid: auth().currentUser?.uid ?? null,
        //     // hostPhoto: auth().currentUser?.photoURL ?? null,
        //     hostPhoto: myPhoto ?? null,
        //     hostAvatarId: myAvatarId ?? null,
        //     guest: null,
        //     guestUid: null,
        //     guestPhoto: null,
        //     guestAvatarId: null,
        //     board: Array(9).fill(null),
        //     currentTurn: 'X',
        //     lastFirst: 'X',
        //     winner: null,
        //     isDraw: false,
        //     status: 'waiting',
        //   })
        //   .then(() => {
        //     // Auto-remove the room if host disconnects (app close, crash, or
        //     // network loss) — otherwise it stays stuck in "waiting"/"playing"
        //     // state and shows up as a zombie room in RoomListScreen even after
        //     // refresh, since the data never gets cleaned up.
        //     ref.onDisconnect().remove();
        //     ref.onDisconnect().remove();

        //     setRoomCode(code);
        //     setMyRole('X');
        //     setIsMyTurn(true);
        //     setOpponentAvatarId(null);
        //     startNewSession(code);

        //     listenToRoom(code);

        //     setScreen('waiting');
        //   });
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
          })
          .then(() => {
            // Host disconnect huda (app close/crash/net loss) room
            // automatically hataune — natra "waiting"/"playing" state ma
            // zombie room basirahancha ra RoomListScreen ma purano room
            // dekhiraincha (refresh garda pani hatdaina, kina ki database
            // ma data nai stuck cha)
            ref.onDisconnect().remove();

            setRoomCode(code);
            setMyRole('X');
            setIsMyTurn(true);
            setOpponentAvatarId(null);
            startNewSession(code);

            listenToRoom(code);

            setScreen('waiting');
          });
      })
      .catch(err => console.log(err));
  };

  // JOIN ROOM
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

          // // Guest side pani disconnect huda room hataune — natra
          // // guest crash/net-loss huda room "playing" ma stuck rahancha
          // ref.onDisconnect().remove();
          if (isHost) {
            // Host rejoin bhako ho — host disconnect huda room nai
            // hataune (jasto generateRoomCode ma cha)
            ref.onDisconnect().remove();
          } else {
            // Guest disconnect huda pura room hataaunu hudaina — host
            // aile pani active hunsakcha. Guest field matra clear garne
            ref.onDisconnect().update({
              guest: null,
              guestUid: null,
              guestPhoto: null,
              guestAvatarId: null,
              status: 'waiting',
            });
          }

          setRoomCode(joinCode);
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
          startNewSession(joinCode);
          listenToRoom(joinCode);
          setScreen('multiplayerGame');
        });
    });
    // .catch(err => console.log(err));
  };

  // JOIN ROOM BY EXPLICIT CODE
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

            // Guest side pani disconnect huda room hataune
            ref.onDisconnect().remove();

            setRoomCode(code);
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
            startNewSession(code);
            listenToRoom(code);
            setScreen('multiplayerGame');
          });
      })
      .catch(err => console.log(err));
  };

  // ROOM LIST (LOBBY)
  // ROOM LIST (LOBBY)
const fetchAllRooms = () => {
  database()
    .ref('/rooms')
    .once('value')
    .then(snapshot => {
      const data = snapshot.val();
      if (!data) {
        setAllRooms([]);
        return;
      }

      const cleanupUpdates: Record<string, null> = {};

      const list = Object.keys(data)
        .filter(code => {
          const room = data[code];
          // Corrupt/ghost room — host missing bhaye tyo invalid data ho,
          // delete garne list ma thapne ani result bata bahira nikalne
          if (!room?.host) {
            cleanupUpdates[`/rooms/${code}`] = null;
            return false;
          }
          return true;
        })
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

      // Ghost room haru pheला fetch garda nai automatically delete garने
      if (Object.keys(cleanupUpdates).length > 0) {
        database()
          .ref()
          .update(cleanupUpdates)
          .then(() => console.log('Cleaned up ghost rooms:', Object.keys(cleanupUpdates)))
          .catch(err => console.log('Ghost room cleanup FAILED:', err.message));
      }
    });
};

  // FIREBASE LISTENER
  const  listenToRoom = (code: string) => {
    if (listenedCodeRef.current === code && roomRef.current) {
      console.log('Skipping duplicate listenToRoom for', code);
      return;
    }

    listenedCodeRef.current = code;

    if (!roomRef.current) {
      roomRef.current = database().ref(`/rooms/${code}`);
    }

    roomRef.current.off();

    roomRef.current.on('value', snap => {
      const data = snap.val();

      if (!data) return;

      setBoard(normalizeBoard(data.board));
      hostUidRef.current = data.hostUid ?? null;   
      guestUidRef.current = data.guestUid ?? null;
      setCurrentPlayer(data.currentTurn ?? 'X');
      setWinner(data.winner ?? null);

      if (!data.winner && !data.isDraw) {
        recordedResultKeyRef.current = null;
      } else {
        const resultKey = `${code}:${data.winner ?? 'draw'}`;
        if (recordedResultKeyRef.current !== resultKey) {
          recordedResultKeyRef.current = resultKey;
          const currentRole = myRoleRef.current;
             const opponent = data.host === myName ? data.guest : data.host;
          if (data.isDraw) {
            recordGameResult('draw');
          } else if (currentRole) {
            recordGameResult(data.winner === currentRole ? 'win' : 'loss');
          }
          if (myName && opponent) {
            saveSessionMatchRecord(opponent, code);
          }
        }
      }

      if (data.status === 'playing') {
        setGameStarted(true);
        setScreen('multiplayerGame');
      }

      const opponent = data.host === myName ? data.guest : data.host;
      setOpponentName(opponent);

      const oppPhoto = data.host === myName ? data.guestPhoto : data.hostPhoto;
      setOpponentPhoto(oppPhoto ?? null);

      // opponent ko avatarId — host/guest jo huncha teskoo pheri track garne
      const oppAvatarId =
        data.host === myName ? data.guestAvatarId : data.hostAvatarId;
      setOpponentAvatarId(oppAvatarId ?? null);

      const currentRole = myRoleRef.current;

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

  // const handleMultiplayerPress = (i: number) => {
  //   if (!roomRef.current || !myRole) return;
  //   if (board[i] || winner) return;
  //   if (!isMyTurn) return;
  //   if (processingMoveRef.current) return; // block double-tap / duplicate fire
  //   processingMoveRef.current = true;

  //   roomRef.current
  //     .once('value')
  //     .then(snapshot => {
  //       const data = snapshot.val();

  //       if (data.currentTurn !== myRole) return;

  //       const newBoard = normalizeBoard(data.board);
  //       newBoard[i] = myRole;

  //       const win = checkwin(newBoard);
  //       const draw = newBoard.every(c => c !== null) && !win;

  //       if (win) {
  //         updateLeaderboard(myName);

  //         const winnerUid = win === 'X' ? data.hostUid : data.guestUid;
  //         const loserUid = win === 'X' ? data.guestUid : data.hostUid;

  //         if (!winnerUid || !loserUid) {
  //           console.error('Missing UID for stats update:', {
  //             winnerUid,
  //             loserUid,
  //             data,
  //           });
  //         }

  //         updatePlayerStats(winnerUid, 'win');
  //         updatePlayerStats(loserUid, 'loss');
  //       } else if (draw) {
  //         updatePlayerStats(data.hostUid, 'draw');
  //         updatePlayerStats(data.guestUid, 'draw');
  //       }

  //       const nextTurn: Player = myRole === 'X' ? 'O' : 'X';

  //       return roomRef.current?.update({
  //         board: newBoard,
  //         currentTurn: win || draw ? null : nextTurn,
  //         winner: win ?? null,
  //         isDraw: draw,
  //       });
  //     })
  //     .catch(err => console.log('handleMultiplayerPress error:', err.message))
  //     .finally(() => {
  //       processingMoveRef.current = false; // unlock once this move is fully processed
  //     });
  // };

  const handleMultiplayerPress = (i: number) => {
    if (!roomRef.current || !myRole) return;
    if (board[i] || winner) return;
    if (!isMyTurn) return;
    if (processingMoveRef.current) return; // block double-tap / duplicate fire
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

  // setuooresence

  const setupPresence = () => {
    if (!myName) return undefined;

    const myStatusRef = database().ref(`/status/${myName}`);
    const connectedRef = database().ref('.info/connected');

    const onConnectedChange = (snap: FirebaseDatabaseTypes.DataSnapshot) => {
      if (snap.val() === false) return;

      myStatusRef
        .onDisconnect()
        .set({
          state: 'offline',
          last_changed: database.ServerValue.TIMESTAMP,
        })
        .then(() => {
          myStatusRef.set({
            state: 'online',
            last_changed: database.ServerValue.TIMESTAMP,
          });
        })
        .catch(err => console.log('setupPresence onConnectedChange FAILED:', err.message));
    };

    connectedRef.on('value', onConnectedChange);
    return () => {
      connectedRef.off('value', onConnectedChange);

      if (!auth().currentUser) return;
      myStatusRef.set({
        state: 'offline',
        last_changed: database.ServerValue.TIMESTAMP,
      })
      .catch(err => console.log('setupPresence cleanup FAILED:', err.message));
    }
  };

  const listenToPresence = (names: string[]) => {
    // purano listeners hataune jun ab list ma chaina
    Object.keys(presenceRefsRef.current).forEach(name => {
      if (!names.includes(name)) {
        presenceRefsRef.current[name].off();
        delete presenceRefsRef.current[name];
      }
    });

    names.forEach(name => {
      if (presenceRefsRef.current[name]) return; // pahile dekhi nai sunirakheko

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

  // LEAVE
  const leaveRoom = () => {
    console.log('leaveRoom() called, roomRef exists:', !!roomRef.current);

    if (!roomRef.current || isLeavingRef.current) return;
    isLeavingRef.current = true;

    if (opponentName && myName && opponentName !== myName) {
      // saveSessionMatchRecord(opponentName, roomCode);

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

    // Explicitly leave garda pahile pending onDisconnect hook cancel garne —
    // natra room already manually remove vaisakepachi, purano onDisconnect
    // hook le arko naya room (same ref reuse vaye) lai galat hataauna sakcha
    // roomRef.current.onDisconnect().cancel();

    // roomRef.current
    //   .remove()
    //   .then(() => console.log('Room removed successfully'))
    //   .catch(err => console.log('Room remove FAILED:', err.message));

    // Cancel any pending onDisconnect hook first, then remove/update
    // the room — avoids a race between the manual action and the
    // onDisconnect hook both firing
    currentRef
      .onDisconnect()
      .cancel()
      .then(() => {
        if (myRole === 'X') {
          // Host: delete the whole room
          return currentRef.remove();
        } else {
          // Guest: keep the room alive, just clear my own fields
          return currentRef.update({
            guest: null,
            guestUid: null,
            guestPhoto: null,
            guestAvatarId: null,
            status: 'waiting',
          });
        }
      })
      .then(() => console.log('leaveRoom cleanup successful'))
      .catch(err => console.log('leaveRoom cleanup FAILED:', err.message));

    // roomRef.current?.off();
    currentRef.off();

    roomRef.current = null;
    listenedCodeRef.current = null;
    recordedResultKeyRef.current = null;
    // session bandh bhako mark garne — arko naya room/invite le matra
    // naya session start garna paos
    activeSessionKeyRef.current = null;

    setMyRole(null);
    setOpponentName('');
    setOpponentPhoto(null);
    setOpponentAvatarId(null);
    setRoomCode('');
    setJoinCode('');
    setGameStarted(false);
    setMyRematchRequested(false);
    setOpponentRematchRequested(false);

    resetGame();

    setScreen('Mode');

    isLeavingRef.current = false;
  };

  const isDraw = board.every(c => c !== null) && !winner;

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

  const renameUsernameEverywhere = (oldName: string, newName: string) => {
  if (!oldName || !newName || oldName === newName) return;

  const db = database();
  const updates: Record<string, any> = {};

  // ---- recentOpponents migrate garne ----
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

  // ---- gameFriends migrate garne ----
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

  // ---- presence/status migrate garne ----
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

  Promise.all([recentPromise, friendsPromise, statusPromise, matchHistoryPromise])
    .then(() => {
      if (Object.keys(updates).length === 0) return null;
      return db.ref().update(updates);
    })
    .then(() => {
      updateLeaderboardName(newName);
      console.log('Username migration complete:', oldName, '->', newName);
    })
    .catch(err => console.log('renameUsernameEverywhere FAILED:', err.message));
};

  const updateLeaderboardName = (newName: string) => {
  const uid = auth().currentUser?.uid ?? null;
  if (!uid) return;
  const weekKey = getCurrentWeekKey();
  const lbRef = database().ref(`/leaderboard/${weekKey}/${uid}`);
  lbRef.once('value').then(snap => {
    if (snap.exists()) {
      lbRef
        .update({ name: newName, avatarId: myAvatarId ?? null,
          photo: myPhoto ?? null, })
        .catch(err => console.log('Leaderboard name update FAILED:', err.message));
    }
    // entry छैन भने केही गर्दैन — user ले अझै कुनै game जितेको छैन
  });
};
  // MATCH HISTORY helpers
  const startNewSession = (code: string) => {
    if (activeSessionKeyRef.current === code) {
      console.log('Session already active for', code, '— skipping reset');
      return;
    }
    activeSessionKeyRef.current = code;
    sessionStatsRef.current = { wins: 0, losses: 0, draws: 0 };
    recordedResultKeyRef.current = null;
      currentSessionRecordRef.current = null; //👈
  };

  const recordGameResult = (result: 'win' | 'loss' | 'draw') => {
    console.log('recordGameResult called:', result);
    if (result === 'win') sessionStatsRef.current.wins += 1;
    else if (result === 'loss') sessionStatsRef.current.losses += 1;
    else sessionStatsRef.current.draws += 1;
  };

  // const saveSessionMatchRecord = (opponent: string, code: string) => {
  //   if (!myName) return;
  //   const stats = sessionStatsRef.current;
  //   const totalGames = stats.wins + stats.losses + stats.draws;
  //   if (totalGames === 0) return;

  //   const recordRef = database().ref(`/matchHistory/${myName}`).push();
  //   recordRef.set({
  //     opponent: opponent || 'Unknown',
  //     wins: stats.wins,
  //     losses: stats.losses,
  //     draws: stats.draws,
  //     totalGames,
  //     roomCode: code,
  //     timestamp: database.ServerValue.TIMESTAMP,
  //   });
  // };

//   const saveSessionMatchRecord = (opponent: string, code: string) => {
//   if (!myName) return;
//   const stats = sessionStatsRef.current;
//   const totalGames = stats.wins + stats.losses + stats.draws;
//   if (totalGames === 0) return;

//   const rootRef = database().ref(`/matchHistory/${myName}`);

//   rootRef
//     .once('value')
//     .then(snap => {
//       const data = snap.val();
//       const records = data?.records ?? {};
//       const cycleStartedAt = data?.cycleStartedAt ?? null;
//       const count = Object.keys(records).length;
//       const now = Date.now();

//       const shouldReset =
//         !cycleStartedAt ||
//         (count > MATCH_HISTORY_THRESHOLD
//           ? now - cycleStartedAt >= ONE_WEEK_MS
//           : now - cycleStartedAt >= TWO_WEEKS_MS);

//       const writeNewRecord = () => {
//         const newRecordRef = database()
//           .ref(`/matchHistory/${myName}/records`)
//           .push();
//         return newRecordRef.set({
//           opponent: opponent || 'Unknown',
//           wins: stats.wins,
//           losses: stats.losses,
//           draws: stats.draws,
//           totalGames,
//           roomCode: code,
//           timestamp: database.ServerValue.TIMESTAMP,
//         });
//       };

//       if (shouldReset) {
//         // purano cycle हटाएर नयाँ cycle सुरु गर्ने
//         return rootRef
//           .set({
//             cycleStartedAt: database.ServerValue.TIMESTAMP,
//             records: {},
//           })
//           .then(() => writeNewRecord());
//       }

//       return writeNewRecord();
//     })
//     .catch(err => console.log('saveSessionMatchRecord FAILED:', err.message));
// };

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
      .catch(err => console.log('saveSessionMatchRecord update FAILED:', err.message));
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
        const newRecordRef = database().ref(`/matchHistory/${myName}/records`).push();
        currentSessionRecordRef.current = newRecordRef;
        return newRecordRef.set(recordData);
      };

      if (shouldReset) {
        return rootRef
          .set({ cycleStartedAt: database.ServerValue.TIMESTAMP, records: {} })
          .then(() => createRecord());
      }
      return createRecord();
    })
    .catch(err => console.log('saveSessionMatchRecord FAILED:', err.message));
}; //👈


  // const fetchMatchHistory = () => {
  //   if (!myName) return;
  //   database()
  //     .ref(`/matchHistory/${myName}`)
  //     .orderByChild('timestamp')
  //     .limitToLast(50)
  //     .once('value')
  //     .then(snapshot => {
  //       const data = snapshot.val();
  //       if (!data) {
  //         setMatchHistory([]);
  //         return;
  //       }
  //       const list = Object.values(data) as {
  //         opponent: string;
  //         wins: number;
  //         losses: number;
  //         draws: number;
  //         totalGames: number;
  //         roomCode: string;
  //         timestamp: number;
  //       }[];
  //       list.sort((a, b) => b.timestamp - a.timestamp);
  //       setMatchHistory(list);
  //     });
  // };

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
            name:entry?.name ?? key,
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

  const sendInvitation = (toName: string) => {
    console.log('=== sendInvitation called ===');
    console.log('myName:', JSON.stringify(myName));
    console.log('toName:', JSON.stringify(toName));

    if (!myName || !toName) {
      console.log('BLOCKED: myName or toName is empty');
      return;
    }
    if (toName === myName) {
      console.log('BLOCKED: same name');
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

  const acceptInvitation = (fromName: string) => {
    if (!myName) return;

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
        updates[`/sentInvitations/${fromName}/${myName}/status`] = 'accepted';
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
                hostUid: hostUid,
                hostPhoto: hostPhoto,
                hostAvatarId: hostAvatarId,
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
                // Yo (guest/accepter) side bata disconnect huda room hataune
                ref.onDisconnect().remove();

                setRoomCode(code);
                setMyRole('O');
                setOpponentName(fromName);
                setOpponentPhoto(hostPhoto);
                setOpponentAvatarId(hostAvatarId);
                setGameStarted(true);
                startNewSession(code);
                listenToRoom(code);
                setScreen('multiplayerGame');
              });
          });
      })
      .catch(err => console.log('Accept invitation error:', err));
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
        // const myPhoto = auth().currentUser?.photoURL ?? null;

        const updates: Record<string, any> = {};

        // yo side ma "fromName" mero friend banyo — uski avatarId "fromAvatarId" ho
        updates[`/gameFriends/${myName}/${fromName}`] = {
          name: fromName,
          uid: fromUid,
          photo: fromPhoto,
          avatarId: fromAvatarId,
          timestamp: database.ServerValue.TIMESTAMP,
        };
        // udhi side ma "myName" uski friend banyo — mero avatarId "myAvatarId" ho
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
    database()
      .ref(`/friendRequests/${myName}`)
      .on('value', snap => {
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
          }));
        setIncomingFriendRequests(list.filter(i => i.status === 'pending'));
      });
  };

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
          return {
            name: liveData?.username ?? displayName,
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

  const listenToInvitations = () => {
    if (!myName) return;
    database()
      .ref(`/invitations/${myName}`)
      .on('value', snap => {
        const data = snap.val();
        if (!data) {
          setIncomingInvitations([]);
          return;
        }

        const list = Object.keys(data)
          .filter(from => from !== myName)
          .map(from => ({
            from,
            status: data[from].status,
            fromAvatarId: data[from]?.fromAvatarId ?? null,
            fromPhoto: data[from]?.fromPhoto ?? null,
          }));
        setIncomingInvitations(list.filter(i => i.status === 'pending'));
      });
  };

  const listenToSentInvitations = () => {
    if (!myName) return;
    database()
      .ref(`/sentInvitations/${myName}`)
      .on('value', snap => {
        const data = snap.val();
        if (!data) return;

        Object.keys(data).forEach(toName => {
          const info = data[toName];
          if (info.status === 'accepted' && info.roomCode) {
            roomRef.current = database().ref(`/rooms/${info.roomCode}`);

            // Yo (host, jasले sentInvitations bata match join garcha) side
            // pani disconnect huda room hataune
            roomRef.current.onDisconnect().remove();

            setRoomCode(info.roomCode);
            setMyRole('X');
            setOpponentName(toName);
            setOpponentPhoto(info.guestPhoto ?? null);
            setOpponentAvatarId(info.guestAvatarId ?? null);
            setGameStarted(true);
            startNewSession(info.roomCode);
            listenToRoom(info.roomCode);
            setScreen('multiplayerGame');

            database().ref(`/sentInvitations/${myName}/${toName}`).remove();
            database().ref(`/invitations/${toName}/${myName}`).remove();
          }
        });
      });
  };

  // updatePlayerStats — 'draw' pani track garcha (Firestore users/{uid})
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

  // PLAYER STATS — Player Profile screen ko lagi Firestore bata
  // wins/losses/draws nikaalne
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

  // USERNAME SEARCH — Firestore users collection maathi prefix search
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
        { uid: string; username: string; photo: string | null; avatarId: string | null }
      >();

      [...usernameSnap.docs, ...nameSnap.docs].forEach(doc => {
        const data = doc.data();
        if (!data.username || data.username === myName) return;
        if (!map.has(doc.id)) {
          map.set(doc.id, {
            uid: doc.id,
            username: data.username,
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

  const findRandomMatch = () => {
    if (!myName) return;
    const myUid = auth().currentUser?.uid;
    if (!myUid) return;

    cancelRandomMatch();

    setRandomMatchStatus('searching');

    const queueRef = database().ref('/matchmaking');

    queueRef.once('value').then(snapshot => {
      const data = snapshot.val() || {};

      const candidateUid = Object.keys(data).find(
        uid => uid !== myUid && data[uid]?.status === 'waiting',
      );

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
                matchedWithName: myName,
                matchedWithPhoto: myPhoto ?? null,
                matchedWithAvatarId: myAvatarId ?? null,
              };
            }
            return current;
          })
          .then(result => {
            if (
              result.committed &&
              result.snapshot.val()?.status === 'matched'
            ) {
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
                })
                .then(() => {
                  // Disconnect huda room hataune
                  ref.onDisconnect().remove();

                  setRoomCode(code);
                  setMyRole('X');
                  setOpponentName(opponentData.name);
                  setOpponentPhoto(opponentData.photoURL ?? null);
                  setOpponentAvatarId(opponentData.avatarId ?? null);
                  setGameStarted(true);
                  startNewSession(code);
                  listenToRoom(code);

                  setRandomMatchStatus('found');
                  setTimeout(() => {
                    setScreen('multiplayerGame');
                    setRandomMatchStatus('idle');
                  }, 1500);
                });
            } else {
              findRandomMatch();
            }
          });
      } else {
        const myRef = database().ref(`/matchmaking/${myUid}`);
        randomMatchRef.current = myRef;

        // Matchmaking queue entry pani disconnect huda auto-cleanup —
        // natra queue ma "waiting" ko rup ma ghost entry basirahancha
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

            // Guest (matched) side bata disconnect huda room hataune
            roomRef.current.onDisconnect().remove();

            setRoomCode(code);
            setMyRole('O');
            setOpponentName(val.matchedWithName ?? 'Opponent');
            setOpponentPhoto(val.matchedWithPhoto ?? null);
            setOpponentAvatarId(val.matchedWithAvatarId ?? null);
            setGameStarted(true);
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
  };
};

export default GameLogic;
