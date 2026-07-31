// // import React, { useEffect, useRef, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   TouchableOpacity,
// //   StyleSheet,
// //   Image,
// //   ActivityIndicator,
// //   Modal,
// //   Animated,
// //   Easing,
// //   Pressable,
// // } from 'react-native';
// // import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// // import { RouteProp } from '@react-navigation/native';
// // import { useGameLogic } from '../GameLogicContext';
// // import {
// //   ArrowLeft,
// //   User,
// //   Trash2,
// //   Send,
// //   Trophy,
// //   AlertTriangle,
// //   CheckCircle2,
// // } from 'lucide-react-native';
// // import { getAvatarSource } from '../../avatar/Avatar';

// // type Props = {
// //   navigation: NativeStackNavigationProp<any>;
// //   route: RouteProp<any, any>;
// // };

// // const PlayerProfileScreen = ({ navigation, route }: Props) => {
// //   const { name, uid, photo, avatarId } = (route.params as any) || {};
// //   const { removeFriend, fetchPlayerStatsByUid, sendInvitation } =
// //     useGameLogic();

// //   // avatarId (preset avatar) > photo > default icon
// //   const avatarSource = getAvatarSource(avatarId);

// //   const [stats, setStats] = useState<{
// //     wins: number;
// //     losses: number;
// //     draws: number;
// //   } | null>(null);
// //   const [loading, setLoading] = useState(true);

// //   const [removeModalVisible, setRemoveModalVisible] = useState(false);
// //   const [inviteSentModalVisible, setInviteSentModalVisible] = useState(false);

// //   // Shared animation values for both modals (only one is visible at a time)
// //   const modalScale = useRef(new Animated.Value(0.9)).current;
// //   const modalOpacity = useRef(new Animated.Value(0)).current;

// //   const runModalOpenAnim = () => {
// //     modalScale.setValue(0.9);
// //     modalOpacity.setValue(0);
// //     Animated.parallel([
// //       Animated.spring(modalScale, {
// //         toValue: 1,
// //         useNativeDriver: true,
// //         speed: 18,
// //         bounciness: 6,
// //       }),
// //       Animated.timing(modalOpacity, {
// //         toValue: 1,
// //         duration: 180,
// //         easing: Easing.out(Easing.quad),
// //         useNativeDriver: true,
// //       }),
// //     ]).start();
// //   };

// //   useEffect(() => {
// //     if (uid) {
// //       fetchPlayerStatsByUid(uid).then(
// //         (data: { wins: number; losses: number; draws: number }) => {
// //           setStats(data);
// //           setLoading(false);
// //         },
// //       );
// //     } else {
// //       setLoading(false);
// //     }
// //   }, [uid]);

// //   const openRemoveModal = () => {
// //     setRemoveModalVisible(true);
// //     runModalOpenAnim();
// //   };

// //   const confirmRemove = () => {
// //     setRemoveModalVisible(false);
// //     removeFriend(name);
// //     navigation.goBack();
// //   };

// //   const handleInvite = () => {
// //     sendInvitation(name);
// //     setInviteSentModalVisible(true);
// //     runModalOpenAnim();
// //   };

// //   const wins = stats?.wins ?? 0;
// //   const losses = stats?.losses ?? 0;
// //   const draws = stats?.draws ?? 0;
// //   const totalGames = wins + losses + draws;
// //   const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

// //   return (
// //     <View style={s.container}>
// //       {/* Header */}
// //       <View style={s.header}>
// //         <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
// //           <ArrowLeft size={20} color="#182992" />
// //         </TouchableOpacity>
// //         <Text style={s.headerTitle}>Player Profile</Text>
// //         <View style={{ width: 38 }} />
// //       </View>

// //       {/* Profile hero card */}
// //       <View style={s.profileCard}>
// //         <View style={s.avatarRing}>
// //           {avatarSource ? (
// //             <Image source={avatarSource} style={s.avatar} />
// //           ) : photo ? (
// //             <Image source={{ uri: photo }} style={s.avatar} />
// //           ) : (
// //             <View style={s.avatarCircle}>
// //               <User size={36} color="#182992" />
// //             </View>
// //           )}
// //         </View>

// //         <Text style={s.name} numberOfLines={1}>
// //           {name}
// //         </Text>

// //         {loading ? (
// //           <ActivityIndicator color="#182992" style={{ marginTop: 24 }} />
// //         ) : (
// //           <>
// //             {totalGames > 0 && (
// //               <View style={s.winRateWrap}>
// //                 <View style={s.winRateHeader}>
// //                   <View style={s.winRateLabelRow}>
// //                     <Trophy size={13} color="#F5A623" />
// //                     <Text style={s.winRateLabel}>Win rate</Text>
// //                   </View>
// //                   <Text style={s.winRateValue}>{winRate}%</Text>
// //                 </View>
// //                 <View style={s.winRateTrack}>
// //                   <View style={[s.winRateFill, { width: `${winRate}%` }]} />
// //                 </View>
// //               </View>
// //             )}

// //             <View style={s.divider} />

