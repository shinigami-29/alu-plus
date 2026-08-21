// import database from '@react-native-firebase/database';
// import auth from '@react-native-firebase/auth';
// import { Player } from '../Game2/Type';
// import { SharedState } from './useSharedState';

// type RoomCallbacks = {
//   setInGameStatus: (inGame: boolean, roomCode?: string) => void;
//   startNewSession: (code: string) => void;
//   onWin: (winner: Player, hostUid: string | null, guestUid: string | null) => void;
//   onDraw: (hostUid: string | null, guestUid: string | null) => void;
//   isEventMatchActive: () => boolean;
//   onEventRoomSnapshot?: (data: any) => void; // forwarded to useEventMatch on every room update
// };

// export const useRoomConnection = (
//   shared: SharedState,
//   myPhoto: string | null | undefined,
//   myAvatarId: string | null | undefined,
//   callbacks: RoomCallbacks,
// ) => {
//   const {
//     myName, roomName, joinCode, opponentName, opponentPhoto, opponentAvatarId,
//     myRole, myRoleRef, setMyRole,
//     board, setBoard, setCurrentPlayer, setWinner,
//     setRoomCodeState,
//     setRoomIsPrivate,
//     setOpponentName, setOpponentPhoto, setOpponentAvatarId,
//     setIsMyTurn, setGameStarted, gameStartedRef,
//     setMultiplayerError,
//     setMyRematchRequested,
//     setOpponentRematchRequested,
//     roomRef, hostUidRef, guestUidRef,
//     listenedCodeRef, roomHasLoadedRef, guestWasPresentRef, lastRoomDataRef,
//     opponentLeftTimeoutRef, isLeavingRef, creatingRoomRef, processingMoveRef,
//     setScreen,
//   } = shared;

//   // 1. Converts Firebase's array-or-object board shape into a fixed 9-cell array
//   const normalizeBoard = (data: any) => {
//     const fixed: any[] = Array(9).fill(null);
//     if (Array.isArray(data)) {
//       data.forEach((v, i) => (fixed[i] = v ?? null));
//       return fixed;
//     }
//     if (data && typeof data === 'object') {
//       Object.keys(data).forEach(k => (fixed[Number(k)] = data[k]));
//     }
//     return fixed;
//   };

//   const checkwin = (b: any[]): Player | null => {
//     const lines = [
//       [0, 1, 2], [3, 4, 5], [6, 7, 8],
//       [0, 3, 6], [1, 4, 7], [2, 5, 8],
//       [0, 4, 8], [2, 4, 6],
//     ];
//     for (const [a, b1, c] of lines) {
//       if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a] as Player;
//     }
//     return null;
//   };

//   // 2. Creates a new room with a random 6-digit code, retrying on collision
//   const generateRoomCode = (isPrivate: boolean = false): void => {
//     if (!myName || myName === 'undefined' || myName.trim() === '') return;
//     if (roomRef.current || creatingRoomRef.current) return;
//     creatingRoomRef.current = true;

//     const code = Math.floor(100000 + Math.random() * 900000).toString();
//     const ref = database().ref(`/rooms/${code}`);

//     ref.once('value').then(snapshot => {
//       if (snapshot.exists()) {
//         creatingRoomRef.current = false;
//         generateRoomCode(isPrivate);
//         return;
//       }

//       roomRef.current = ref;
//       ref
//         .set({
//           roomName: roomName || `${myName}'s Room`,
//           host: myName,
//           hostUid: auth().currentUser?.uid ?? null,
//           hostPhoto: myPhoto ?? null,
//           hostAvatarId: myAvatarId ?? null,
//           guest: null,
//           guestUid: null,
//           guestPhoto: null,
//           guestAvatarId: null,
//           board: Array(9).fill(null),
//           currentTurn: 'X',
//           lastFirst: 'X',
//           winner: null,
//           isDraw: false,
//           status: 'waiting',
//           isPrivate,
//           createdAt: database.ServerValue.TIMESTAMP,
//         })
//         .then(() => {
//           ref.onDisconnect().remove();
//           setRoomCodeState(code);
//           setMyRole('X');
//           setIsMyTurn(true);
//           setOpponentAvatarId(null);
//           setRoomIsPrivate(isPrivate);
//           callbacks.setInGameStatus(true);
//           callbacks.startNewSession(code);
//           listenToRoom(code);
//           setScreen('waiting');
//         })
//         .catch(err => {
//           creatingRoomRef.current = false;
//           roomRef.current = null;
//           console.log(err);
//         });
//     }).catch(err => {
//       creatingRoomRef.current = false;
//       console.log(err);
//     });
//   };

