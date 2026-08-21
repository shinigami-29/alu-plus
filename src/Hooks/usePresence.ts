import { useState, useRef, useEffect } from 'react';
import database, {
  FirebaseDatabaseTypes,
} from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { SharedState } from './useSharedState';

/**
 * usePresence.ts
 * =====================================================================
 * WHAT'S IN HERE (online/offline status):
 *  1. onlineStatus       - map of { [playerName]: isOnline } for UI dots
 *  2. setupPresence()    - keeps THIS user's own online/offline record
 *                          in sync via .info/connected (auto-runs on
 *                          myName change via the useEffect below)
 *  3. listenToPresence() - subscribes to a list of OTHER players' status
 *                          (call this from useGameLogic whenever the
 *                          friends/recentOpponents list changes)
 *  4. setInGameStatus()  - marks this user "in a game" or not; used by
 *                          useRoomConnection / useEventMatch as a callback
 *                          so invites/matchmaking skip busy players
 *
 * Self-contained — only depends on myName + roomRef/roomCodeRef from
 * shared state. No other hook is imported.
 * =====================================================================
 */

export const usePresence = (shared: SharedState) => {
  const { myName, roomRef, roomCodeRef } = shared;

  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const presenceRefsRef = useRef<Record<string, FirebaseDatabaseTypes.Reference>>({});

  // 2. Tracks online/offline presence for the current user via .info/connected
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
        .catch(err => console.log('setupPresence onConnectedChange FAILED:', err.message));
    };

    connectedRef.on('value', onConnectedChange);
    return () => {
      connectedRef.off('value', onConnectedChange);
      if (!auth().currentUser) return;
      myStatusRef
        .set({ state: 'offline', last_changed: database.ServerValue.TIMESTAMP })
        .catch(err => console.log('setupPresence cleanup FAILED:', err.message));
    };
  };

  // runs setupPresence() once (and re-runs if myName changes)
  useEffect(() => {
    const cleanup = setupPresence();
    return cleanup;
  }, [myName]);

  // 3. Subscribes to presence for a given list of names (friends + recent opponents)
  const listenToPresence = (names: string[]) => {
    // drop listeners for names no longer in the list
    Object.keys(presenceRefsRef.current).forEach(name => {
      if (!names.includes(name)) {
        presenceRefsRef.current[name].off();
        delete presenceRefsRef.current[name];
      }
    });

    names.forEach(name => {
      if (presenceRefsRef.current[name]) return; // already listening
      const ref = database().ref(`/status/${name}`);
      presenceRefsRef.current[name] = ref;

      ref.on('value', snap => {
        const data = snap.val();
        setOnlineStatus(prev => ({ ...prev, [name]: data?.state === 'online' }));
      });
    });
  };

  // 4. Marks this player as "in a game" (or not) in their presence record.
  // Used by useRoomConnection / useEventMatch to avoid matching someone
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

  return {
    onlineStatus,
    listenToPresence,
    setInGameStatus,
  };
};