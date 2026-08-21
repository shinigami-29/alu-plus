// import { useState, useRef } from 'react';
// import database from '@react-native-firebase/database';
// import { SharedState } from './useSharedState';

// /**
//  * useLobby.ts
//  * =====================================================================
//  * WHAT'S IN HERE (public room list / lobby screen):
//  *  1. allRooms              - list of joinable rooms shown in the lobby
//  *  2. fetchAllRooms()       - starts listening to /rooms, builds the list,
//  *                             AND sweeps out ghost/duplicate/stale rooms
//  *  3. stopFetchingAllRooms()- stops the listener (call when leaving lobby)
//  *
//  * Self-contained — only depends on myName from shared state.
//  * =====================================================================
//  */

// const ROOM_WAITING_TTL_MS = 5 * 60 * 1000; // a "waiting" room older than this is stale

// export const useLobby = (shared: SharedState) => {
//   const { myName } = shared;

//   const [allRooms, setAllRooms] = useState<
//     {
//       roomCode: string;
//       roomName: string;
//       host: string;
//       hostPhoto: string | null;
//       hostAvatarId: string | null;
//       guest: string | null;
//       guestPhoto: string | null;
//       guestAvatarId: string | null;
//       status: 'waiting' | 'playing';
//       isPrivate: boolean;
//     }[]
//   >([]);

//   const roomsListenerRef = useRef<ReturnType<typeof database().ref> | null>(null);

//   // 2. Listens to /rooms and builds the public lobby list, sweeping out
//   // ghost/duplicate/stale "waiting" rooms as it goes
//   const fetchAllRooms = () => {
//     if (roomsListenerRef.current) {
//       roomsListenerRef.current.off();
//     }
//     const ref = database().ref('/rooms');
//     roomsListenerRef.current = ref;

//     ref.on('value', snapshot => {
//       const data = snapshot.val();
//       if (!data) {
//         setAllRooms([]);
//         return;
//       }

//       const now = Date.now();
//       const cleanupUpdates: Record<string, null> = {};
//       const seenWaitingHosts = new Map<string, string>();
//       const codes = Object.keys(data);

//       codes.forEach(code => {
//         const room = data[code];

//         if (!room?.host) {
//           cleanupUpdates[`/rooms/${code}`] = null;
//           return;
//         }

//         if (room.status === 'waiting' && !room.guest) {
//           const created = room.createdAt ?? 0;
//           const isStale = now - created > ROOM_WAITING_TTL_MS;
//           if (isStale) {
//             cleanupUpdates[`/rooms/${code}`] = null;
//             return;
//           }
//           // dedupe: same host has more than one waiting room -> keep first seen
//           if (seenWaitingHosts.has(room.host)) {
//             cleanupUpdates[`/rooms/${code}`] = null;
//             return;
//           }
//           seenWaitingHosts.set(room.host, code);
//         }
//       });

//       const list = codes
//         .filter(code => cleanupUpdates[`/rooms/${code}`] === undefined)
//         .map(code => ({
//           roomCode: code,
//           roomName: data[code].roomName ?? `${data[code].host}'s Room`,
//           host: data[code].host,
//           hostPhoto: data[code].hostPhoto ?? null,
//           hostAvatarId: data[code].hostAvatarId ?? null,
//           guest: data[code].guest ?? null,
//           guestPhoto: data[code].guestPhoto ?? null,
//           guestAvatarId: data[code].guestAvatarId ?? null,
//           status: data[code].status,
//           isPrivate: !!data[code].isPrivate,
//         }))
//         .filter(
//           room =>
//             (room.status === 'waiting' || room.status === 'playing') &&
//             room.host !== myName &&
//             room.guest !== myName,
//         );

//       list.sort((a, b) => {
//         if (a.status === b.status) return 0;
//         return a.status === 'waiting' ? -1 : 1;
//       });

//       setAllRooms(list);

//       if (Object.keys(cleanupUpdates).length > 0) {
//         database()
//           .ref()
//           .update(cleanupUpdates)
//           .catch(err => console.log('Ghost room cleanup FAILED:', err.message));
//       }
//     });
//   };

//   // 3. Stops the /rooms listener — call this on leaving the lobby screen
//   const stopFetchingAllRooms = () => {
//     if (roomsListenerRef.current) {
//       roomsListenerRef.current.off();
//       roomsListenerRef.current = null;
//     }
//   };

//   return {
//     allRooms,
//     fetchAllRooms,
//     stopFetchingAllRooms,
//   };
// };