//   // 3. Updates the currently-open room's privacy in Firebase + local state
//   const updateRoomPrivacy = (isPrivate: boolean) => {
//     setRoomIsPrivate(isPrivate);
//     if (!roomRef.current) return;
//     roomRef.current
//       .update({ isPrivate })
//       .catch(err => console.log('updateRoomPrivacy FAILED:', err.message));
//   };

//   // Shared join logic used by both joinRoom() and joinRoomWithCode()
//   const doJoin = (code: string): void => {
//     if (!myName || !code) return;
//     setMultiplayerError('');

//     const ref = database().ref(`/rooms/${code}`);

//     ref.once('value').then(snapshot => {
//       const data = snapshot.val();

//       if (!data) { setMultiplayerError('Room not found'); return; }
//       if (data.status !== 'waiting' && data.status !== 'playing') {
//         setMultiplayerError('Room not found'); return;
//       }
//       if (data.status === 'playing' && data.guest !== myName) {
//         setMultiplayerError('Room is full'); return;
//       }

//       const isHost = data.host === myName;

//       ref
//         .update({
//           guest: isHost ? data.guest : myName,
//           guestUid: isHost ? data.guestUid : auth().currentUser?.uid ?? null,
//           guestPhoto: isHost ? data.guestPhoto : myPhoto ?? null,
//           status: 'playing',
//           guestAvatarId: isHost ? data.guestAvatarId ?? null : myAvatarId ?? null,
//         })
//         .then(() => {
//           roomRef.current = ref;

//           if (isHost) {
//             ref.onDisconnect().remove();
//           } else {
//             ref.onDisconnect().update({
//               guest: null, guestUid: null, guestPhoto: null, guestAvatarId: null,
//               status: 'waiting', board: Array(9).fill(null), currentTurn: 'X',
//               lastFirst: 'X', winner: null, isDraw: false,
//               rematchX: false, rematchO: false,
//             });
//           }

//           setRoomCodeState(code);
//           setMyRole(isHost ? 'X' : 'O');
//           setIsMyTurn(isHost ? data.currentTurn === 'X' : data.currentTurn === 'O');
//           setOpponentName(isHost ? data.guest : data.host);
//           setOpponentPhoto(isHost ? data.guestPhoto ?? null : data.hostPhoto ?? null);
//           setOpponentAvatarId(isHost ? data.guestAvatarId ?? null : data.hostAvatarId ?? null);
//           setGameStarted(true);
//           callbacks.setInGameStatus(true);
//           callbacks.startNewSession(code);
//           listenToRoom(code);
//           setScreen('multiplayerGame');
//         });
//     }).catch(err => console.log(err));
//   };

//   // 4. Joins a room using the code currently held in joinCode state
//   const joinRoom = (): void => {
//     if (!myName || joinCode.length !== 6) return;
//     doJoin(joinCode);
//   };

//   // 5. Same as joinRoom, but takes an explicit code (e.g. from a deep link)
//   const joinRoomWithCode = (code: string): void => doJoin(code);

//   // 6. THE sync engine — listens to /rooms/{code} and drives everything
//   // that depends on room state (board, turn, winner, rematch, opponent
//   // presence, event-match hand-off).
//   const listenToRoom = (code: string) => {
//     if (listenedCodeRef.current === code && roomRef.current) return;
//     if (opponentLeftTimeoutRef.current) {
//       clearTimeout(opponentLeftTimeoutRef.current);
//       opponentLeftTimeoutRef.current = null;
//     }

//     listenedCodeRef.current = code;
//     roomHasLoadedRef.current = false;
//     guestWasPresentRef.current = false;
//     lastRoomDataRef.current = null;

//     if (!roomRef.current) roomRef.current = database().ref(`/rooms/${code}`);
//     roomRef.current.off();

//     // Common cleanup when opponent disconnects/leaves for good
//     const handleOpponentLeft = (message: string, alsoRemoveRoom: boolean) => {
//       if (alsoRemoveRoom && roomRef.current) roomRef.current.remove().catch(() => {});
//       if (roomRef.current) {
//         roomRef.current.off();
//         roomRef.current.onDisconnect().cancel().catch(() => {});
//       }
//       roomRef.current = null;
//       listenedCodeRef.current = null;
//       guestWasPresentRef.current = false;
//       lastRoomDataRef.current = null;

//       callbacks.setInGameStatus(false);
//       setMultiplayerError(message);
//       setOpponentName('');
//       setOpponentPhoto(null);
//       setOpponentAvatarId(null);

