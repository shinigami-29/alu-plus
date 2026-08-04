import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, History, Swords, RefreshCw } from 'lucide-react-native';
import { useGameLogic } from '../GameLogicContext';

import Layout from '../../components/AppLayout/Layout';

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
    <Layout withScroll={false}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.iconBtn}
          >
            <ArrowLeft size={20} color="#182992" />
          </TouchableOpacity>
          <View style={s.titleRow}>
            <History
              size={19}
              // color="#182992"
              color="#bec0d3"
            />
            <Text style={s.headerTitle}>Match History</Text>
          </View>
          <TouchableOpacity onPress={fetchMatchHistory} style={s.iconBtn}>
            <RefreshCw size={20} color="#182992" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={matchHistory as SessionRecord[]}
          keyExtractor={(item, index) => item.roomCode + item.timestamp + index}
          contentContainerStyle={s.listContent}
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
                  <View style={s.avatarSmall}>
                    <Text style={s.avatarSmallText}>
                      {myName?.[0]?.toUpperCase() ?? 'Y'}
                    </Text>
                  </View>
                  <Text style={s.vsText}>vs</Text>
                  <View style={[s.avatarSmall, s.avatarOpponent]}>
                    <Text style={s.avatarSmallText}>
                      {item.opponent?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <Text style={s.opponentText} numberOfLines={1}>
                    {item.opponent}
                  </Text>
                </View>
                <Text style={s.dateText}>{formatDateTime(item.timestamp)}</Text>
              </View>

              <View style={s.statsRow}>
                <View style={[s.statBadge, { backgroundColor: '#E9FBF0' }]}>
                  <Text style={[s.statValue, { color: '#28C76F' }]}>
                    {item.wins}
                  </Text>
                  <Text style={[s.statLabel, { color: '#28C76F' }]}>Win</Text>
                </View>
                <View style={[s.statBadge, { backgroundColor: '#FDEBEE' }]}>
                  <Text style={[s.statValue, { color: '#FF4B6E' }]}>
                    {item.losses}
                  </Text>
                  <Text style={[s.statLabel, { color: '#FF4B6E' }]}>Loss</Text>
                </View>
                <View style={[s.statBadge, { backgroundColor: '#FFF4DE' }]}>
                  <Text style={[s.statValue, { color: '#F5A623' }]}>
                    {item.draws}
                  </Text>
                  <Text style={[s.statLabel, { color: '#F5A623' }]}>Draw</Text>
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
    // backgroundColor: '#F5F4F0'
    // backgroundColor: '#cbd8f4',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eef1f7',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#cbcbdf',
    // color: '#182992'
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 30 },

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

    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eef1f7',
  },

  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cdcdf9',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9098a8',
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef1f7',
    shadowColor: '#182992',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#182992',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOpponent: {
    backgroundColor: '#9098a8',
  },
  avatarSmallText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  vsText: {
    fontSize: 11,
    color: '#9098a8',
    fontWeight: '600',
  },
  opponentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#182992',
    marginLeft: 2,
    flexShrink: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#9098a8',
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