// //             <View style={s.statsRow}>
// //               <View style={s.statBox}>
// //                 <Text style={[s.statValue, { color: '#28C76F' }]}>{wins}</Text>
// //                 <Text style={s.statLabel}>Wins</Text>
// //               </View>
// //               <View style={s.statSep} />
// //               <View style={s.statBox}>
// //                 <Text style={[s.statValue, { color: '#e57373' }]}>
// //                   {losses}
// //                 </Text>
// //                 <Text style={s.statLabel}>Losses</Text>
// //               </View>
// //               <View style={s.statSep} />
// //               <View style={s.statBox}>
// //                 <Text style={[s.statValue, { color: '#9098a8' }]}>{draws}</Text>
// //                 <Text style={s.statLabel}>Draws</Text>
// //               </View>
// //               <View style={s.statSep} />
// //               <View style={s.statBox}>
// //                 <Text style={[s.statValue, { color: '#182992' }]}>
// //                   {totalGames}
// //                 </Text>
// //                 <Text style={s.statLabel}>Games</Text>
// //               </View>
// //             </View>

// //             {!uid && (
// //               <Text style={s.noStatsNote}>
// //                 Stats not linked for this player yet
// //               </Text>
// //             )}
// //           </>
// //         )}
// //       </View>

// //       {/* Actions */}
// //       <TouchableOpacity
// //         style={s.inviteBtn}
// //         activeOpacity={0.85}
// //         onPress={handleInvite}
// //       >
// //         <Send size={18} color="#fff" />
// //         <Text style={s.inviteBtnText}>Invite to Game</Text>
// //       </TouchableOpacity>

// //       <TouchableOpacity
// //         style={s.removeBtn}
// //         activeOpacity={0.7}
// //         onPress={openRemoveModal}
// //       >
// //         <Trash2 size={16} color="#e57373" />
// //         <Text style={s.removeBtnText}>Remove Friend</Text>
// //       </TouchableOpacity>

// //       {/* Remove friend confirmation modal */}
// //       <Modal
// //         transparent
// //         visible={removeModalVisible}
// //         animationType="none"
// //         statusBarTranslucent
// //         onRequestClose={() => setRemoveModalVisible(false)}
// //       >
// //         <Pressable
// //           style={s.backdrop}
// //           onPress={() => setRemoveModalVisible(false)}
// //         >
// //           <Animated.View
// //             style={[
// //               s.modalCard,
// //               { opacity: modalOpacity, transform: [{ scale: modalScale }] },
// //             ]}
// //             onStartShouldSetResponder={() => true}
// //           >
// //             <View style={[s.modalIconCircle, { backgroundColor: '#FDEDED' }]}>
// //               <AlertTriangle size={26} color="#e57373" />
// //             </View>
// //             <Text style={s.modalTitle}>Remove Friend</Text>
// //             <Text style={s.modalMessage}>
// //               Do you want remove {name} from your game friends?
// //             </Text>
// //             <View style={s.modalBtnRow}>
// //               <TouchableOpacity
// //                 style={[s.modalBtn, s.modalCancelBtn]}
// //                 activeOpacity={0.7}
// //                 onPress={() => setRemoveModalVisible(false)}
// //               >
// //                 <Text style={s.modalCancelBtnText}>Cancel</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity
// //                 style={[s.modalBtn, s.modalDestructiveBtn]}
// //                 activeOpacity={0.85}
// //                 onPress={confirmRemove}
// //               >
// //                 <Text style={s.modalDestructiveBtnText}>Remove</Text>
// //               </TouchableOpacity>
// //             </View>
// //           </Animated.View>
// //         </Pressable>
// //       </Modal>

// //       {/* Invitation sent modal */}
// //       <Modal
// //         transparent
// //         visible={inviteSentModalVisible}
// //         animationType="none"
// //         statusBarTranslucent
// //         onRequestClose={() => setInviteSentModalVisible(false)}
// //       >
// //         <Pressable
// //           style={s.backdrop}
// //           onPress={() => setInviteSentModalVisible(false)}
// //         >
// //           <Animated.View
// //             style={[
// //               s.modalCard,
// //               { opacity: modalOpacity, transform: [{ scale: modalScale }] },
// //             ]}
// //             onStartShouldSetResponder={() => true}
// //           >
// //             <View style={[s.modalIconCircle, { backgroundColor: '#EAFAF1' }]}>
// //               <CheckCircle2 size={26} color="#28C76F" />
// //             </View>
// //             <Text style={s.modalTitle}>Invitation sent</Text>
// //             <Text style={s.modalMessage}>Invite has been send to {name}</Text>
// //             <TouchableOpacity
// //               style={s.modalConfirmBtnFull}
// //               activeOpacity={0.85}
// //               onPress={() => setInviteSentModalVisible(false)}
// //             >
// //               <Text style={s.modalConfirmBtnText}>Okay</Text>
// //             </TouchableOpacity>
// //           </Animated.View>
// //         </Pressable>
// //       </Modal>
// //     </View>
// //   );
// // };

// // export default PlayerProfileScreen;

