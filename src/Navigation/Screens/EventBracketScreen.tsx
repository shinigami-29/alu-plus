import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import database from '@react-native-firebase/database';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/AppLayout/Layout';
import { Trophy, Swords, XCircle } from 'lucide-react-native';


type Match = {
  player1: string | null;
  player2: string | null;
  scores: { player1Wins: number; player2Wins: number };
  winner: string | null;
  status: 'pending' | 'in_progress' | 'completed';
};

type Props = { navigation: any; route: any };

const EventBracketScreen = ({ navigation, route }: Props) => {
  const { eventId } = route.params as { eventId: string };
  const { user } = useAuth();
  const myUid = user?.uid;

  const [rounds, setRounds] = useState<Record<string, Record<string, Match>>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  // const [eliminatedVisible, setEliminatedVisible] = useState(false);
  const [championVisible, setChampionVisible] = useState(false);

  useEffect(() => {
    const eventRef = database().ref(`events/${eventId}`);
    const listener = eventRef.on('value', (snap) => {
      const data = snap.val();
      if (!data) return;

      setCurrentRound(data.bracket?.currentRound || 1);
      setTotalRounds(data.bracket?.totalRounds || 1);
      setRounds(data.bracket?.rounds || {});

      const nameMap: Record<string, string> = {};
      if (data.participants) {
        Object.entries(data.participants).forEach(([uid, p]: any) => {
          nameMap[uid] = p.name;
        });
      }
      setNames(nameMap);
    });

    return () => eventRef.off('value', listener);
  }, [eventId]);

//   useEffect(() => {
//   if (!myUid) return;

//   for (const roundKey of Object.keys(rounds)) {
//     const matches = rounds[roundKey];
//     for (const match of Object.values(matches)) {
//       const wasInMatch = match.player1 === myUid || match.player2 === myUid;
//       const iLost = match.status === 'completed' && match.winner && match.winner !== myUid;
//       if (wasInMatch && iLost) {
//         setEliminatedVisible(true);
//         return;
//       }
//     }
//   }
// }, [rounds, myUid]);

useEffect(() => {
  if (!myUid) return;

  const finalRoundKey = `round${totalRounds}`;
  const finalMatches = rounds[finalRoundKey];
  if (!finalMatches) return;

  for (const match of Object.values(finalMatches)) {
    const wasInMatch = match.player1 === myUid || match.player2 === myUid;
    const iWon = match.status === 'completed' && match.winner === myUid;
    if (wasInMatch && iWon) {
      setChampionVisible(true);     
      return;
    }
  }
}, [rounds, totalRounds, myUid]);

  const getPlayerName = (uid: string | null) => {
    if (!uid) return 'TBD';
    return names[uid] || 'Player';
  };

  const handlePlayMatch = (roundKey: string, matchId: string, match: Match) => {
    if (!match.player1 || !match.player2) return; // bye match, nothing to play
    navigation.navigate('MultiplayerGame', {
      eventMode: true,
      eventId,
      roundKey,
      matchId,
      player1Uid: match.player1,
      player2Uid: match.player2,
        totalRounds,  
    });
  };

  const roundLabel = (roundNum: number) => {
    const remaining = totalRounds - roundNum + 1;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semi-Final';
    if (remaining === 3) return 'Quarter-Final';
    return `Round ${roundNum}`;
  };

  const roundKeys = Object.keys(rounds).sort(
    (a, b) => parseInt(a.replace('round', '')) - parseInt(b.replace('round', ''))
  );

  return (
    <Layout
      header={{ type: 'screen', title: 'Round', onBack: () => navigation.goBack() }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.container}>
          {roundKeys.map((roundKey, idx) => {
            const roundNum = idx + 1;
            const matches = rounds[roundKey];
            const isCurrentRound = roundNum === currentRound;

            return (
              <View key={roundKey} style={s.column}>
                <Text style={s.roundTitle}>{roundLabel(roundNum)}</Text>

                {Object.entries(matches).map(([matchId, match]) => {
                  const isMyMatch =
                    isCurrentRound &&
                    match.status !== 'completed' &&
                    (match.player1 === myUid || match.player2 === myUid);

                  return (
                    <View key={matchId} style={s.matchCard}>
                      <View
  style={[
    s.playerRow,
    match.winner === match.player1 && s.playerRowWinner,
  ]}
>
  <Text
    style={[
      s.playerName,
      match.winner === match.player1 && s.playerNameWinner,
      match.status === 'completed' &&
        match.winner &&
        match.winner !== match.player1 &&
        s.playerNameLoser,
    ]}
    numberOfLines={1}
  >
    {getPlayerName(match.player1)}
  </Text>
  <Text style={s.scoreText}>{match.scores.player1Wins}</Text>
</View>

<View style={s.divider} />

<View
  style={[
    s.playerRow,
    match.winner === match.player2 && s.playerRowWinner,
  ]}
>
  <Text
    style={[
      s.playerName,
      match.winner === match.player2 && s.playerNameWinner,
      match.status === 'completed' &&
        match.winner &&
        match.winner !== match.player2 &&
        s.playerNameLoser,
    ]}
    numberOfLines={1}
  >
    {getPlayerName(match.player2)}
  </Text>
  <Text style={s.scoreText}>{match.scores.player2Wins}</Text>
</View>
                      

                      {match.status === 'completed' ? (
                        <View style={s.doneBadge}>
                          <Trophy size={11} color="#F2C879" />
                          <Text style={s.doneBadgeText}>Done</Text>
                        </View>
                      ) : isMyMatch ? (
                        <TouchableOpacity
                          style={s.playBtn}
                          activeOpacity={0.85}
                          onPress={() => handlePlayMatch(roundKey, matchId, match)}
                        >
                          <Swords size={14} color="#12194A" />
                          <Text style={s.playBtnText}>Play Match</Text>
                        </TouchableOpacity>
                      ) : match.player1 && match.player2 ? (
                        <View style={s.waitingBadge}>
                          <Text style={s.waitingBadgeText}>In Progress</Text>
                        </View>
                      ) : (
                        <View style={s.waitingBadge}>
                          <Text style={s.waitingBadgeText}>Waiting</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* <Modal visible={eliminatedVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.eliminatedIconCircle}>
              <XCircle size={32} color="#B31B34" />
            </View>
            <Text style={s.modalTitle}>Eliminated</Text>
            <Text style={s.modalSubtitle}>Try again next time!</Text>
            <TouchableOpacity
              style={s.leaveBtn}
              activeOpacity={0.85}
              onPress={() => {
                setEliminatedVisible(false);
                navigation.popToTop();
              }}
            >
              <Text style={s.leaveBtnText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}
      
      <Modal visible={championVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.championIconCircle}>
              <Trophy size={32} color="#F2C879" />
            </View>
            <Text style={s.modalTitle}>Champion!</Text>
            <Text style={s.modalSubtitle}>You won the tournament!</Text>
            <TouchableOpacity
              style={s.championLeaveBtn}
              activeOpacity={0.85}
              onPress={() => {
                setChampionVisible(false);
                navigation.popToTop();
              }}
            >
              <Text style={s.championLeaveBtnText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

export default EventBracketScreen;

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 30,
  },
  column: {
    width: 200,
    marginHorizontal: 8,
  },
  roundTitle: {
    color: '#F2C879',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 12,
    marginBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  playerRowWinner: {
    opacity: 1,
  },
  playerName: {
    color: 'rgba(245,240,224,0.75)',
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
  playerNameWinner: {
    color: '#7FD9A6',
    fontWeight: '800',
  },
  scoreText: {
    color: 'rgba(245,240,224,0.6)',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F2C879',
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  playBtnText: {
    color: '#12194A',
    fontWeight: '800',
    fontSize: 12,
  },
  waitingBadge: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 8,
  },
  waitingBadgeText: {
    color: 'rgba(245,240,224,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  doneBadgeText: {
    color: '#F2C879',
    fontSize: 11,
    fontWeight: '700',
  },
  playerNameLoser: {
  color: 'rgba(245,240,224,0.28)',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(10,14,35,0.75)',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 32,
},
modalBox: {
  backgroundColor: 'rgba(255,251,244,0.97)',
  borderRadius: 24,
  paddingVertical: 28,
  paddingHorizontal: 28,
  width: '85%',
  alignItems: 'center',
},
eliminatedIconCircle: {
  width: 72,
  height: 72,
  borderRadius: 36,
  backgroundColor: 'rgba(179,27,52,0.14)',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 14,
},
modalTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: '#3A2A1E',
  marginBottom: 4,
},
modalSubtitle: {
  fontSize: 14,
  color: '#8A7A6A',
  marginBottom: 20,
  textAlign: 'center',
},
leaveBtn: {
  backgroundColor: '#B31B34',
  paddingVertical: 14,
  borderRadius: 14,
  width: '100%',
  alignItems: 'center',
},
leaveBtnText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 15,
},
championIconCircle: {
  width: 72,
  height: 72,
  borderRadius: 36,
  backgroundColor: 'rgba(242,200,121,0.18)',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 14,
},
championLeaveBtn: {
  backgroundColor: '#003893',
  paddingVertical: 14,
  borderRadius: 14,
  width: '100%',
  alignItems: 'center',
},
championLeaveBtnText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 15,
},
});