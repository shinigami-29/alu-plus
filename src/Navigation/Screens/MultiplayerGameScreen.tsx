
// import React, { useEffect, useState, useRef, useMemo } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Modal,
//   Image,
//   ImageBackground,
//   Animated,
// } from 'react-native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { AlertTriangle } from 'lucide-react-native';
// import { useGameLogic } from '../GameLogicContext';
// import { useAuth } from '../../context/AuthContext';
// import { getAvatarSource } from '../../avatar/Avatar';

// type Props = { navigation: NativeStackNavigationProp<any> };

// // sabai possible winning combos (row, column, diagonal)
// const WIN_LINES = [
//   [0, 1, 2],
//   [3, 4, 5],
//   [6, 7, 8],
//   [0, 3, 6],
//   [1, 4, 7],
//   [2, 5, 8],
//   [0, 4, 8],
//   [2, 4, 6],
// ];

// // board bata kun 3 ta cell le win banayo tyo pattaunu (indices matra)
// function findWinningLine(board: any[]): number[] | null {
//   for (const line of WIN_LINES) {
//     const [a, b, c] = line;
//     if (board[a] && board[a] === board[b] && board[a] === board[c]) {
//       return line;
//     }
//   }
//   return null;
// }

// // winning line ko geometry (center, length, angle) nikalne, 3x3 grid, cell 96px
// const CELL = 96;
// const BOARD_SIZE = CELL * 3;
// function getLineGeometry(line: number[]) {
//   const [a, , c] = line;
//   const rowA = Math.floor(a / 3);
//   const colA = a % 3;
//   const rowC = Math.floor(c / 3);
//   const colC = c % 3;

//   if (rowA === rowC) {
//     // horizontal (row) line
//     return { cx: BOARD_SIZE / 2, cy: rowA * CELL + CELL / 2, length: BOARD_SIZE, angle: 0 };
//   }
//   if (colA === colC) {
//     // vertical (column) line
//     return { cx: colA * CELL + CELL / 2, cy: BOARD_SIZE / 2, length: BOARD_SIZE, angle: 90 };
//   }
//   const diagLength = Math.sqrt(BOARD_SIZE * BOARD_SIZE + BOARD_SIZE * BOARD_SIZE);
//   if (a === 0) {
//     // top-left to bottom-right
//     return { cx: BOARD_SIZE / 2, cy: BOARD_SIZE / 2, length: diagLength, angle: 45 };
//   }
//   // top-right to bottom-left
//   return { cx: BOARD_SIZE / 2, cy: BOARD_SIZE / 2, length: diagLength, angle: -45 };
// }

// const MultiplayerGameScreen = ({ navigation }: Props) => {
//   const {
//     board,
//     winner,
//     isDraw,
//     myRole,
//     myName,
//     opponentName,
//     opponentPhoto,
//     opponentAvatarId,
//     isMyTurn,
//     currentPlayer,
//     roomCode,
//     handleMultiplayerPress,
//     requestRematch,
//     myRematchRequested,
//     opponentRematchRequested,
//     leaveRoom,
//   } = useGameLogic();

//   const { user, userProfile, recordGameResult } = useAuth();
//   const myAvatarSource = getAvatarSource(userProfile?.avatarId);
//   const myPhoto = userProfile?.photoURL || user?.photoURL || null;

//   // opponent ko avatarId — GameLogic bata aauxa (room/invite/random match jahaan bata pani)
//   const opponentAvatarSource = getAvatarSource(opponentAvatarId);

//   const [myWins, setMyWins] = useState(0);
//   const [opponentWins, setOpponentWins] = useState(0);

//   const [popupVisible, setPopupVisible] = useState(false);
//   const lineAnim = useRef(new Animated.Value(0)).current;
//   const popupTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

//   const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);


//   const [resultSnapshot, setResultSnapshot] = useState<{
//     winner: string | null;
//     isDraw: boolean;
//   } | null>(null);

//   // aile ko board bata winning line (agar xa vane) nikalne
//   const winningLine = useMemo(
//     () => (winner ? findWinningLine(board) : null),
//     [board, winner],
//   );

//   useEffect(() => {
//     if (winner) {
//       if (winner === myRole) {
//         setMyWins(prev => prev + 1);
//       } else {
//         setOpponentWins(prev => prev + 1);
//       }
//     } else if (isDraw) {
//       recordGameResult('draw');
//     }
//   }, [winner, isDraw]);

//   useEffect(() => {
//     const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
//       const actionType = e.data?.action?.type;
//       if (actionType === 'GO_BACK' || actionType === 'POP') {
//         leaveRoom();
//       }
//     });
//     return unsubscribe;
//   }, [navigation, leaveRoom]);

//   // line draw hune ani tyo pura khelchepachi matra popup deखिne
//   useEffect(() => {
//     if (popupTimerRef.current) clearTimeout(popupTimerRef.current);

//     if (winner) {
//       setPopupVisible(false);
//       lineAnim.setValue(0);
//       Animated.timing(lineAnim, {
//         toValue: 1,
//         duration: 450,
//         useNativeDriver: true,
//       }).start(() => {
//         popupTimerRef.current = setTimeout(() => {
//           setResultSnapshot({ winner, isDraw: false });
//           setPopupVisible(true);
//         }, 350);
//       });
//     } else if (isDraw) {
//       setResultSnapshot({ winner: null, isDraw: true });
//       setPopupVisible(true);
//     } else {
//       // NOTE: resultSnapshot yaha clear gardaina — Modal fade-out huda pani
//       // purano (sahi) winner/draw text nai dekhincha, naya galat text hoina
//       setPopupVisible(false);
//       lineAnim.setValue(0);
//     }