// // const s = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#F5F4F0',
// //     paddingTop: 50,
// //     paddingHorizontal: 20,
// //   },
// //   header: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     marginBottom: 20,
// //   },
// //   iconBtn: {
// //     width: 38,
// //     height: 38,
// //     borderRadius: 19,
// //     backgroundColor: '#fff',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     borderWidth: 1,
// //     borderColor: '#dde3f0',
// //   },
// //   headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#182992' },

// //   profileCard: {
// //     backgroundColor: '#fff',
// //     borderRadius: 24,
// //     paddingVertical: 28,
// //     paddingHorizontal: 20,
// //     alignItems: 'center',
// //     borderWidth: 1,
// //     borderColor: '#eef1f7',
// //     marginBottom: 20,
// //     shadowColor: '#182992',
// //     shadowOffset: { width: 0, height: 6 },
// //     shadowOpacity: 0.06,
// //     shadowRadius: 12,
// //     elevation: 2,
// //   },
// //   avatarRing: {
// //     width: 92,
// //     height: 92,
// //     borderRadius: 46,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     backgroundColor: '#F5F4F0',
// //     borderWidth: 2,
// //     borderColor: '#F5A623',
// //     marginBottom: 14,
// //   },
// //   avatar: { width: 80, height: 80, borderRadius: 40 },
// //   avatarCircle: {
// //     width: 80,
// //     height: 80,
// //     borderRadius: 40,
// //     backgroundColor: '#dde3f0',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   name: {
// //     fontSize: 20,
// //     fontWeight: 'bold',
// //     color: '#182992',
// //     marginBottom: 18,
// //   },

// //   winRateWrap: { width: '100%', marginBottom: 18 },
// //   winRateHeader: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 6,
// //   },
// //   winRateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
// //   winRateLabel: { fontSize: 12, fontWeight: '600', color: '#9098a8' },
// //   winRateValue: { fontSize: 13, fontWeight: 'bold', color: '#182992' },
// //   winRateTrack: {
// //     height: 8,
// //     borderRadius: 4,
// //     backgroundColor: '#EEF1F7',
// //     overflow: 'hidden',
// //   },
// //   winRateFill: {
// //     height: 8,
// //     borderRadius: 4,
// //     backgroundColor: '#F5A623',
// //   },

// //   divider: {
// //     height: 1,
// //     backgroundColor: '#EEF1F7',
// //     width: '100%',
// //     marginBottom: 18,
// //   },

// //   statsRow: { flexDirection: 'row', width: '100%', alignItems: 'center' },
// //   statBox: { alignItems: 'center', flex: 1 },
// //   statSep: { width: 1, height: 28, backgroundColor: '#EEF1F7' },
// //   statValue: { fontSize: 21, fontWeight: 'bold' },
// //   statLabel: {
// //     fontSize: 11,
// //     color: '#9098a8',
// //     fontWeight: '600',
// //     marginTop: 2,
// //   },

// //   noStatsNote: {
// //     marginTop: 14,
// //     fontSize: 12,
// //     color: '#c3c9d6',
// //     fontWeight: '500',
// //   },

// //   inviteBtn: {
// //     flexDirection: 'row',
// //     backgroundColor: '#182992',
// //     paddingVertical: 15,
// //     borderRadius: 16,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     gap: 8,
// //     marginBottom: 12,
// //     shadowColor: '#182992',
// //     shadowOffset: { width: 0, height: 4 },
// //     shadowOpacity: 0.18,
// //     shadowRadius: 8,
// //     elevation: 3,
// //   },
// //   inviteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

// //   removeBtn: {
// //     flexDirection: 'row',
// //     backgroundColor: 'transparent',
// //     paddingVertical: 12,
// //     borderRadius: 16,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     gap: 6,
// //   },
// //   removeBtnText: { color: '#e57373', fontWeight: '600', fontSize: 14 },

// //   // Modal styles (Remove Friend / Invitation sent)
// //   backdrop: {
// //     flex: 1,
// //     backgroundColor: 'rgba(24,41,146,0.35)',
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     paddingHorizontal: 32,
// //   },
// //   modalCard: {
// //     width: '100%',
// //     maxWidth: 340,
// //     backgroundColor: '#fff',
// //     borderRadius: 22,
// //     paddingVertical: 26,
// //     paddingHorizontal: 22,
// //     alignItems: 'center',
// //     shadowColor: '#182992',
// //     shadowOffset: { width: 0, height: 10 },
// //     shadowOpacity: 0.18,
// //     shadowRadius: 20,
// //     elevation: 8,
// //   },
// //   modalIconCircle: {
// //     width: 56,
// //     height: 56,
// //     borderRadius: 28,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     marginBottom: 14,
// //   },
// //   modalTitle: {
// //     fontSize: 17,
// //     fontWeight: 'bold',
// //     color: '#182992',
// //     marginBottom: 6,
// //     textAlign: 'center',
// //   },
// //   modalMessage: {
// //     fontSize: 13.5,
// //     color: '#767c8c',
// //     textAlign: 'center',
// //     lineHeight: 19,
// //     marginBottom: 22,
// //   },
// //   modalBtnRow: {
// //     flexDirection: 'row',
// //     width: '100%',
// //     gap: 10,
// //   },
// //   modalBtn: {
// //     flex: 1,
// //     paddingVertical: 13,
// //     borderRadius: 14,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   modalCancelBtn: {
// //     backgroundColor: '#F5F4F0',
// //     borderWidth: 1,
// //     borderColor: '#eef1f7',
// //   },
// //   modalCancelBtnText: { color: '#182992', fontWeight: '700', fontSize: 14.5 },
// //   modalConfirmBtn: {
// //     backgroundColor: '#182992',
// //   },
// //   modalConfirmBtnFull: {
// //     width: '100%',
// //     backgroundColor: '#182992',
// //     paddingVertical: 13,
// //     borderRadius: 14,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   modalConfirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
// //   modalDestructiveBtn: {
// //     backgroundColor: '#e57373',
// //   },
// //   modalDestructiveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
// // });




// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Modal,
//   Animated,
//   Easing,
//   Pressable,
//   ImageBackground,
// } from 'react-native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RouteProp } from '@react-navigation/native';
// import { useGameLogic } from '../GameLogicContext';
// import {
//   ArrowLeft,
//   User,
//   Trash2,
//   Send,
//   AlertTriangle,
//   CheckCircle2,
// } from 'lucide-react-native';
// import { getAvatarSource } from '../../avatar/Avatar';

// type Props = {
//   navigation: NativeStackNavigationProp<any>;
//   route: RouteProp<any, any>;
// };

// const PlayerProfileScreen = ({ navigation, route }: Props) => {
//   const { name, uid, photo, avatarId } = (route.params as any) || {};
//   const { removeFriend, fetchPlayerStatsByUid, sendInvitation } =
//     useGameLogic();

//   // avatarId (preset avatar) > photo > default icon
//   const avatarSource = getAvatarSource(avatarId);

//   const [stats, setStats] = useState<{
//     wins: number;
//     losses: number;
//     draws: number;
//   } | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [removeModalVisible, setRemoveModalVisible] = useState(false);
//   const [inviteSentModalVisible, setInviteSentModalVisible] = useState(false);

//   // Shared animation values for both modals (only one is visible at a time)
//   const modalScale = useRef(new Animated.Value(0.9)).current;
//   const modalOpacity = useRef(new Animated.Value(0)).current;

