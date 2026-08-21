import { useState, useRef } from 'react';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  recordGameResult as recordBracketMatchResult,
  generateNextRound,
} from '../components/Utils/bracketGenerator';
import { Player } from '../Game2/Type';
import { SharedState } from './useSharedState';

type EventMatchCallbacks = {
  setInGameStatus: (inGame: boolean, roomCode?: string) => void;
  startNewSession: (code: string) => void;
};

export const useEventMatch = (
  shared: SharedState,
  myPhoto: string | null | undefined,
  myAvatarId: string | null | undefined,
  callbacks: EventMatchCallbacks,
) => {
  const {
    myName, myRoleRef, setMyRole,
    setOpponentName, setOpponentPhoto, setOpponentAvatarId,
    setRoomCodeState, setGameStarted,
    setBoard, setCurrentPlayer, setWinner,
    roomRef, setScreen,
  } = shared;

  const [eventMatchOver, setEventMatchOver] = useState(false);
  const [isEventMatch, setIsEventMatch] = useState(false);
  const [eventInfo, setEventInfo] = useState<{
    eventId: string;
    roundKey: string;
    totalRounds: number;
  } | null>(null);

  const eventMatchInfoRef = useRef<{
    eventId: string;
    roundKey: string;
    matchId: string;
  } | null>(null);

  // 1. Creates/joins the Firebase room for a specific bracket match, and
  // resolves opponent's name/photo from Firestore before starting.
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
    setEventInfo({ eventId, roundKey, totalRounds });
    setEventMatchOver(false);

    firestore()
      .collection('users')
      .doc(opponentUid)
      .get()
      .then(doc => {
        const o = doc.data();
        const oName =
          (o?.username && o.username.trim()) ||
          (o?.name && o.name.trim()) ||
          'Opponent';
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
          callbacks.setInGameStatus(true, code);
          callbacks.startNewSession(code);
          // NOTE: listenToRoom(code) must be called by the caller
          // (useGameLogic) right after this, since it lives in
          // useRoomConnection.ts.
          setScreen('multiplayerGame');
        });
      })
      .catch(err => console.log('startEventMatch lookup FAILED:', err.message));
  };

  // 2. Called by useRoomConnection's listenToRoom() on every snapshot,
  // ONLY when this room is (or was) an event match.
  const handleRoomSnapshot = (data: any) => {
    const opponentDisconnected =
      myRoleRef.current === 'X' ? data.guestDisconnected : data.hostDisconnected;

    if (opponentDisconnected && data.status !== 'event_match_over') {
      forfeitEventMatch(data.hostUid ?? null, data.guestUid ?? null);
    } else if (data.winner && data.status !== 'event_match_over' && myRoleRef.current === 'X') {
      recordEventMatchResult(data.winner, data.hostUid ?? null, data.guestUid ?? null, data.lastFirst ?? 'X');
    } else if (data.isDraw && myRoleRef.current === 'X') {
      // draw during a bracket match: auto-continue with a fresh board
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

    if (data.status === 'event_match_over') {
      setEventMatchOver(true);
    }
  };

  // 3. Writes the game winner into the bracket via transaction; if the
  // whole match (best-of-N) is now decided, advances the round.
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

        if (isMatchOver) {
          maybeAdvanceRound(info.eventId, info.roundKey);
          if (myRoleRef.current === 'X') {
            roomRef.current
              ?.update({ status: 'event_match_over' })
              .catch(err => console.log('event_match_over update FAILED:', err.message));
          }
        } else if (myRoleRef.current === 'X') {
          // match continues — next game in the series
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

  // 4. Opponent disconnected mid-match — auto-win the bracket match for me
  const forfeitEventMatch = (hostUid: string | null, guestUid: string | null) => {
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

  // 5. Once every match in a round is 'completed', generates the next round
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

  // 6. Cleanup when leaving an event match screen (back button etc.)
  const leaveEventRoom = () => {
    if (roomRef.current) {
      roomRef.current.off();
      roomRef.current.onDisconnect().cancel().catch(() => {});
      roomRef.current.remove().catch(() => {});
    }
    roomRef.current = null;
    eventMatchInfoRef.current = null;

    setEventMatchOver(false);
    setMyRole(null);
    setOpponentName('');
    setOpponentPhoto(null);
    setOpponentAvatarId(null);
    setRoomCodeState('');
    setGameStarted(false);
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    callbacks.setInGameStatus(false);
    setIsEventMatch(false);
    setEventInfo(null);
  };

  return {
    isEventMatch,
    eventInfo,
    eventMatchOver,
    startEventMatch,
    handleRoomSnapshot,
    forfeitEventMatch,
    leaveEventRoom,
  };
};