//     return () => {
//       if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
//     };
//   }, [winner, isDraw]);

//   // resultText/resultSubtitle ab resultSnapshot bata aaucha, live winner bata hoina
//   const resultText = resultSnapshot?.isDraw
//     ? 'DRAW!'
//     : resultSnapshot?.winner
//     ? resultSnapshot.winner === myRole
//       ? 'YOU WIN!'
//       : 'YOU LOSE!'
//     : '';

//   const resultSubtitle = resultSnapshot?.isDraw
//     ? "It's a tie!"
//     : resultSnapshot?.winner
//     ? resultSnapshot.winner === myRole
//       ? 'Congratulations!'
//       : `${opponentName || 'Opponent'} wins!`
//     : '';

//   // NEW: "Leave" button ley ab seedhai goBack nagarera confirm popup kholcha
//   const handleLeave = () => {
//     setLeaveConfirmVisible(true);
//   };


//   const confirmLeave = () => {
//     setLeaveConfirmVisible(false);
//     navigation.goBack();
//   };

//   const cancelLeave = () => {
//     setLeaveConfirmVisible(false);
//   };

//   // Player card ko lagi avatar — avatarSource (preset) > photo > first letter
//   const renderAvatar = (
//     name: string,
//     photo: string | null,
//     active: boolean,
//     avatarSource?: any,
//   ) => {
//     if (avatarSource) {
//       return (
//         <Image
//           source={avatarSource}
//           style={[s.avatar, active && s.activeAvatarBorder]}
//         />
//       );
//     }
//     if (photo) {
//       return (
//         <Image
//           source={{ uri: photo }}
//           style={[s.avatar, active && s.activeAvatarBorder]}
//         />
//       );
//     }
//     return (
//       <View style={[s.avatarCircle, active && s.activeAvatarBorder]}>
//         <Text style={s.avatarLetter}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
//       </View>
//     );
//   };

//   // winning line ko style (position + animated draw), GameScreen jastai
//   const lineStyle = useMemo(() => {
//     if (!winningLine) return null;
//     const { cx, cy, length, angle } = getLineGeometry(winningLine);
//     return {
//       top: cy - 4,
//       left: cx - length / 2,
//       width: length,
//       backgroundColor: '#1A1A1A',
//       transform: [{ rotate: `${angle}deg` }, { scaleX: lineAnim }],
//     };
//   }, [winningLine, lineAnim]);

//   return (
//     <ImageBackground
//       source={require('../../images/bg3.png')}
//       style={s.container}
//       resizeMode="cover"
//     >
//       <View style={s.container}>
//         {/* Title */}
//         <View style={s.titleWrap}>
//           <Text style={s.title}>आलु प्लस</Text>
//           <View style={s.titleUnderline} />
//         </View>
//         <Text style={s.roomCode}>Room: {roomCode}</Text>

//         <View style={s.playerRow}>
//           {/* My card — always left/first */}
//           <View style={[s.badge, currentPlayer === myRole && s.activeBadge]}>
//             {renderAvatar(
//               myName,
//               myPhoto,
//               currentPlayer === myRole,
//               myAvatarSource,
//             )}
//             <Text
//               style={[
//                 s.badgeText,
//                 currentPlayer !== myRole && s.inactiveBadgeText,
//               ]}
//               numberOfLines={1}
//             >
//               {myName} ({myRole})
//             </Text>
//             <Text
//               style={[s.winCount, currentPlayer === myRole && s.activeText]}
//             >
//               Wins: {myWins}
//             </Text>
//           </View>

//           <View style={s.vsWrap}>
//             <Text style={s.vs}>VS</Text>
//           </View>

//           {/* Opponent card — always right/second */}
//           <View style={[s.badge, currentPlayer !== myRole && s.activeBadge]}>
//             {renderAvatar(
//               opponentName || '?',
//               opponentPhoto,
//               currentPlayer !== myRole,
//               opponentAvatarSource,
//             )}
//             {/* <Text
//               style={[
//                 s.badgeText,
//                 currentPlayer === myRole && s.inactiveBadgeText,
//               ]}
//               numberOfLines={1}
//             >
//               {opponentName || '?'} ({myRole === 'X' ? 'O' : 'X'})
//             </Text> */}
//             <Text
//   style={[
//     s.badgeText,
//     currentPlayer !== myRole && s.inactiveBadgeText,
//   ]}
//   numberOfLines={1}
//   adjustsFontSizeToFit
//   minimumFontScale={0.7}
// >
//   {opponentName || '?'} ({myRole === 'X' ? 'O' : 'X'})
// </Text>
//             <Text
//               style={[s.winCount, currentPlayer !== myRole && s.activeText]}
//             >
//               Wins: {opponentWins}
//             </Text>
//           </View>
//         </View>

