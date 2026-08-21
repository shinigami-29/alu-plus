type Player = { uid: string; name: string };

type Match = {
  player1: string | null;
  player2: string | null;
  scores: { player1Wins: number; player2Wins: number };
  winner: string | null;
  status: 'pending' | 'in_progress' | 'completed';
};

const shufflePlayers = (players: Player[]): Player[] => {
  const arr = [...players];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const nextPowerOf2 = (n: number): number => {
  let power = 1;
  while (power < n) power *= 2;
  return power;
};

export const generateBracketRound1 = (players: Player[]) => {
  if (players.length < 1) throw new Error('Need at least 1 player');

  // FIX: solo-player case (needed for testing with MIN_PLAYERS = 1).
  // A single player has no one to play — they're the champion immediately.
  if (players.length === 1) {
    const [only] = players;
    const matches: Record<string, Match> = {
      match_1: {
        player1: only.uid,
        player2: null,
        scores: { player1Wins: 0, player2Wins: 0 },
        winner: only.uid,
        status: 'completed',
      },
    };
    return { matches, totalRounds: 1 };
  }

  const shuffled = shufflePlayers(players);
  const bracketSize = nextPowerOf2(shuffled.length);
  const byeCount = bracketSize - shuffled.length;

  const matches: Record<string, Match> = {};
  let matchIndex = 1;
  let playerIndex = 0;

  for (let i = 0; i < byeCount; i++) {
    const player = shuffled[playerIndex++];
    matches[`match_${matchIndex}`] = {
      player1: player.uid,
      player2: null,
      scores: { player1Wins: 0, player2Wins: 0 },
      winner: player.uid,
      status: 'completed',
    };
    matchIndex++;
  }

  while (playerIndex < shuffled.length) {
    const p1 = shuffled[playerIndex++];
    const p2 = shuffled[playerIndex++];
    matches[`match_${matchIndex}`] = {
      player1: p1.uid,
      player2: p2.uid,
      scores: { player1Wins: 0, player2Wins: 0 },
      winner: null,
      status: 'pending',
    };
    matchIndex++;
  }

  const totalRounds = Math.log2(bracketSize);
  return { matches, totalRounds };
};

export const recordGameResult = (match: Match, gameWinnerUid: string): Match => {
  const isPlayer1 = match.player1 === gameWinnerUid;
  const updated: Match = {
    ...match,
    scores: {
      player1Wins: match.scores.player1Wins + (isPlayer1 ? 1 : 0),
      player2Wins: match.scores.player2Wins + (!isPlayer1 ? 1 : 0),
    },
    status: 'in_progress',
  };

  if (updated.scores.player1Wins === 2) {
    updated.winner = match.player1;
    updated.status = 'completed';
  } else if (updated.scores.player2Wins === 2) {
    updated.winner = match.player2;
    updated.status = 'completed';
  }

  return updated;
};

export const generateNextRound = (
  currentRoundMatches: Record<string, Match>
): Record<string, Match> => {
  // FIX: only pull winners from matches that actually finished. Previously
  // `m.winner!` would silently push `null` into the next round if this was
  // called before every match in the round was completed.
  const winners = Object.values(currentRoundMatches)
    .filter((m) => m.status === 'completed' && m.winner)
    .map((m) => m.winner as string);

  const nextMatches: Record<string, Match> = {};

  for (let i = 0; i < winners.length; i += 2) {
    const matchIndex = i / 2 + 1;
    nextMatches[`match_${matchIndex}`] = {
      player1: winners[i],
      player2: winners[i + 1] ?? null,
      scores: { player1Wins: 0, player2Wins: 0 },
      winner: winners[i + 1] ? null : winners[i],
      status: winners[i + 1] ? 'pending' : 'completed',
    };
  }

  return nextMatches;
};