//       opponentLeftTimeoutRef.current = setTimeout(() => {
//         opponentLeftTimeoutRef.current = null;
//         setMyRole(null);
//         setRoomCodeState('');
//         setRoomIsPrivate(false);
//         setGameStarted(false);
//         setMyRematchRequested(false);
//         setOpponentRematchRequested(false);
//         setBoard(Array(9).fill(null));
//         setCurrentPlayer('X');
//         setWinner(null);
//         setScreen('Mode');
//       }, 2000);
//     };

//     roomRef.current.on('value', snap => {
//       const data = snap.val();

//       // -- room gone from DB --
//       if (!data) {
//         if (!roomHasLoadedRef.current) return; // still waiting for first snapshot
//         if (lastRoomDataRef.current?.status === 'event_match_over') return; // expected removal
//         const message =
//           lastRoomDataRef.current?.hostLeaveReason === 'left'
//             ? 'Opponent has left the game.'
//             : 'Connection lost.';
//         handleOpponentLeft(message, false);
//         return;
//       }

//       roomHasLoadedRef.current = true;
//       lastRoomDataRef.current = data;

//       // -- host-side: detect guest disconnect / rejoinable state --
//       const isHost = data.host === myName;
//       if (isHost) {
//         if (data.guest) {
//           guestWasPresentRef.current = true;
//         } else if (guestWasPresentRef.current && data.status === 'waiting' && gameStartedRef.current) {
//           const message = data.guestLeaveReason === 'left' ? 'Opponent has left the game.' : 'Connection lost.';
//           if (data.isRandomMatch) {
//             handleOpponentLeft(message, true); // random match: no rejoin, end it
//           } else {
//             // invite/created room: guest can rejoin with same code
//             guestWasPresentRef.current = false;
//             setOpponentName(''); setOpponentPhoto(null); setOpponentAvatarId(null);
//             setMyRematchRequested(false); setOpponentRematchRequested(false);
//             setMultiplayerError(message);
//             setGameStarted(false);
//             setScreen('waiting');
//           }
//           return;
//         }
//       }

//       // -- sync board/turn/winner/privacy --
//       setBoard(normalizeBoard(data.board));
//       hostUidRef.current = data.hostUid ?? null;
//       guestUidRef.current = data.guestUid ?? null;
//       setCurrentPlayer(data.currentTurn ?? 'X');
//       setWinner(data.winner ?? null);
//       setRoomIsPrivate(!!data.isPrivate);

//       // -- hand off to event-match hook if this room is an event match --
//       if (callbacks.isEventMatchActive() || data.isEventMatch) {
//         callbacks.onEventRoomSnapshot?.(data);
//       }

//       if (data.status === 'playing') {
//         setGameStarted(true);
//         setScreen('multiplayerGame');
//         callbacks.setInGameStatus(true);
//       }

//       // -- opponent info --
//       const opponent = data.host === myName ? data.guest : data.host;
//       setOpponentName(opponent);
//       setOpponentPhoto((data.host === myName ? data.guestPhoto : data.hostPhoto) ?? null);
//       setOpponentAvatarId((data.host === myName ? data.guestAvatarId : data.hostAvatarId) ?? null);

//       // -- rematch: once both sides flag true, host resets the board --
//       const currentRole = myRoleRef.current;
//       if (data.rematchX && data.rematchO && currentRole === 'X') {
//         const prevFirst = data.lastFirst ?? 'X';
//         const newFirst: Player = prevFirst === 'X' ? 'O' : 'X';
//         roomRef.current
//           ?.update({
//             board: Array(9).fill(null), currentTurn: newFirst, winner: null,
//             isDraw: false, status: 'playing', lastFirst: newFirst,
//             rematchX: false, rematchO: false,
//           })
//           .catch(err => console.log('Board reset FAILED:', err.message));
//       }
//       const myFlag = currentRole === 'X' ? data.rematchX : data.rematchO;
//       const oppFlag = currentRole === 'X' ? data.rematchO : data.rematchX;
//       setMyRematchRequested(!!myFlag);
//       setOpponentRematchRequested(!!oppFlag);
//     });
//   };

//   // 7. Sends a move to Firebase; win/draw side-effects go through callbacks
//   const handleMultiplayerPress = (i: number) => {
//     if (!roomRef.current || !myRole) return;
//     if (board[i] || processingMoveRef.current) return;
//     if (!shared.isMyTurn) return;
//     processingMoveRef.current = true;

//     const newBoard = [...board];
//     newBoard[i] = myRole;
//     const win = checkwin(newBoard);
//     const draw = newBoard.every(c => c !== null) && !win;
//     const nextTurn: Player = myRole === 'X' ? 'O' : 'X';