//   const runModalOpenAnim = () => {
//     modalScale.setValue(0.9);
//     modalOpacity.setValue(0);
//     Animated.parallel([
//       Animated.spring(modalScale, {
//         toValue: 1,
//         useNativeDriver: true,
//         speed: 18,
//         bounciness: 6,
//       }),
//       Animated.timing(modalOpacity, {
//         toValue: 1,
//         duration: 180,
//         easing: Easing.out(Easing.quad),
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   useEffect(() => {
//     if (uid) {
//       fetchPlayerStatsByUid(uid).then(
//         (data: { wins: number; losses: number; draws: number }) => {
//           setStats(data);
//           setLoading(false);
//         },
//       );
//     } else {
//       setLoading(false);
//     }
//   }, [uid]);

//   const openRemoveModal = () => {
//     setRemoveModalVisible(true);
//     runModalOpenAnim();
//   };

//   const confirmRemove = () => {
//     setRemoveModalVisible(false);
//     removeFriend(name);
//     navigation.goBack();
//   };

//   const handleInvite = () => {
//     sendInvitation(name);
//     setInviteSentModalVisible(true);
//     runModalOpenAnim();
//   };

//   const wins = stats?.wins ?? 0;
//   const losses = stats?.losses ?? 0;
//   const draws = stats?.draws ?? 0;
//   const totalGames = wins + losses + draws;
//   const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

//   // Rank label — content-driven, sirf decorative number hoina: actual
//   // performance bata derive garine tier
//   const rankLabel =
//     totalGames === 0
//       ? 'UNRANKED'
//       : winRate >= 70
//       ? 'CHAMPION'
//       : winRate >= 50
//       ? 'CONTENDER'
//       : winRate >= 30
//       ? 'RISING'
//       : 'ROOKIE';

//   return (
//     <ImageBackground
//     source={require('../../images/bg3.png')}
//       style={s.container}
//       resizeMode="cover">
//        <View style={s.container}>
//       {/* Header */}
//       <View style={s.header}>
//         <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
//           <ArrowLeft size={19} color="#F5EFE0" />
//         </TouchableOpacity>
//         <Text style={s.headerTitle}>Player Card</Text>
//         <View style={{ width: 36 }} />
//       </View>

//       {/* ===== Floating avatar ===== */}
//       <View style={s.avatarFloatWrap}>
//         <View style={s.avatarRing}>
//           {avatarSource ? (
//             <Image source={avatarSource} style={s.avatar} />
//           ) : photo ? (
//             <Image source={{ uri: photo }} style={s.avatar} />
//           ) : (
//             <View style={s.avatarFallback}>
//               <User size={32} color="#F5EFE0" />
//             </View>
//           )}
//         </View>
//       </View>

//       {/* ===== Card body ===== */}
//       <View style={s.card}>
//         <Text style={s.name} numberOfLines={1}>
//           {name}
//         </Text>

//         {loading ? (
//           <ActivityIndicator color="#E0972A" style={{ marginTop: 30 }} />
//         ) : totalGames === 0 ? (
//           <Text style={s.noStatsNote}>
//             {uid
//               ? "This player hasn't logged a result yet"
//               : 'Stats not linked for this player yet'}
//           </Text>
//         ) : (
//           <>
//             <View style={s.winRateBlock}>
//               <View style={s.winRateNumRow}>
//                 <Text style={s.winRateNum}>{winRate}</Text>
//                 <Text style={s.winRatePct}>%</Text>
//                 <Text style={s.winRateWord}>win rate</Text>
//               </View>
//               <View style={s.winRateTrack}>
//                 <View style={[s.winRateFill, { width: `${winRate}%` }]} />
//               </View>
//             </View>

//             <View style={s.chipsRow}>
//               <View style={[s.chip, s.chipWin]}>
//                 <Text style={s.chipValue}>{wins}</Text>
//                 <Text style={s.chipLabel}>WINS</Text>
//               </View>
//               <View style={[s.chip, s.chipLoss]}>
//                 <Text style={s.chipValue}>{losses}</Text>
//                 <Text style={s.chipLabel}>LOSSES</Text>
//               </View>
//               <View style={[s.chip, s.chipDraw]}>
//                 <Text style={s.chipValue}>{draws}</Text>
//                 <Text style={s.chipLabel}>DRAWS</Text>
//               </View>
//             </View>

//             <Text style={s.gamesFooter}>
//               {totalGames} game{totalGames === 1 ? '' : 's'} played
//             </Text>
//           </>
//         )}
//       </View>

//       {/* ===== Actions ===== */}
//       <View style={s.actionsWrap}>
//         <TouchableOpacity
//           style={s.inviteBtn}
//           activeOpacity={0.85}
//           onPress={handleInvite}
//         >
//           <Send size={17} color="#12194A" />
//           <Text style={s.inviteBtnText}>Invite to Game</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={s.removeBtn}
//           activeOpacity={0.7}
//           onPress={openRemoveModal}
//         >
//           <Trash2 size={15} color="#E9877D" />
//           <Text style={s.removeBtnText}>Remove Friend</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Remove friend confirmation modal */}
//       <Modal
//         transparent
//         visible={removeModalVisible}
//         animationType="none"
//         statusBarTranslucent
//         onRequestClose={() => setRemoveModalVisible(false)}
//       >
//         <Pressable
//           style={s.backdrop}
//           onPress={() => setRemoveModalVisible(false)}
//         >
//           <Animated.View
//             style={[
//               s.modalCard,
//               { opacity: modalOpacity, transform: [{ scale: modalScale }] },
//             ]}
//             onStartShouldSetResponder={() => true}
//           >
//             <View style={[s.modalIconCircle, { backgroundColor: '#3A2226' }]}>
//               <AlertTriangle size={26} color="#E9877D" />
//             </View>
//             <Text style={s.modalTitle}>Remove Friend</Text>
//             <Text style={s.modalMessage}>
//               Do you want remove {name} from your game friends?
//             </Text>
//             <View style={s.modalBtnRow}>
//               <TouchableOpacity
//                 style={[s.modalBtn, s.modalCancelBtn]}
//                 activeOpacity={0.7}
//                 onPress={() => setRemoveModalVisible(false)}
//               >
//                 <Text style={s.modalCancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[s.modalBtn, s.modalDestructiveBtn]}
//                 activeOpacity={0.85}
//                 onPress={confirmRemove}
//               >
//                 <Text style={s.modalDestructiveBtnText}>Remove</Text>
//               </TouchableOpacity>
//             </View>
//           </Animated.View>
//         </Pressable>
//       </Modal>

//       {/* Invitation sent modal */}
//       <Modal
//         transparent
//         visible={inviteSentModalVisible}
//         animationType="none"
//         statusBarTranslucent
//         onRequestClose={() => setInviteSentModalVisible(false)}
//       >
//         <Pressable
//           style={s.backdrop}
//           onPress={() => setInviteSentModalVisible(false)}
//         >
//           <Animated.View
//             style={[
//               s.modalCard,
//               { opacity: modalOpacity, transform: [{ scale: modalScale }] },
//             ]}
//             onStartShouldSetResponder={() => true}
//           >
//             <View style={[s.modalIconCircle, { backgroundColor: '#1E3A2E' }]}>
//               <CheckCircle2 size={26} color="#5FD68F" />
//             </View>
//             <Text style={s.modalTitle}>Invitation sent</Text>
//             <Text style={s.modalMessage}>Invite has been send to {name}</Text>
//             <TouchableOpacity
//               style={s.modalConfirmBtnFull}
//               activeOpacity={0.85}
//               onPress={() => setInviteSentModalVisible(false)}
//             >
//               <Text style={s.modalConfirmBtnText}>Okay</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </Pressable>
//       </Modal>
//     </View>
//     </ImageBackground>
   
//   );
// };

// export default PlayerProfileScreen;


// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     // backgroundColor: '#12194A',
//     paddingTop: 50,
//     paddingHorizontal: 24,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
//   iconBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(255,255,255,0.06)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#aeb3c1',
//     letterSpacing: 2.5,
//     textTransform: 'uppercase',
//   },

//   // ===== Floating avatar =====
//   avatarFloatWrap: {
//     alignItems: 'center',
//     zIndex: 2,
//     marginBottom: -46,
//   },
//   avatarRing: {
//     width: 96,
//     height: 96,
//     borderRadius: 48,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#1B2560',
//     borderWidth: 3,
//     borderColor: '#E0972A',
//   },
//   avatar: { width: 84, height: 84, borderRadius: 42 },
//   avatarFallback: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     backgroundColor: 'rgba(255,255,255,0.06)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rankPill: {
//     marginTop: -10,
//     backgroundColor: '#E0972A',
//     paddingHorizontal: 14,
//     paddingVertical: 4,
//     borderRadius: 12,
//     zIndex: 3,
//   },
//   rankPillText: {
//     fontSize: 10,
//     fontWeight: '900',
//     color: '#12194A',
//     letterSpacing: 1.5,
//   },

//   // ===== Card body =====
//   card: {
//     backgroundColor: '#1B2560',
//     borderRadius: 28,
//     paddingTop: 58,
//     paddingBottom: 26,
//     paddingHorizontal: 22,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(224,151,42,0.18)',
//   },
//   name: {
//     fontSize: 21,
//     fontWeight: '800',
//     color: '#F5EFE0',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   noStatsNote: {
//     fontSize: 13,
//     color: '#8B93AE',
//     fontWeight: '500',
//     textAlign: 'center',
//     paddingVertical: 20,
//   },

//   winRateBlock: { width: '100%', marginBottom: 22 },
//   winRateNumRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     justifyContent: 'center',
//     marginBottom: 10,
//   },
//   winRateNum: {
//     fontSize: 44,
//     fontWeight: '900',
//     color: '#E0972A',
//     lineHeight: 46,
//   },
//   winRatePct: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#E0972A',
//     marginBottom: 4,
//     marginRight: 8,
//   },
//   winRateWord: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#8B93AE',
//     letterSpacing: 0.5,
//     marginBottom: 8,
//   },
//   winRateTrack: {
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255,255,255,0.08)',
//     overflow: 'hidden',
//   },
//   winRateFill: {
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#E0972A',
//   },

//   chipsRow: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 10,
//     marginBottom: 16,
//   },
//   chip: {
//     flex: 1,
//     borderRadius: 16,
//     paddingVertical: 14,
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.04)',
//     borderWidth: 1,
//   },
//   chipWin: { borderColor: 'rgba(60,203,127,0.3)' },
//   chipLoss: { borderColor: 'rgba(233,135,125,0.3)' },
//   chipDraw: { borderColor: 'rgba(139,147,174,0.3)' },
//   chipValue: {
//     fontSize: 20,
//     fontWeight: '900',
//     color: '#F5EFE0',
//     marginBottom: 3,
//   },
//   chipLabel: {
//     fontSize: 9.5,
//     fontWeight: '800',
//     color: '#8B93AE',
//     letterSpacing: 1,
//   },