//         {!winner && !isDraw && (
//           <View
//             style={[
//               s.turnBanner,
//               { borderColor: isMyTurn ? '#1f8552' : '#B31B34' },
//             ]}
//           >
//             <View
//               style={[
//                 s.turnIconCircle,
//                 { borderColor: isMyTurn ? '#1f8552' : '#B31B34' },
//               ]}
//             >
//               {isMyTurn ? (
//                 myAvatarSource ? (
//                   <Image source={myAvatarSource} style={s.turnAvatarImg} />
//                 ) : myPhoto ? (
//                   <Image source={{ uri: myPhoto }} style={s.turnAvatarImg} />
//                 ) : (
//                   <Text style={s.turnAvatarLetter}>
//                     {myName?.[0]?.toUpperCase() ?? '?'}
//                   </Text>
//                 )
//               ) : opponentAvatarSource ? (
//                 <Image source={opponentAvatarSource} style={s.turnAvatarImg} />
//               ) : opponentPhoto ? (
//                 <Image source={{ uri: opponentPhoto }} style={s.turnAvatarImg} />
//               ) : (
//                 <Text style={s.turnAvatarLetter}>
//                   {(opponentName || '?')[0]?.toUpperCase() ?? '?'}
//                 </Text>
//               )}  
//             </View>
//             <View style={s.turnTextWrap}>
//               <Text style={s.turnMainText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
//                 {isMyTurn ? 'Your Turn' : `${opponentName || 'Opponent'}'s Turn`}
//               </Text>
//               <Text style={s.turnSubText}>
//                 {isMyTurn ? 'Tap a cell to play' : 'Please wait...'}
//               </Text>
//             </View>
//           </View>
//         )}

//         <View style={s.boardCard}>
//           {/* wrapper so the winning-line overlay lines up exactly with the grid */}
//           <View style={s.boardWrapper}>
//             <View style={s.board}>
//               {board.map((cell: any, index: number) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={[
//                     s.cell,
//                     (index + 1) % 3 !== 0 && s.cellBorderRight,
//                     index < 6 && s.cellBorderBottom,
//                   ]}
//                   activeOpacity={0.7}
//                   onPress={() => handleMultiplayerPress(index)}
//                 >
//                   <Text style={s.cellText}>{cell}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* animated strike-through line drawn over the winning combo */}
//             {lineStyle && <Animated.View style={[s.winLine, lineStyle]} />}
//           </View>
//         </View>

//         <TouchableOpacity
//           style={s.leaveBtn}
//           activeOpacity={0.85}
//           onPress={handleLeave}
//         >
//           <Text style={s.leaveText}>Leave</Text>
//         </TouchableOpacity>

//         {/* Win/Loss/Draw Popup — ab popupVisible le control garcha, winner detect
//             vayeko bittikai hoina, line khelchepachi matra */}
//         <Modal visible={popupVisible} transparent animationType="fade">
//           <View style={s.modalOverlay}>
//             <View style={s.modalBox}>
//               <View
//                 style={[
//                   s.iconCircle,
//                   resultSnapshot?.isDraw
//                     ? s.iconCircleDraw
//                     : resultSnapshot?.winner === myRole
//                     ? s.iconCircleWin
//                     : s.iconCircleLose,
//                 ]}
//               >
//                 <Text style={s.iconText}>
//                   {resultSnapshot?.isDraw
//                     ? '🤝'
//                     : resultSnapshot?.winner === myRole
//                     ? '🏆'
//                     : '💔'}
//                 </Text>
//               </View>

//               <Text style={s.modalTitle}>{resultText}</Text>
//               <Text style={s.modalSubtitle}>{resultSubtitle}</Text>

//               <View style={s.scoreRow}>
//                 <View style={s.scorePill}>
//                   <Text style={s.scorePillLabel}>{myName}</Text>
//                   <Text style={s.scorePillValue}>{myWins}</Text>
//                 </View>
//                 {/* <View style={s.scorePill}>
//                   <Text style={s.scorePillLabel}>
//                     {opponentName || 'Opponent'}
//                   </Text>
//                   <Text style={s.scorePillValue}>{opponentWins}</Text>
//                 </View> */}
//                 <View style={s.scorePill}>
//   <Text style={s.scorePillLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
//     {myName}
//   </Text>
//   <Text style={s.scorePillValue}>{myWins}</Text>
// </View>
// <View style={s.scorePill}>
//   <Text style={s.scorePillLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
//     {opponentName || 'Opponent'}
//   </Text>
//   <Text style={s.scorePillValue}>{opponentWins}</Text>
// </View>
//               </View>

//               {myRematchRequested ? (
//                 <View style={s.waitingBox}>
//                   <Text style={s.waitingText}>
//                     {opponentRematchRequested
//                       ? 'Starting rematch...'
//                       : `Waiting for ${
//                           opponentName || 'opponent'
//                         } to play again...`}
//                   </Text>
//                 </View>
//               ) : (
//                 <>
//                   {opponentRematchRequested && (
//                     <Text style={s.rematchHintText}>
//                       {opponentName || 'Opponent'} wants a rematch!
//                     </Text>
//                   )}
//                   <TouchableOpacity
//                     style={s.playAgainBtn}
//                     activeOpacity={0.85}
//                     onPress={requestRematch}
//                   >
//                     <Text style={s.playAgainText}>Play Again</Text>
//                   </TouchableOpacity>
//                 </>
//               )}

//               <TouchableOpacity
//                 style={s.modalLeaveBtn}
//                 activeOpacity={0.85}
//                 onPress={handleLeave}
//               >
//                 <Text style={s.modalLeaveText}>Leave</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>

