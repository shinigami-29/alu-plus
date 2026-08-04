import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,

} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { RefreshCw, Trophy, Crown } from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import { COLORS } from '../../theme/colors';
type Props = { navigation: NativeStackNavigationProp<any> };

// Aba wins haru weekly reset hunxa (Monday–Sunday). Yo function le "resets in Xd"
// jasto label ko lagi baaki din ganana garcha — display matra ho, actual reset
// chai GameLogic.tsx ko weekKey system le automatically garcha.
const getDaysUntilReset = (): number => {
  const now = new Date();
  const dayNr = (now.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  return 7 - dayNr === 7 ? 7 : 7 - dayNr;
};

const LeaderboardScreen = ({ navigation }: Props) => {

  const { leaderboard, fetchLeaderboard, myName } = useGameLogic();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const daysLeft = getDaysUntilReset();

  const getRankColor = (index: number) => {
    if (index === 0) return '#F5A623'; // gold
    if (index === 1) return '#C7CBE0'; // silver
    if (index === 2) return '#CD9662'; // bronze
    return COLORS.textOnDark;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'rgba(245,166,35,0.18)';
    if (index === 1) return 'rgba(199,203,224,0.16)';
    if (index === 2) return 'rgba(205,150,98,0.16)';
    return 'rgba(255,255,255,0.08)';
  };

  const goToProfile = (item: {
    name: string;
    uid: string | null;
    photo: string | null;
    avatarId: string | null;
  }) => {
    if (!item?.name) return;
    navigation.navigate('PlayerProfile', {
      name: item.name,
      uid: item.uid,
      photo: item.photo,
      avatarId: item.avatarId,
    });
  };

  const renderAvatar = (
    item: { name: string; photo?: string | null; avatarId?: string | null },
    size: number,
    bg: string,
  ) => (
    <Avatar
      name={item?.name}
      photoURL={item?.photo}
      avatarId={item?.avatarId}
      size={size}
      backgroundColor={bg}
    />
  );

  return (
    <Layout
      withScroll={false}
      header={{
        type: 'screen',
        title: 'Leaderboard',
        onBack: () => navigation.goBack(),
        rightIcon: <RefreshCw size={18} color={COLORS.textOnDark} />,
        onRightPress: fetchLeaderboard,
      }}
    >
      <View style={s.container}>

        {/* Weekly reset note */}
        <View style={s.resetNoteWrap}>
          <Text style={s.resetNoteText}>
            {daysLeft === 7
              ? 'Resets today'
              : `Resets in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <View style={s.topThree}>
            {/* 2nd */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => goToProfile(leaderboard[1])}
              style={[
                s.topCard,
                s.secondCard,
                leaderboard[1]?.name === myName && s.myTopCard,
              ]}
            >
              <View style={s.avatarWrap}>
                {renderAvatar(leaderboard[1], 52, '#9098a8')}
                <View style={[s.rankPip, { backgroundColor: '#9098a8' }]}>
                  <Text style={s.rankPipText}>2</Text>
                </View>
              </View>
              <Text style={s.topName} numberOfLines={1}>
                {leaderboard[1]?.name}
              </Text>
              <Text style={s.topWins}>{leaderboard[1]?.wins} wins</Text>
            </TouchableOpacity>

            {/* 1st */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => goToProfile(leaderboard[0])}
              style={[
                s.topCard,
                s.firstCard,
                leaderboard[0]?.name === myName && s.myTopCard,
              ]}
            >
              <Crown size={22} color="#F5A623" style={{ marginBottom: 4 }} />
              <View style={s.avatarWrap}>
                {renderAvatar(leaderboard[0], 60, '#F5A623')}
                <View style={[s.rankPip, { backgroundColor: '#F5A623' }]}>
                  <Text style={s.rankPipText}>1</Text>
                </View>
              </View>
              <Text style={[s.topName, { fontSize: 14 }]} numberOfLines={1}>
                {leaderboard[0]?.name}
              </Text>
              <Text style={s.topWins}>{leaderboard[0]?.wins} wins</Text>
            </TouchableOpacity>

            {/* 3rd */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => goToProfile(leaderboard[2])}
              style={[
                s.topCard,
                s.thirdCard,
                leaderboard[2]?.name === myName && s.myTopCard,
              ]}
            >
              <View style={s.avatarWrap}>
                {renderAvatar(leaderboard[2], 52, '#CD7F32')}
                <View style={[s.rankPip, { backgroundColor: '#CD7F32' }]}>
                  <Text style={s.rankPipText}>3</Text>
                </View>
              </View>
              <Text style={s.topName} numberOfLines={1}>
                {leaderboard[2]?.name}
              </Text>
              <Text style={s.topWins}>{leaderboard[2]?.wins} wins</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full list */}
        {leaderboard.length === 0 ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconCircle}>
              <Trophy size={30} color="#a1a1a1" />
            </View>
            <Text style={s.emptyText}>No rankings yet</Text>
            <Text style={s.emptySubText}>Play a match to get on the board</Text>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item, index) => index.toString()}
            style={s.list}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item, index }) => {
              const isMe = item.name === myName;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => goToProfile(item)}
                  style={[s.row, isMe && s.myRow]}
                >
                  <View
                    style={[s.rankBadge, { backgroundColor: getRankBg(index) }]}
                  >
                    <Text
                      style={[s.rankBadgeText, { color: getRankColor(index) }]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  {renderAvatar(item, 38, getRankColor(index))}
                  <Text
                    style={[s.name, isMe && s.myNameText]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {isMe && (
                    <View style={s.youBadge}>
                      <Text style={s.youBadgeText}>YOU</Text>
                    </View>
                  )}
                  <View style={[s.winsPill, isMe && s.myWinsPill]}>
                    <Text style={s.wins}>{item.wins}</Text>
                    <Text style={s.winsLabel}>wins</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Layout>
  );
};

export default LeaderboardScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  resetNoteWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  resetNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(245,239,224,0.75)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },

  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 10,
  },
  topCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  firstCard: {
    marginBottom: 12,
    paddingTop: 8,
    borderColor: '#F5A623',
    borderWidth: 1.5,
  },
  secondCard: {},
  thirdCard: {},
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  rankPip: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.navyDark,
  },
  rankPipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textOnDark,
    textAlign: 'center',
  },
  topWins: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.6)',
    marginTop: 2,
    fontWeight: '600',
  },

  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  myRow: {
    backgroundColor: 'rgba(224,151,42,0.16)',
    borderColor: COLORS.gold,
    borderWidth: 1.5,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textOnDark,
    marginLeft: 12,
  },
  myNameText: {
    color: COLORS.gold,
  },
  youBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  youBadgeText: {
    color: COLORS.navyDark,
    fontSize: 9,
    fontWeight: 'bold',
  },
  winsPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  myWinsPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  wins: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
  },
  winsLabel: {
    fontSize: 10,
    color: 'rgba(245,239,224,0.6)',
    fontWeight: '600',
  },

  myTopCard: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