//   gamesFooter: {
//     fontSize: 12,
//     color: '#8B93AE',
//     fontWeight: '600',
//   },

//   // ===== Actions =====
//   actionsWrap: {
//     marginTop: 22,
//   },
//   inviteBtn: {
//     flexDirection: 'row',
//     backgroundColor: '#E0972A',
//     paddingVertical: 16,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 9,
//     marginBottom: 10,
//     shadowColor: '#E0972A',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   inviteBtnText: { color: '#12194A', fontWeight: '800', fontSize: 15 },

//   removeBtn: {
//     flexDirection: 'row',
//     backgroundColor: 'transparent',
//     paddingVertical: 12,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 6,
//   },
//   removeBtnText: { color: '#E9877D', fontWeight: '700', fontSize: 13.5 },

//   // Modal styles (Remove Friend / Invitation sent) — dark modal, '#8B93AE'
//   backdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 32,
//   },
//   modalCard: {
//     width: '100%',
//     maxWidth: 340,
//     backgroundColor: '#1B2560',
//     borderRadius: 22,
//     paddingVertical: 26,
//     paddingHorizontal: 22,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.06)',
//   },
//   modalIconCircle: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 14,
//   },
//   modalTitle: {
//     fontSize: 17,
//     fontWeight: 'bold',
//     color: '#F5EFE0',
//     marginBottom: 6,
//     textAlign: 'center',
//   },
//   modalMessage: {
//     fontSize: 13.5,
//     color: '#8B93AE',
//     textAlign: 'center',
//     lineHeight: 19,
//     marginBottom: 22,
//   },
//   modalBtnRow: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 10,
//   },
//   modalBtn: {
//     flex: 1,
//     paddingVertical: 13,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   modalCancelBtn: {
//     backgroundColor: 'rgba(255,255,255,0.06)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.08)',
//   },
//   modalCancelBtnText: { color: '#F5EFE0', fontWeight: '700', fontSize: 14.5 },
//   modalConfirmBtnFull: {
//     width: '100%',
//     backgroundColor: '#E0972A',
//     paddingVertical: 13,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   modalConfirmBtnText: { color: '#12194A', fontWeight: '800', fontSize: 14.5 },
//   modalDestructiveBtn: {
//     backgroundColor: '#B31B34',
//   },
//   modalDestructiveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
// });

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  Pressable,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useGameLogic } from '../GameLogicContext';
import {
  ArrowLeft,
  User,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
  Trophy,
} from 'lucide-react-native';
import { getAvatarSource } from '../../avatar/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, any>;
};

