
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import Layout from '../../components/AppLayout/Layout';

type Props = { navigation: NativeStackNavigationProp<any> };

// possible winning combos (row, column, diagonal)
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

// Find the winning line (if any) so it can be struck through with a line
function findWinningLine(board: any[]): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

// Winning line geometry (center, length, angle) for a 3x3 grid, 96px cells

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

const GameScreen = ({ navigation }: Props) => {
  const { board, currentPlayer, winner, isDraw, handlePress, resetGame } =
    useGameLogic();

  // Session-based win count (local only,when reset it become 0 )
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);

  const [popupVisible, setPopupVisible] = useState(false);
  const lineAnim = useRef(new Animated.Value(0)).current;
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

 // Snapshot the result so the popup doesn't briefly show wrong text
// while fading out after "Play Again" resets winner to null.

  const [resultSnapshot, setResultSnapshot] = useState<{
    winner: 'X' | 'O' | null;
    isDraw: boolean;
  } | null>(null);

   // Derive the winning line from the current board (if there is one)
  const winningLine = useMemo(
    () => (winner ? findWinningLine(board) : null),
    [board, winner]
  );

  // increase count when winner is change
  useEffect(() => {
    if (winner === 'X') {
      setP1Wins(prev => prev + 1);
    } else if (winner === 'O') {
      setP2Wins(prev => prev + 1);
    }
  }, [winner]);

  // after winning it show winner line then it show popup
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
      // Keep resultSnapshot as-is during fade-out so the popup shows the
