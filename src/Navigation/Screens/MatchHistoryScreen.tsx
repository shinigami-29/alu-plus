import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swords, RefreshCw } from 'lucide-react-native';
import { useGameLogic } from '../GameLogicContext';

import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import { COLORS } from '../../theme/colors';

type Props = { navigation: NativeStackNavigationProp<any> };

type SessionRecord = {
  opponent: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  roomCode: string;
  timestamp: number;
};

const MatchHistoryScreen = ({ navigation }: Props) => {
  const { matchHistory, fetchMatchHistory, myName } = useGameLogic();

  useEffect(() => {
    fetchMatchHistory();
  }, []);

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return (
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
      ' • ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <Layout
      withScroll={false}
      header={{
        type: 'screen',
        title: 'Match History',
        onBack: () => navigation.goBack(),
        rightIcon: <RefreshCw size={20} color={COLORS.textOnDark} />,
        onRightPress: fetchMatchHistory,
      }}
    >
      <View style={s.container}>
        <FlatList
          data={matchHistory as SessionRecord[]}
          keyExtractor={(item, index) => item.roomCode + item.timestamp + index}
          contentContainerStyle={s.listContent}
           showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <View style={s.emptyIconCircle}>
                <Swords size={28} color="#c3c9d6" />
              </View>
              <Text style={s.emptyText}>No matches yet</Text>
              <Text style={s.emptySubText}>
                Your game sessions will show up here
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.rowTop}>
                <View style={s.matchupRow}>
                  <Avatar name={myName} size={24} backgroundColor={COLORS.navy} />
                  <Text style={s.vsText}>vs</Text>
                  <Avatar name={item.opponent} size={24} backgroundColor={COLORS.textMuted} />
                  <Text style={s.opponentText} numberOfLines={1}>
                    {item.opponent}
                  </Text>
                </View>
                <Text style={s.dateText}>{formatDateTime(item.timestamp)}</Text>
              </View>

              <View style={s.statsRow}>
                <View style={[s.statBadge, { backgroundColor: 'rgba(95,214,143,0.16)' }]}>
                  <Text style={[s.statValue, { color: '#5FD68F' }]}>
                    {item.wins}
                  </Text>
                  <Text style={[s.statLabel, { color: '#5FD68F' }]}>Win</Text>
                </View>
                <View style={[s.statBadge, { backgroundColor: 'rgba(241,145,145,0.16)' }]}>
                  <Text style={[s.statValue, { color: '#F19191' }]}>
                    {item.losses}
                  </Text>
                  <Text style={[s.statLabel, { color: '#F19191' }]}>Loss</Text>
                </View>
                <View style={[s.statBadge, { backgroundColor: 'rgba(242,200,121,0.16)' }]}>
                  <Text style={[s.statValue, { color: '#F2C879' }]}>
                    {item.draws}
                  </Text>
                  <Text style={[s.statLabel, { color: '#F2C879' }]}>Draw</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </Layout>
  );
};

export default MatchHistoryScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  listContent: {paddingBottom: 30 },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 6,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,

    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },

  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
  },
  emptySubText: {
    fontSize: 13,
    color: 'rgba(245,239,224,0.6)',
    fontWeight: '500',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  rowTop: {
    marginBottom: 12,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vsText: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.6)',
    fontWeight: '600',
  },
  opponentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnDark,
    marginLeft: 2,
    flexShrink: 1,
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