//         {/* NEW: "Are you sure you want to leave?" confirm popup — dubai
//             Leave button (in-game ra result popup) le yehi kholcha */}
//         <Modal
//           visible={leaveConfirmVisible}
//           transparent
//           animationType="fade"
//           onRequestClose={cancelLeave}
//         >
//           <View style={s.modalOverlay}>
//             <View style={s.confirmBox}>
//               <View style={s.confirmIconCircle}>
//                 <AlertTriangle size={26} color="#B31B34" />
//               </View>
//               <Text style={s.modalTitle}>Leave Game?</Text>
//               <Text style={s.modalSubtitle}>
//                 Are you sure you want to leave? The room will end for both
//                 players.
//               </Text>
//               <View style={s.confirmBtnRow}>
//                 <TouchableOpacity
//                   style={[s.confirmBtn, s.confirmCancelBtn]}
//                   activeOpacity={0.8}
//                   onPress={cancelLeave}
//                 >
//                   <Text style={s.confirmCancelBtnText}>Cancel</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={[s.confirmBtn, s.confirmLeaveBtn]}
//                   activeOpacity={0.85}
//                   onPress={confirmLeave}
//                 >
//                   <Text style={s.confirmLeaveBtnText}>Leave</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//       </View>
//     </ImageBackground>
//   );
// };

// export default MultiplayerGameScreen;

// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//     paddingHorizontal: 24,
//   },

//   titleWrap: {
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#FFF6E8',
//     letterSpacing: 1,
//     textShadowColor: 'rgba(150,20,40,0.45)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 6,
//   },
//   titleUnderline: {
//     marginTop: 6,
//     width: 48,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#E0972A',
//   },
//   roomCode: {
//     fontSize: 12,
//     color: '#FFF3DD',
//     fontWeight: '700',
//     marginTop: 8,
//     marginBottom: 18,
//     letterSpacing: 2,
//     textShadowColor: 'rgba(0,0,0,0.3)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 3,
//   },

//   playerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 14,
//     marginBottom: 20,
//     width: '100%',
//     justifyContent: 'center',
//   },
//   badge: {
//     backgroundColor: 'rgba(255,251,244,0.92)',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderRadius: 20,
//     alignItems: 'center',
//     flex: 1,
//     maxWidth: 140,
//     borderWidth: 1,
//     borderColor: 'rgba(224,151,42,0.35)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.12,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   activeBadge: {
//     backgroundColor: '#eb533fe8',
//     borderColor: '#0c2fde',
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     marginBottom: 8,
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   avatarCircle: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#003893',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 6,
//     borderWidth: 2,
//     borderColor: 'transparent',
//   },
//   activeAvatarBorder: {
//     borderColor: '#FFFDF8',
//   },
//   avatarLetter: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: 'bold',
//   },
//   badgeText: {
//     color: '#3A2A1E',
//     fontWeight: '700',
//     fontSize: 13,
//     textAlign: 'center',
//     marginBottom: 2,
//   },

//   turnBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,251,244,0.94)',
//     borderWidth: 2,
//     borderRadius: 18,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     marginBottom: 24,
//     minWidth: 220,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//   },
//   turnIconCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 2.5,
//     backgroundColor: '#FFFDF8',
//   },
//   turnAvatarImg: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//   },
//   turnAvatarLetter: {
//     fontSize: 15,
//     fontWeight: 'bold',
//     color: '#003893',
//   },
//   turnTextWrap: {
//     flex: 1,
//   },
//   turnMainText: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#3A2A1E',
//   },
//   turnSubText: {
//     fontSize: 11,
//     color: '#8A7A6A',
//     marginTop: 1,
//     fontWeight: '600',
//   },
//   winCount: {
//     color: '#8A7A6A',
//     fontSize: 11,
//     marginTop: 2,
//     fontWeight: '600',
//   },
//   activeText: {
//     color: '#3A2A1E',
//   },
//   inactiveBadgeText: {
//     color: '#3A2A1E',
//   },
//   vsWrap: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     backgroundColor: 'rgba(255,251,244,0.85)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(224,151,42,0.4)',
//   },
//   vs: {
//     fontWeight: '800',
//     color: '#e02a2a',
//     fontSize: 12,
//   },

//   boardCard: {
//     backgroundColor: 'rgba(255,251,244,0.92)',
//     borderRadius: 24,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(224,151,42,0.35)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.16,
//     shadowRadius: 10,
//     elevation: 6,
//     marginBottom: 8,
//   },
//   // exact-size wrapper so the winning line overlays the grid precisely
//   boardWrapper: {
//     width: BOARD_SIZE,
//     height: BOARD_SIZE,
//     position: 'relative',
//   },
//   board: {
//     width: BOARD_SIZE,
//     height: BOARD_SIZE,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     borderRadius: 16,
//     overflow: 'hidden',
//   },
//   cell: {
//     width: CELL,
//     height: CELL,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cellBorderRight: {
//     borderRightWidth: 1.5,
//     borderRightColor: 'rgba(19, 14, 14, 0.68)',
//   },
//   cellBorderBottom: {
//     borderBottomWidth: 1.5,
//     borderBottomColor: 'rgba(19, 14, 14, 0.68)',
//   },
//   cellText: {
//     fontSize: 44,
//     fontWeight: '800',
//     color: '#1A1A1A',
//   },
//   // the animated strike-through line itself
//   winLine: {
//     position: 'absolute',
//     height: 8,
//     borderRadius: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 5,
//   },

//   leaveBtn: {
//     marginTop: 22,
//     backgroundColor: 'rgba(255,251,244,0.9)',
//     borderWidth: 1,
//     borderColor: 'rgba(179,27,52,0.35)',
//     paddingHorizontal: 34,
//     paddingVertical: 13,
//     borderRadius: 14,
//   },
//   leaveText: {
//     color: '#B31B34',
//     fontWeight: '700',
//     fontSize: 15,
//   },