// last correct result, not a wrong one.
      setPopupVisible(false);
      lineAnim.setValue(0);
    }

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [winner, isDraw]);

  const getDisplayValue = (cell: any) => {
    if (cell === 'X') return 'X';
    if (cell === 'O') return 'O';
    return '';
  };

  const handleFullReset = () => {
    setP1Wins(0);
    setP2Wins(0);
    resetGame();
  };

    // Winning line style (position + animated draw-on effect)
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
  }, [winningLine, winner, lineAnim]);

  return (
   <Layout>
    <View style={s.container}>
      {/* Title */}
      <View style={s.titleWrap}>
        <Text style={s.title}>आलु प्लस</Text>
        <View style={s.titleUnderline} />
      </View>

      {/* Player badges */}
      <View style={s.playerRow}>
        <View style={[s.playerBadge, currentPlayer === 'X' && s.activeBadgeX]}>
          <Text style={[s.playerText, currentPlayer === 'X' && s.activeText]}>
            X
          </Text>
          <Text style={[s.playerSub, currentPlayer === 'X' && s.activeSubText]}>
            Player 1
          </Text>
          <View style={[s.winPill, currentPlayer === 'X' && s.winPillActive]}>
            <Text style={[s.winCount, currentPlayer === 'X' && s.activeText]}>
              Wins: {p1Wins}
            </Text>
          </View>
        </View>

        <View style={s.vsWrap}>
          <Text style={s.vsText}>VS</Text>
        </View>

        <View style={[s.playerBadge, currentPlayer === 'O' && s.activeBadgeO]}>
          <Text style={[s.playerText, currentPlayer === 'O' && s.activeText]}>
            O
          </Text>
          <Text style={[s.playerSub, currentPlayer === 'O' && s.activeSubText]}>
            Player 2
          </Text>
          <View style={[s.winPill, currentPlayer === 'O' && s.winPillActive]}>
            <Text style={[s.winCount, currentPlayer === 'O' && s.activeText]}>
              Wins: {p2Wins}
            </Text>
          </View>
        </View>
      </View>

      {/* Board */}
      <View style={s.boardCard}>
        <View style={s.boardWrapper}>
          <View style={s.board}>
            {board.map((cell: any, index: number) => {
              const value = getDisplayValue(cell);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    s.cell,
                    (index + 1) % 3 !== 0 && s.cellBorderRight,
                    index < 6 && s.cellBorderBottom,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handlePress(index)}
                >
                  <Text
                    style={[
                      s.cellText,
                      value === 'X' ? s.cellTextX : s.cellTextO,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {lineStyle && <Animated.View style={[s.winLine, lineStyle]} />}
        </View>
      </View>

      <TouchableOpacity
        style={s.leaveBtn}
        activeOpacity={0.85}
        onPress={() => {
          handleFullReset();
          navigation.goBack();
        }}
      >
        <Text style={s.leaveText}>Leave</Text>
      </TouchableOpacity>
    </View>

    {/* Modal Layout ko bahira nai rahos — position:absolute jasto overlay ho */}
    <Modal visible={popupVisible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.popup}>
          <View
            style={[
              s.iconCircle,
              resultSnapshot?.isDraw
                ? s.iconCircleDraw
                : resultSnapshot?.winner === 'X'
                ? s.iconCircleP1
                : s.iconCircleP2,
            ]}
          >
            <Text style={s.iconText}>{resultSnapshot?.isDraw ? '🤝' : '🏆'}</Text>
          </View>

          <Text style={s.popupTitle}>
            {resultSnapshot?.isDraw
              ? 'DRAW!'
              : `${resultSnapshot?.winner === 'X' ? 'PLAYER 1' : 'PLAYER 2'} WINS!`}
          </Text>

          <View style={s.scoreRow}>
            <View style={s.scorePill}>
              <Text style={s.scorePillLabel}>Player 1</Text>
              <Text style={s.scorePillValue}>{p1Wins}</Text>
            </View>
            <View style={s.scorePill}>
              <Text style={s.scorePillLabel}>Player 2</Text>
              <Text style={s.scorePillValue}>{p2Wins}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.popupBtn}
            activeOpacity={0.85}
            onPress={resetGame}
          >
            <Text style={s.popupBtnText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.popupBtn, s.menuBtn]}
            activeOpacity={0.85}
            onPress={() => {
              handleFullReset();
              navigation.navigate('Mode');
            }}
          >
            <Text style={[s.popupBtnText, s.menuBtnText]}>Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </Layout>
);
};

export default GameScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  titleWrap: {
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#F2C879',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleUnderline: {
    marginTop: 8,
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F2C879',
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 26,
  },
  // NEW: glass-card look, same treatment as Mode screen's secondary buttons
  playerBadge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  activeBadgeX: {
    backgroundColor: '#B31B34',
    borderColor: '#B31B34',
  },
  activeBadgeO: {
    backgroundColor: '#003893',
    borderColor: '#003893',
  },
  playerText: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgba(245,239,224,0.95)',
  },
  playerSub: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  activeSubText: {
    color: 'rgba(255,255,255,0.85)',
  },
  winPill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  winPillActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  winCount: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.7)',
    fontWeight: '700',
  },
  activeText: {
    color: '#ffffff',
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
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F2C879',
  },

  // Board card: kept solid/opaque on purpose so the grid stays clearly readable
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
  },
  // NEW: exact-size wrapper so the winning line overlays the grid precisely
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
  },
  cellTextX: {
    color: '#1A1A1A',
  },
  cellTextO: {
    color: '#1A1A1A',
  },
  // NEW: the animated strike-through line itself
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
    marginTop: 26,
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

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,35,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Popup: same glass + gold-border language as boardCard, kept light/readable
  popup: {
    backgroundColor: 'rgba(255,251,244,0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
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
  iconCircleP1: {
    backgroundColor: 'rgba(179,27,52,0.18)',
  },
  iconCircleP2: {
    backgroundColor: 'rgba(0,56,147,0.18)',
  },
  iconCircleDraw: {
    backgroundColor: 'rgba(138,122,106,0.2)',
  },
  iconText: {
    fontSize: 40,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3A2A1E',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 22,
    width: '100%',
  },
  scorePill: {
    flex: 1,
    backgroundColor: 'rgba(224,151,42,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scorePillLabel: {
    fontSize: 11,
    color: '#8A7A6A',
    fontWeight: '600',
    marginBottom: 2,
  },
  scorePillValue: {
    fontSize: 20,
    color: '#3A2A1E',
    fontWeight: '800',
  },

  popupBtn: {
    backgroundColor: '#B31B34',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuBtn: {
    backgroundColor: 'rgba(0,56,147,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,56,147,0.25)',
  },
  popupBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  menuBtnText: {
    color: '#003893',
  },
});