//     roomRef.current
//       .update({
//         board: newBoard,
//         currentTurn: win || draw ? null : nextTurn,
//         winner: win ?? null,
//         isDraw: draw,
//       })
//       .then(() => {
//         if (win) {
//           const winnerUid = win === 'X' ? hostUidRef.current : guestUidRef.current;
//           const loserUid = win === 'X' ? guestUidRef.current : hostUidRef.current;
//           callbacks.onWin(win, winnerUid, loserUid);
//         } else if (draw) {
//           callbacks.onDraw(hostUidRef.current, guestUidRef.current);
//         }
//       })
//       .catch(err => console.log('handleMultiplayerPress error:', err.message))
//       .finally(() => { processingMoveRef.current = false; });
//   };

//   // 8. Cleans up the room on exit; also records this opponent for "recent"
//   const leaveRoom = () => {
//     if (!roomRef.current && opponentLeftTimeoutRef.current) {
//       clearTimeout(opponentLeftTimeoutRef.current);
//       opponentLeftTimeoutRef.current = null;
//       listenedCodeRef.current = null;
//       callbacks.setInGameStatus(false);
//       setMyRole(null); setOpponentName(''); setOpponentPhoto(null); setOpponentAvatarId(null);
//       setRoomCodeState(''); setGameStarted(false);
//       setMyRematchRequested(false); setOpponentRematchRequested(false);
//       setMultiplayerError('');
//       setBoard(Array(9).fill(null)); setCurrentPlayer('X'); setWinner(null);
//       creatingRoomRef.current = false;
//       setScreen('Mode');
//       return;
//     }

//     if (!roomRef.current || isLeavingRef.current) return;
//     isLeavingRef.current = true;

//     // save this pairing as "recent opponents" for both sides
//     if (opponentName && myName && opponentName !== myName) {
//       database().ref(`/recentOpponents/${myName}/${opponentName}`).set({
//         name: opponentName, photo: opponentPhoto ?? null, avatarId: opponentAvatarId ?? null,
//         timestamp: database.ServerValue.TIMESTAMP,
//       });
//       database().ref(`/recentOpponents/${opponentName}/${myName}`).set({
//         name: myName, photo: myPhoto ?? null, avatarId: myAvatarId ?? null,
//         timestamp: database.ServerValue.TIMESTAMP,
//       });
//     }

//     const currentRef = roomRef.current;
//     const iAmHost = myRole === 'X';
//     const isRandom = lastRoomDataRef.current?.isRandomMatch === true;

//     currentRef.onDisconnect().cancel().then(() => {
//       if (iAmHost) {
//         if (isRandom) {
//           // random match: no rejoin possible, end it for both
//           return currentRef.update({ hostLeaveReason: 'left' }).then(() => currentRef.remove());
//         }
//         // invite/created room: keep room alive so guest can wait
//         return currentRef.update({
//           host: null, hostUid: null, hostPhoto: null, hostAvatarId: null,
//           hostLeaveReason: 'left', status: 'waiting', currentTurn: 'X',
//           lastFirst: 'X', winner: null, isDraw: false, rematchX: false, rematchO: false,
//         });
//       }
//       return currentRef.update({
//         guest: null, guestUid: null, guestPhoto: null, guestAvatarId: null,
//         guestLeaveReason: 'left', status: 'waiting', currentTurn: 'X',
//         lastFirst: 'X', winner: null, isDraw: false, rematchX: false, rematchO: false,
//       });
//     }).catch(err => console.log('leaveRoom cleanup FAILED:', err.message));

//     currentRef.off();

//     roomRef.current = null;
//     listenedCodeRef.current = null;
//     setMyRole(null); setOpponentName(''); setOpponentPhoto(null); setOpponentAvatarId(null);
//     setRoomCodeState(''); setGameStarted(false);
//     setMyRematchRequested(false); setOpponentRematchRequested(false);
//     setRoomIsPrivate(false);
//     setBoard(Array(9).fill(null)); setCurrentPlayer('X'); setWinner(null);
//     callbacks.setInGameStatus(false);
//     creatingRoomRef.current = false;
//     setScreen('Mode');
//     isLeavingRef.current = false;
//   };

//   // 9. Flags this player as wanting a rematch (board resets once both agree)
//   const requestRematch = () => {
//     if (!roomRef.current || !myRoleRef.current) return;
//     const field = myRoleRef.current === 'X' ? 'rematchX' : 'rematchO';
//     roomRef.current
//       .update({ [field]: true })
//       .catch(err => console.log('Rematch request FAILED:', err.message));
//   };

//   return {
//     generateRoomCode,
//     updateRoomPrivacy,
//     joinRoom,
//     joinRoomWithCode,
//     listenToRoom,
//     handleMultiplayerPress,
//     leaveRoom,
//     requestRematch,
//   };
// };