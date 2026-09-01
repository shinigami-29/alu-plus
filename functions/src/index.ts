// import {onValueCreated} from "firebase-functions/v2/database";
// import {initializeApp} from "firebase-admin/app";
// import {getFirestore} from "firebase-admin/firestore";
// import {getMessaging} from "firebase-admin/messaging";

// initializeApp();
// const db = getFirestore();
// const messaging = getMessaging();

// // Helper: username बाट fcmToken खोज्ने (Firestore ma UID ले keyed xa,
// // tara invitation chai username ले keyed xa)
// /**
//  * Username बाट fcmToken खोज्ने।
//  * @param {string} username - Firestore username field
//  * @return {Promise<string|null>} FCM token or null
//  */
// function getFcmTokenByUsername(username: string): Promise<string | null> {
//   return db
//     .collection("users")
//     .where("username", "==", username)
//     .limit(1)
//     .get()
//     .then((snap) => {
//       if (snap.empty) return null;
//       return snap.docs[0].data()?.fcmToken ?? null;
//     });
// }

// // Token invalid/expired vaye Firestore bata clear garne
// /**
//  * Token invalid/expired vaye Firestore bata clear garne।
//  * @param {string} username - Firestore username field
//  * @return {Promise<void>}
//  */
// function clearInvalidToken(username: string) {
//   return db
//     .collection("users")
//     .where("username", "==", username)
//     .limit(1)
//     .get()
//     .then((snap) => {
//       if (!snap.empty) {
//         return snap.docs[0].ref.update({fcmToken: null});
//       }
//       return;
//     });
// }

// // Game invite pathauda notification pathaune
// export const onGameInvite = onValueCreated(
//   "/invitations/{toName}/{fromName}",
//   (event) => {
//     const toName = event.params.toName;
//     const fromName = event.params.fromName;

//     return getFcmTokenByUsername(toName).then((fcmToken) => {
//       if (!fcmToken) {
//         console.log("No FCM token found for user:", toName);
//         return;
//       }

//       return messaging
//         .send({
//           token: fcmToken,
//           notification: {
//             title: "🎮 Game Invite!",
//             body: `${fromName} le tapailai game invite pathayo!`,
//           },
//           data: {
//             type: "gameInvite",
//             fromName,
//           },
//         })
//         .catch((err) => {
//           console.log("Send failed for", toName, err.code);
//           if (
//             err.code === "messaging/invalid-registration-token" ||
//             err.code === "messaging/registration-token-not-registered"
//           ) {
//             return clearInvalidToken(toName);
//           }
//           return;
//         });
//     });
//   }
// );

// // Friend request pathauda notification pathaune
// export const onFriendRequest = onValueCreated(
//   "/friendRequests/{toName}/{fromName}",
//   (event) => {
//     const toName = event.params.toName;
//     const fromName = event.params.fromName;

//     return getFcmTokenByUsername(toName).then((fcmToken) => {
//       if (!fcmToken) {
//         console.log("No FCM token found for user:", toName);
//         return;
//       }

//       return messaging
//         .send({
//           token: fcmToken,
//           notification: {
//             title: "👋 Friend Request!",
//             body: `${fromName} le tapailai friend request pathayo!`,
//           },
//           data: {
//             type: "friendRequest",
//             fromName,
//           },
//         })
//         .catch((err) => {
//           console.log("Send failed for", toName, err.code);
//           if (
//             err.code === "messaging/invalid-registration-token" ||
//             err.code === "messaging/registration-token-not-registered"
//           ) {
//             return clearInvalidToken(toName);
//           }
//           return;
//         });
//     });
//   }
// );