//   // Modal
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(50,20,20,0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 32,
//   },
//   modalBox: {
//     backgroundColor: '#FFFDF8',
//     borderRadius: 24,
//     paddingTop: 28,
//     paddingBottom: 24,
//     paddingHorizontal: 28,
//     width: '85%',
//     alignItems: 'center',
//     elevation: 12,
//     shadowColor: '#000',
//     shadowOpacity: 0.22,
//     shadowRadius: 18,
//     shadowOffset: { width: 0, height: 10 },
//   },
//   iconCircle: {
//     width: 84,
//     height: 84,
//     borderRadius: 42,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 14,
//     borderWidth: 4,
//     borderColor: '#FFFDF8',
//     elevation: 6,
//   },
//   iconCircleWin: { backgroundColor: 'rgba(31,133,82,0.18)' },
//   iconCircleLose: { backgroundColor: 'rgba(179,27,52,0.18)' },
//   iconCircleDraw: { backgroundColor: 'rgba(138,122,106,0.2)' },
//   iconText: { fontSize: 40 },
//   modalTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#3A2A1E',
//     letterSpacing: 0.5,
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   modalSubtitle: {
//     fontSize: 13,
//     color: '#8A7A6A',
//     marginBottom: 18,
//     textAlign: 'center',
//   },
//   scoreRow: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 20,
//     width: '100%',
//   },
//   scorePill: {
//     flex: 1,
//     backgroundColor: 'rgba(224,151,42,0.12)',
//     borderRadius: 14,
//     paddingVertical: 10,
//     alignItems: 'center',
//   },
//   scorePillLabel: {
//     fontSize: 11,
//     color: '#8A7A6A',
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   scorePillValue: {
//     fontSize: 20,
//     color: '#3A2A1E',
//     fontWeight: '800',
//   },
//   playAgainBtn: {
//     backgroundColor: '#003893',
//     paddingVertical: 14,
//     borderRadius: 14,
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   playAgainText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 15,
//   },
//   modalLeaveBtn: {
//     backgroundColor: 'rgba(179,27,52,0.08)',
//     borderWidth: 1,
//     borderColor: 'rgba(179,27,52,0.3)',
//     paddingVertical: 14,
//     borderRadius: 14,
//     width: '100%',
//     alignItems: 'center',
//   },
//   modalLeaveText: {
//     color: '#B31B34',
//     fontWeight: '700',
//     fontSize: 15,
//   },
//   waitingBox: {
//     paddingVertical: 14,
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   waitingText: {
//     color: '#3A2A1E',
//     fontSize: 14,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   rematchHintText: {
//     color: '#1f8552',
//     fontSize: 13,
//     fontWeight: '700',
//     textAlign: 'center',
//     marginBottom: 8,
//   },

//   // NEW: "Are you sure you want to leave?" confirm popup
//   confirmBox: {
//     width: '100%',
//     maxWidth: 340,
//     backgroundColor: '#FFFDF8',
//     borderRadius: 22,
//     paddingVertical: 26,
//     paddingHorizontal: 22,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.22,
//     shadowRadius: 18,
//     elevation: 12,
//   },
//   confirmIconCircle: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: 'rgba(179,27,52,0.14)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 14,
//   },
//   confirmBtnRow: {
//     flexDirection: 'row',
//     width: '100%',
//     gap: 10,
//   },
//   confirmBtn: {
//     flex: 1,
//     paddingVertical: 13,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   confirmCancelBtn: {
//     backgroundColor: 'rgba(0,56,147,0.08)',
//     borderWidth: 1,
//     borderColor: 'rgba(0,56,147,0.25)',
//   },
//   confirmCancelBtnText: {
//     color: '#003893',
//     fontWeight: '700',
//     fontSize: 14.5,
//   },
//   confirmLeaveBtn: {
//     backgroundColor: '#B31B34',
//   },
//   confirmLeaveBtnText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14.5,
//   },
// });

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ImageBackground,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle } from 'lucide-react-native';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../avatar/Avatar';

type Props = { navigation: NativeStackNavigationProp<any> };

// sabai possible winning combos (row, column, diagonal)
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// board bata kun 3 ta cell le win banayo tyo pattaunu (indices matra)
function findWinningLine(board: any[]): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

// winning line ko geometry (center, length, angle) nikalne, 3x3 grid, cell 96px
const CELL = 96;
const BOARD_SIZE = CELL * 3;
function getLineGeometry(line: number[]) {
  const [a, , c] = line;
  const rowA = Math.floor(a / 3);
  const colA = a % 3;
  const rowC = Math.floor(c / 3);
  const colC = c % 3;

  if (rowA === rowC) {
    // horizontal (row) line
    return { cx: BOARD_SIZE / 2, cy: rowA * CELL + CELL / 2, length: BOARD_SIZE, angle: 0 };
  }
  if (colA === colC) {
    // vertical (column) line
    return { cx: colA * CELL + CELL / 2, cy: BOARD_SIZE / 2, length: BOARD_SIZE, angle: 90 };
  }
  const diagLength = Math.sqrt(BOARD_SIZE * BOARD_SIZE + BOARD_SIZE * BOARD_SIZE);
  if (a === 0) {
    // top-left to bottom-right
    return { cx: BOARD_SIZE / 2, cy: BOARD_SIZE / 2, length: diagLength, angle: 45 };
  }
  // top-right to bottom-left
  return { cx: BOARD_SIZE / 2, cy: BOARD_SIZE / 2, length: diagLength, angle: -45 };
}

const MultiplayerGameScreen = ({ navigation }: Props) => {
  const {
    board,
    winner,
    isDraw,
    myRole,
    myName,
    opponentName,
    opponentPhoto,
    opponentAvatarId,
    isMyTurn,
    currentPlayer,
    roomCode,
    handleMultiplayerPress,
    requestRematch,
    myRematchRequested,
    opponentRematchRequested,
    leaveRoom,
  } = useGameLogic();

  const { user, userProfile, recordGameResult } = useAuth();
  const myAvatarSource = getAvatarSource(userProfile?.avatarId);
  const myPhoto = userProfile?.photoURL || user?.photoURL || null;

  // opponent ko avatarId — GameLogic bata aauxa (room/invite/random match jahaan bata pani)
  const opponentAvatarSource = getAvatarSource(opponentAvatarId);

  const [myWins, setMyWins] = useState(0);
  const [opponentWins, setOpponentWins] = useState(0);

  const [popupVisible, setPopupVisible] = useState(false);
  const lineAnim = useRef(new Animated.Value(0)).current;
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  const [resultSnapshot, setResultSnapshot] = useState<{
    winner: string | null;
    isDraw: boolean;
  } | null>(null);

  // aile ko board bata winning line (agar xa vane) nikalne
  const winningLine = useMemo(
    () => (winner ? findWinningLine(board) : null),
    [board, winner],
  );

  // NOTE: Firestore stats (wins/losses/draws) GameLogic.tsx ko
  // updatePlayerStats le already handle garisakeko cha (uid-based, dubai
  // players ko lagi). Yaha recordGameResult() call gardaina — natra
  // double-count huncha. Yo useEffect le matra local UI counter
  // (myWins/opponentWins, in-session display ko lagi) update garcha.
  useEffect(() => {
    if (winner) {
      if (winner === myRole) {
        setMyWins(prev => prev + 1);
      } else {
        setOpponentWins(prev => prev + 1);
      }
    }
  }, [winner, isDraw]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      const actionType = e.data?.action?.type;
      if (actionType === 'GO_BACK' || actionType === 'POP') {
        leaveRoom();
      }
    });
    return unsubscribe;
  }, [navigation, leaveRoom]);

  // line draw hune ani tyo pura khelchepachi matra popup deखिne
  useEffect(() => {
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);

    if (winner) {
      setPopupVisible(false);
      lineAnim.setValue(0);
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start(() => {
        popupTimerRef.current = setTimeout(() => {
          setResultSnapshot({ winner, isDraw: false });
          setPopupVisible(true);
        }, 350);
      });
    } else if (isDraw) {
      setResultSnapshot({ winner: null, isDraw: true });
      setPopupVisible(true);
    } else {
      // NOTE: resultSnapshot yaha clear gardaina — Modal fade-out huda pani
      // purano (sahi) winner/draw text nai dekhincha, naya galat text hoina
      setPopupVisible(false);
      lineAnim.setValue(0);
    }

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [winner, isDraw]);

  // resultText/resultSubtitle ab resultSnapshot bata aaucha, live winner bata hoina
  const resultText = resultSnapshot?.isDraw
    ? 'DRAW!'
    : resultSnapshot?.winner
    ? resultSnapshot.winner === myRole
      ? 'YOU WIN!'
      : 'YOU LOSE!'
    : '';

  const resultSubtitle = resultSnapshot?.isDraw
    ? "It's a tie!"
    : resultSnapshot?.winner
    ? resultSnapshot.winner === myRole
      ? 'Congratulations!'
      : `${opponentName || 'Opponent'} wins!`
    : '';

  // NEW: "Leave" button ley ab seedhai goBack nagarera confirm popup kholcha
  const handleLeave = () => {
    setLeaveConfirmVisible(true);
  };

  const confirmLeave = () => {
    setLeaveConfirmVisible(false);
    navigation.goBack();
  };

  const cancelLeave = () => {
    setLeaveConfirmVisible(false);
  };

  // Player card ko lagi avatar — avatarSource (preset) > photo > first letter
  const renderAvatar = (
    name: string,
    photo: string | null,
    active: boolean,
    avatarSource?: any,
  ) => {
    if (avatarSource) {
      return (
        <Image
          source={avatarSource}
          style={[s.avatar, active && s.activeAvatarBorder]}
        />
      );
    }
    if (photo) {
      return (
        <Image
          source={{ uri: photo }}
          style={[s.avatar, active && s.activeAvatarBorder]}
        />
      );
    }
    return (
      <View style={[s.avatarCircle, active && s.activeAvatarBorder]}>
        <Text style={s.avatarLetter}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
    );
  };

  // winning line ko style (position + animated draw), GameScreen jastai
  const lineStyle = useMemo(() => {
    if (!winningLine) return null;
    const { cx, cy, length, angle } = getLineGeometry(winningLine);
    return {
      top: cy - 4,
      left: cx - length / 2,
      width: length,
      backgroundColor: '#1A1A1A',
      transform: [{ rotate: `${angle}deg` }, { scaleX: lineAnim }],
    };
  }, [winningLine, lineAnim]);

  return (
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.container}
      resizeMode="cover"
    >
      <View style={s.container}>
        {/* Title */}
        <View style={s.titleWrap}>
          <Text style={s.title}>आलु प्लस</Text>
          <View style={s.titleUnderline} />
        </View>
        <Text style={s.roomCode}>Room: {roomCode}</Text>

        <View style={s.playerRow}>
          {/* My card — always left/first */}
          <View style={[s.badge, currentPlayer === myRole && s.activeBadge]}>
            {renderAvatar(
              myName,
              myPhoto,
              currentPlayer === myRole,
              myAvatarSource,
            )}
            <Text
              style={[
                s.badgeText,
                currentPlayer !== myRole && s.inactiveBadgeText,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {myName} ({myRole})
            </Text>
            <Text
              style={[s.winCount, currentPlayer === myRole && s.activeText]}
            >
              Wins: {myWins}
            </Text>
          </View>

          <View style={s.vsWrap}>
            <Text style={s.vs}>VS</Text>
          </View>

          {/* Opponent card — always right/second */}
          <View style={[s.badge, currentPlayer !== myRole && s.activeBadge]}>
            {renderAvatar(
              opponentName || '?',
              opponentPhoto,
              currentPlayer !== myRole,
              opponentAvatarSource,
            )}
            <Text
              style={[
                s.badgeText,
                currentPlayer === myRole && s.inactiveBadgeText,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {opponentName || '?'} ({myRole === 'X' ? 'O' : 'X'})
            </Text>
            <Text
              style={[s.winCount, currentPlayer !== myRole && s.activeText]}
            >
              Wins: {opponentWins}
            </Text>
          </View>
        </View>

        {!winner && !isDraw && (
          <View
            style={[
              s.turnBanner,
              { borderColor: isMyTurn ? '#1f8552' : '#B31B34' },
            ]}
          >
            <View
              style={[
                s.turnIconCircle,
                { borderColor: isMyTurn ? '#1f8552' : '#B31B34' },
              ]}
            >
              {isMyTurn ? (
                myAvatarSource ? (
                  <Image source={myAvatarSource} style={s.turnAvatarImg} />
                ) : myPhoto ? (
                  <Image source={{ uri: myPhoto }} style={s.turnAvatarImg} />
                ) : (
                  <Text style={s.turnAvatarLetter}>
                    {myName?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                )
              ) : opponentAvatarSource ? (
                <Image source={opponentAvatarSource} style={s.turnAvatarImg} />
              ) : opponentPhoto ? (
                <Image source={{ uri: opponentPhoto }} style={s.turnAvatarImg} />
              ) : (
                <Text style={s.turnAvatarLetter}>
                  {(opponentName || '?')[0]?.toUpperCase() ?? '?'}
                </Text>
              )}
            </View>
            <View style={s.turnTextWrap}>
              <Text
                style={s.turnMainText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {isMyTurn ? 'Your Turn' : `${opponentName || 'Opponent'}'s Turn`}
              </Text>
              <Text style={s.turnSubText}>
                {isMyTurn ? 'Tap a cell to play' : 'Please wait...'}
              </Text>
            </View>
          </View>
        )}

        <View style={s.boardCard}>
          {/* wrapper so the winning-line overlay lines up exactly with the grid */}
          <View style={s.boardWrapper}>
            <View style={s.board}>
              {board.map((cell: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    s.cell,
                    (index + 1) % 3 !== 0 && s.cellBorderRight,
                    index < 6 && s.cellBorderBottom,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleMultiplayerPress(index)}
                >
                  <Text style={s.cellText}>{cell}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* animated strike-through line drawn over the winning combo */}
            {lineStyle && <Animated.View style={[s.winLine, lineStyle]} />}
          </View>
        </View>

        <TouchableOpacity
          style={s.leaveBtn}
          activeOpacity={0.85}
          onPress={handleLeave}
        >
          <Text style={s.leaveText}>Leave</Text>
        </TouchableOpacity>

        {/* Win/Loss/Draw Popup — ab popupVisible le control garcha, winner detect
            vayeko bittikai hoina, line khelchepachi matra */}
        <Modal visible={popupVisible} transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View
                style={[
                  s.iconCircle,
                  resultSnapshot?.isDraw
                    ? s.iconCircleDraw
                    : resultSnapshot?.winner === myRole
                    ? s.iconCircleWin
                    : s.iconCircleLose,
                ]}
              >
                <Text style={s.iconText}>
                  {resultSnapshot?.isDraw
                    ? '🤝'
                    : resultSnapshot?.winner === myRole
                    ? '🏆'
                    : '💔'}
                </Text>
              </View>

              <Text style={s.modalTitle}>{resultText}</Text>
              <Text style={s.modalSubtitle}>{resultSubtitle}</Text>

              {/* Score row — myName wala pill ek pali matra, opponent pill sanga */}
              <View style={s.scoreRow}>
                <View style={s.scorePill}>
                  <Text
                    style={s.scorePillLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {myName}
                  </Text>
                  <Text style={s.scorePillValue}>{myWins}</Text>
                </View>
                <View style={s.scorePill}>
                  <Text
                    style={s.scorePillLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {opponentName || 'Opponent'}
                  </Text>
                  <Text style={s.scorePillValue}>{opponentWins}</Text>
                </View>
              </View>

              {myRematchRequested ? (
                <View style={s.waitingBox}>
                  <Text style={s.waitingText}>
                    {opponentRematchRequested
                      ? 'Starting rematch...'
                      : `Waiting for ${
                          opponentName || 'opponent'
                        } to play again...`}
                  </Text>
                </View>
              ) : (
                <>
                  {opponentRematchRequested && (
                    <Text style={s.rematchHintText}>
                      {opponentName || 'Opponent'} wants a rematch!
                    </Text>
                  )}
                  <TouchableOpacity
                    style={s.playAgainBtn}
                    activeOpacity={0.85}
                    onPress={requestRematch}
                  >
                    <Text style={s.playAgainText}>Play Again</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={s.modalLeaveBtn}
                activeOpacity={0.85}
                onPress={handleLeave}
              >
                <Text style={s.modalLeaveText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* NEW: "Are you sure you want to leave?" confirm popup — dubai
            Leave button (in-game ra result popup) le yehi kholcha */}
        <Modal
          visible={leaveConfirmVisible}
          transparent
          animationType="fade"
          onRequestClose={cancelLeave}
        >
          <View style={s.modalOverlay}>
            <View style={s.confirmBox}>
              <View style={s.confirmIconCircle}>
                <AlertTriangle size={26} color="#B31B34" />
              </View>
              <Text style={s.modalTitle}>Leave Game?</Text>
              <Text style={s.modalSubtitle}>
                Are you sure you want to leave? The room will end for both
                players.
              </Text>
              <View style={s.confirmBtnRow}>
                <TouchableOpacity
                  style={[s.confirmBtn, s.confirmCancelBtn]}
                  activeOpacity={0.8}
                  onPress={cancelLeave}
                >
                  <Text style={s.confirmCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.confirmBtn, s.confirmLeaveBtn]}
                  activeOpacity={0.85}
                  onPress={confirmLeave}
                >
                  <Text style={s.confirmLeaveBtnText}>Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default MultiplayerGameScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingHorizontal: 24,
  },

  titleWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF6E8',
    letterSpacing: 1,
    textShadowColor: 'rgba(150,20,40,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleUnderline: {
    marginTop: 6,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0972A',
  },
  roomCode: {
    fontSize: 12,
    color: '#FFF3DD',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 18,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,251,244,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    // maxWidth hataइयो — natra long name le container narrow paera
    // font ta ellipsis huncha, tara available space chai kam prayog
    // huncha. Ab flex:1 le row ko whole width equally share garcha.
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  activeBadge: {
    backgroundColor: '#eb533fe8',
    borderColor: '#0c2fde',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeAvatarBorder: {
    borderColor: '#FFFDF8',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  badgeText: {
    color: '#3A2A1E',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
    width: '100%',
  },

  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,251,244,0.94)',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    minWidth: 220,
    // width fixed 100% hataइयो — box ab content anusar grow huncha
    // (naam thulo vaye box thulo, sano vaye box sano), matra parent
    // ko available width (screen - padding) bhanda badi hunna
    alignSelf: 'center',
    maxWidth: '94%',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  turnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2.5,
    backgroundColor: '#FFFDF8',
  },
  turnAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  turnAvatarLetter: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#003893',
  },
  turnTextWrap: {
    flexShrink: 1,
  },
  turnMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3A2A1E',
  },
  turnSubText: {
    fontSize: 11,
    color: '#8A7A6A',
    marginTop: 1,
    fontWeight: '600',
  },
  winCount: {
    color: '#8A7A6A',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  activeText: {
    color: '#3A2A1E',
  },
  inactiveBadgeText: {
    color: '#3A2A1E',
  },
  vsWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,251,244,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.4)',
  },
  vs: {
    fontWeight: '800',
    color: '#e02a2a',
    fontSize: 12,
  },

  boardCard: {
    backgroundColor: 'rgba(255,251,244,0.92)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
  },
  // exact-size wrapper so the winning line overlays the grid precisely
  boardWrapper: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    position: 'relative',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBorderRight: {
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(19, 14, 14, 0.68)',
  },
  cellBorderBottom: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(19, 14, 14, 0.68)',
  },
  cellText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  // the animated strike-through line itself
  winLine: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },

  leaveBtn: {
    marginTop: 22,
    backgroundColor: 'rgba(255,251,244,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(179,27,52,0.35)',
    paddingHorizontal: 34,
    paddingVertical: 13,
    borderRadius: 14,
  },
  leaveText: {
    color: '#B31B34',
    fontWeight: '700',
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(50,20,20,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalBox: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 28,
    width: '85%',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: '#FFFDF8',
    elevation: 6,
  },
  iconCircleWin: { backgroundColor: 'rgba(31,133,82,0.18)' },
  iconCircleLose: { backgroundColor: 'rgba(179,27,52,0.18)' },
  iconCircleDraw: { backgroundColor: 'rgba(138,122,106,0.2)' },
  iconText: { fontSize: 40 },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3A2A1E',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8A7A6A',
    marginBottom: 18,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  scorePill: {
    flex: 1,
    backgroundColor: 'rgba(224,151,42,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  scorePillLabel: {
    fontSize: 11,
    color: '#8A7A6A',
    fontWeight: '600',
    marginBottom: 2,
    width: '100%',
    textAlign: 'center',
  },
  scorePillValue: {
    fontSize: 20,
    color: '#3A2A1E',
    fontWeight: '800',
  },
  playAgainBtn: {
    backgroundColor: '#003893',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  playAgainText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalLeaveBtn: {
    backgroundColor: 'rgba(179,27,52,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(179,27,52,0.3)',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalLeaveText: {
    color: '#B31B34',
    fontWeight: '700',
    fontSize: 15,
  },
  waitingBox: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  waitingText: {
    color: '#3A2A1E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  rematchHintText: {
    color: '#1f8552',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  // NEW: "Are you sure you want to leave?" confirm popup
  confirmBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(179,27,52,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtn: {
    backgroundColor: 'rgba(0,56,147,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,56,147,0.25)',
  },
  confirmCancelBtnText: {
    color: '#003893',
    fontWeight: '700',
    fontSize: 14.5,
  },
  confirmLeaveBtn: {
    backgroundColor: '#B31B34',
  },
  confirmLeaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14.5,
  },
});