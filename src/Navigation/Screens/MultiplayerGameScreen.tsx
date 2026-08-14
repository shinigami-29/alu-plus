
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle } from 'lucide-react-native';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import Toast from '../../components/Toast/Toast';

type Props = { navigation: NativeStackNavigationProp<any> };

// all possible winning combos (row, column, diagonal)
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

function findWinningLine(board: any[]): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}


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
    multiplayerError,
    currentPlayer,
    roomCode,
    handleMultiplayerPress,
    requestRematch,
    myRematchRequested,
    opponentRematchRequested,
    leaveRoom,
  } = useGameLogic();

  const { user, userProfile, recordGameResult } = useAuth();
  const myPhoto = userProfile?.photoURL || user?.photoURL || null;

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

   // Derive the winning line from the current board (if there is one)
  const winningLine = useMemo(
    () => (winner ? findWinningLine(board) : null),
    [board, winner],
  );

 // Firestore stats are handled elsewhere (updatePlayerStats) — this only
// updates the local in-session win counter, to avoid double-counting.
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

 // Only show the popup after the winning line finishes drawing itself
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
      setPopupVisible(false);
      lineAnim.setValue(0);
    }

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [winner, isDraw]);

    // resultText/resultSubtitle come from resultSnapshot now, not the live winner
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

  // Pressing Leave doesn't go back directly — show a confirm popup first
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

// Avatar for the player card — avatarId (preset) > photo > initials
  const renderAvatar = (
    name: string,
    photo: string | null,
    active: boolean,
    avatarId?: string | null,
  ) => (
    <Avatar
      name={name}
      photoURL={photo}
      avatarId={avatarId}
      size={36}
      backgroundColor="#003893"
      ring={active}
      ringColor="#FFFDF8"
    />
  );

 // Winning line style (position + animated draw), same as GameScreen
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
   <Layout withScroll={false}>
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
              userProfile?.avatarId,
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
              opponentAvatarId,
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
                <Avatar
                  name={myName}
                  photoURL={myPhoto}
                  avatarId={userProfile?.avatarId}
                  size={34}
                  backgroundColor="#003893"
                />
              ) : (
                <Avatar
                  name={opponentName || '?'}
                  photoURL={opponentPhoto}
                  avatarId={opponentAvatarId}
                  size={34}
                  backgroundColor="#003893"
                />
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

         {/* Win/Loss/Draw popup — shown after the line animation finishes, not instantly */}
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

             {/* Score row — myName's pill appears once, alongside opponent's pill */}
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

       {/* NEW: "Are you sure you want to leave?" confirm popup — opened by
            both Leave buttons (in-game and the result popup) */}
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
      <Toast message={multiplayerError} />
   </Layout>
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
    color: '#F2C879',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleUnderline: {
    marginTop: 6,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F2C879',
  },
  roomCode: {
    fontSize: 12,
    color: 'rgba(245,239,224,0.75)',
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
  // Glass card, same treatment as GameScreen's playerBadge / lobby's playerHeader
  badge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  activeBadge: {
    backgroundColor: '#eb533fe8',
    borderColor: '#0c2fde',
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
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    minWidth: 220,
    alignSelf: 'center',
    maxWidth: '94%',
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
  turnTextWrap: {
    flexShrink: 1,
  },
  turnMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(245,239,224,0.95)',
  },
  turnSubText: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.6)',
    marginTop: 1,
    fontWeight: '600',
  },
  winCount: {
    color: 'rgba(245,239,224,0.65)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  activeText: {
    color: '#3A2A1E',
  },
  inactiveBadgeText: {
    color: 'rgba(245,239,224,0.9)',
  },
  vsWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  vs: {
    fontWeight: '800',
    color: '#F2C879',
    fontSize: 12,
  },

  // Board card kept solid/opaque on purpose so the grid stays clearly readable
  boardCard: {
    backgroundColor: 'rgba(255,251,244,0.95)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
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
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  leaveText: {
    color: '#F19191',
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,35,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  // Same glass + gold-border language as boardCard, kept light/readable
  modalBox: {
    backgroundColor: 'rgba(255,251,244,0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 28,
    width: '85%',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
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

  // "Are you sure you want to leave?" confirm popup
  confirmBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255,251,244,0.97)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
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