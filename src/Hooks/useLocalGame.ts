/**
 * useLocalGame
 * Offline / same-device board logic
 * Also used to mirror the multiplayer board (board/currentPlayer/winner
 */
import { Player, BoxCell } from '../Game2/Type';
import { SharedState } from './useSharedState';

export const useLocalGame = (shared: SharedState) => {
  const {
    board, setBoard,
    currentPlayer, setCurrentPlayer,
    winner, setWinner,
    lastLocalFirstRef,
  } = shared;

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

  // Local (offline / same-device) move handler
  const handlePress = (index: number): void => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const win = checkwin(newBoard);

    setBoard(newBoard);
    setWinner(win);

    setCurrentPlayer(currentPlayer => (currentPlayer === 'X' ? 'O' : 'X'));
  };

  // Resets the local board, alternating who goes first each round
  const resetGame = () => {
    const nextFirst: Player = lastLocalFirstRef.current === 'X' ? 'O' : 'X';
    lastLocalFirstRef.current = nextFirst;
    setBoard(Array(9).fill(null));
    setCurrentPlayer(nextFirst);
    setWinner(null);
  };

  const isDraw = board.every(c => c !== null) && !winner;

  return {
    checkwin,
    handlePress,
    resetGame,
    isDraw,
  };
};