// Rank tiers -> color so the ring / badge changes with performance,
// like a "rank" indicator in most game profile cards
const RANKS = [
  { min: 70, label: 'CHAMPION', color: '#E0972A' },
  { min: 50, label: 'CONTENDER', color: '#5FA8E0' },
  { min: 30, label: 'RISING', color: '#8FBF6A' },
  { min: 0, label: 'ROOKIE', color: '#8B93AE' },
];

const PlayerProfileScreen = ({ navigation, route }: Props) => {
  const { name, uid, photo, avatarId } = (route.params as any) || {};
  const { removeFriend, fetchPlayerStatsByUid, sendInvitation } =
    useGameLogic();

  const avatarSource = getAvatarSource(avatarId);

  const [stats, setStats] = useState<{
    wins: number;
    losses: number;
    draws: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [inviteSentModalVisible, setInviteSentModalVisible] = useState(false);

  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const runModalOpenAnim = () => {
    modalScale.setValue(0.9);
    modalOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (uid) {
      fetchPlayerStatsByUid(uid).then(
        (data: { wins: number; losses: number; draws: number }) => {
          setStats(data);
          setLoading(false);
        },
      );
    } else {
      setLoading(false);
    }
  }, [uid]);

  const openRemoveModal = () => {
    setRemoveModalVisible(true);
    runModalOpenAnim();
  };

  const confirmRemove = () => {
    setRemoveModalVisible(false);
    removeFriend(name);
    navigation.goBack();
  };

  const handleInvite = () => {
    sendInvitation(name);
    setInviteSentModalVisible(true);
    runModalOpenAnim();
  };

  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const draws = stats?.draws ?? 0;
  const totalGames = wins + losses + draws;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const rank =
    totalGames === 0
      ? { label: 'UNRANKED', color: '#8B93AE' }
      : RANKS.find((r) => winRate >= r.min)!;

  return (
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.bg}
      resizeMode="cover"
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={19} color="#F5EFE0" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Player Card</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ===== Floating avatar + rank ring ===== */}
        <View style={s.avatarFloatWrap}>
          <View style={[s.avatarRing, { borderColor: rank.color }]}>
            {avatarSource ? (
              <Image source={avatarSource} style={s.avatar} />
            ) : photo ? (
              <Image source={{ uri: photo }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <User size={32} color="#F5EFE0" />
              </View>
            )}
          </View>

          {/* Rank badge overlapping the ring, like a level/tier chip */}
          <View style={[s.rankPill, { backgroundColor: rank.color }]}>
            {/* <Trophy size={11} color="#12194A" /> */}
            <Text style={s.rankPillText}>{name}</Text>
          </View>
        </View>

        {/* ===== Card body ===== */}
        <View style={s.card}>
          {/* <Text style={s.name} numberOfLines={1}>
            {name}
          </Text> */}

          {loading ? (
            <ActivityIndicator color="#E0972A" style={{ marginTop: 30 }} />
          ) : totalGames === 0 ? (
            <Text style={s.noStatsNote}>
              {uid
                ? "This player hasn't logged a result yet"
                : 'Stats not linked for this player yet'}
            </Text>
          ) : (
            <>
              <View style={s.winRateBlock}>
                <View style={s.winRateNumRow}>
                  <Text style={[s.winRateNum, { color: rank.color }]}>
                    {winRate}
                  </Text>
                  <Text style={[s.winRatePct, { color: rank.color }]}>%</Text>
                  <Text style={s.winRateWord}>win rate</Text>
                </View>
                <View style={s.winRateTrack}>
                  <View
                    style={[
                      s.winRateFill,
                      { width: `${winRate}%`, backgroundColor: rank.color },
                    ]}
                  />
                </View>
              </View>

              <View style={s.chipsRow}>
                <View style={[s.chip, s.chipWin]}>
                  <Text style={s.chipValue}>{wins}</Text>
                  <Text style={s.chipLabel}>WINS</Text>
                </View>
                <View style={[s.chip, s.chipLoss]}>
                  <Text style={s.chipValue}>{losses}</Text>
                  <Text style={s.chipLabel}>LOSSES</Text>
                </View>
                <View style={[s.chip, s.chipDraw]}>
                  <Text style={s.chipValue}>{draws}</Text>
                  <Text style={s.chipLabel}>DRAWS</Text>
                </View>
              </View>

              <Text style={s.gamesFooter}>
                {totalGames} game{totalGames === 1 ? '' : 's'} played
              </Text>
            </>
          )}
        </View>

        {/* ===== Actions ===== */}
        <View style={s.actionsWrap}>
          <TouchableOpacity
            style={s.inviteBtn}
            activeOpacity={0.85}
            onPress={handleInvite}
          >
            <Send size={17} color="#12194A" />
            <Text style={s.inviteBtnText}>Invite to Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.removeBtn}
            activeOpacity={0.7}
            onPress={openRemoveModal}
          >
            <Trash2 size={15} color="#E9877D" />
            <Text style={s.removeBtnText}>Remove Friend</Text>
          </TouchableOpacity>
        </View>

        {/* Remove friend confirmation modal */}
        <Modal
          transparent
          visible={removeModalVisible}
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setRemoveModalVisible(false)}
        >
          <Pressable
            style={s.backdrop}
            onPress={() => setRemoveModalVisible(false)}
          >
            <Animated.View
              style={[
                s.modalCard,
                { opacity: modalOpacity, transform: [{ scale: modalScale }] },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[s.modalIconCircle, { backgroundColor: '#3A2226' }]}>
                <AlertTriangle size={26} color="#E9877D" />
              </View>
              <Text style={s.modalTitle}>Remove Friend</Text>
              <Text style={s.modalMessage}>
                Do you want remove {name} from your game friends?
              </Text>
              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalCancelBtn]}
                  activeOpacity={0.7}
                  onPress={() => setRemoveModalVisible(false)}
                >
                  <Text style={s.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalDestructiveBtn]}
                  activeOpacity={0.85}
                  onPress={confirmRemove}
                >
                  <Text style={s.modalDestructiveBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Invitation sent modal */}
        <Modal
          transparent
          visible={inviteSentModalVisible}
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setInviteSentModalVisible(false)}
        >
          <Pressable
            style={s.backdrop}
            onPress={() => setInviteSentModalVisible(false)}
          >
            <Animated.View
              style={[
                s.modalCard,
                { opacity: modalOpacity, transform: [{ scale: modalScale }] },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[s.modalIconCircle, { backgroundColor: '#1E3A2E' }]}>
                <CheckCircle2 size={26} color="#5FD68F" />
              </View>
              <Text style={s.modalTitle}>Invitation sent</Text>
              <Text style={s.modalMessage}>Invite has been send to {name}</Text>
              <TouchableOpacity
                style={s.modalConfirmBtnFull}
                activeOpacity={0.85}
                onPress={() => setInviteSentModalVisible(false)}
              >
                <Text style={s.modalConfirmBtnText}>Okay</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default PlayerProfileScreen;

const s = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#aeb3c1',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },

  // ===== Floating avatar + rank badge =====
  avatarFloatWrap: {
    alignItems: 'center',
    zIndex: 2,
    marginBottom: -22,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2560',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  rankPillText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#12194A',
    letterSpacing: 1.2,
  },

  // ===== Card body =====
  card: {
    backgroundColor: '#1B2560',
    borderRadius: 28,
    paddingTop: 46,
    paddingBottom: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.18)',
  },
  name: {
    fontSize: 21,
    fontWeight: '800',
    color: '#F5EFE0',
    marginBottom: 20,
    textAlign: 'center',
  },
  noStatsNote: {
    fontSize: 13,
    color: '#8B93AE',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 20,
  },

  winRateBlock: { width: '100%', marginBottom: 22 },
  winRateNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 10,
  },
  winRateNum: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 46,
  },
  winRatePct: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    marginRight: 8,
  },
  winRateWord: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B93AE',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  winRateTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  winRateFill: {
    height: 8,
    borderRadius: 4,
  },

  chipsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
  },
  chipWin: { borderColor: 'rgba(60,203,127,0.3)' },
  chipLoss: { borderColor: 'rgba(233,135,125,0.3)' },
  chipDraw: { borderColor: 'rgba(139,147,174,0.3)' },
  chipValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F5EFE0',
    marginBottom: 3,
  },
  chipLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B93AE',
    letterSpacing: 1,
  },

  gamesFooter: {
    fontSize: 12,
    color: '#8B93AE',
    fontWeight: '600',
  },

  // ===== Actions =====
  actionsWrap: {
    marginTop: 22,
  },
  inviteBtn: {
    flexDirection: 'row',
    backgroundColor: '#E0972A',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 10,
    shadowColor: '#E0972A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  inviteBtnText: { color: '#12194A', fontWeight: '800', fontSize: 15 },

  removeBtn: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  removeBtnText: { color: '#E9877D', fontWeight: '700', fontSize: 13.5 },

  // Modal styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1B2560',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F5EFE0',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    color: '#8B93AE',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalCancelBtnText: { color: '#F5EFE0', fontWeight: '700', fontSize: 14.5 },
  modalConfirmBtnFull: {
    width: '100%',
    backgroundColor: '#E0972A',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: { color: '#12194A', fontWeight: '800', fontSize: 14.5 },
  modalDestructiveBtn: {
    backgroundColor: '#B31B34',
  },
  modalDestructiveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
});