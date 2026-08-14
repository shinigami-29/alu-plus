import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { DoorOpen, Users, RefreshCw } from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import { COLORS } from '../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type RoomItem = {
  roomCode: string;
  roomName: string;
  host: string;
  hostPhoto: string | null;
  guest: string | null;
  guestPhoto: string | null;
  status: 'waiting' | 'playing';
};

const RoomListScreen = ({ navigation }: Props) => {
 const { allRooms, fetchAllRooms, stopFetchingAllRooms, joinRoomWithCode, multiplayerError } =
  useGameLogic();
  const [refreshing, setRefreshing] = useState(false);

useEffect(() => {
  fetchAllRooms();
  return () => stopFetchingAllRooms();
}, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllRooms();
    setTimeout(() => setRefreshing(false), 400);
  };


  // GameLogicContext's effect auto-navigates to Waiting/MultiplayerGame
    // once the join updates logic.screen — no manual navigate needed here.
  const handleJoin = (room: RoomItem) => {
    if (room.status !== 'waiting') return;
    joinRoomWithCode(room.roomCode);
  };

  const renderItem = ({ item }: { item: RoomItem }) => {
    const isWaiting = item.status === 'waiting';
    return (
      <TouchableOpacity
        style={[s.roomCard, !isWaiting && s.roomCardDisabled]}
        disabled={!isWaiting}
        onPress={() => handleJoin(item)}
        activeOpacity={0.85}
      >
        <View style={s.roomIconWrap}>
          <Users size={22} color={isWaiting ? '#8B5CF6' : '#9098a8'} />
        </View>

        <View style={s.roomInfo}>
          <Text style={s.roomName} numberOfLines={1}>
            {item.roomName}
          </Text>
          <Text style={s.roomHost} numberOfLines={1}>
            Host: {item.host}
            {item.guest ? `  •  Guest: ${item.guest}` : ''}
          </Text>
        </View>

        <View
          style={[
            s.statusBadge,
            { backgroundColor: isWaiting ? 'rgba(95,214,143,0.18)' : 'rgba(241,145,145,0.18)' },
          ]}
        >
          <Text
            style={[s.statusText, { color: isWaiting ? '#5FD68F' : '#F19191' }]}
          >
            {isWaiting ? 'Waiting' : 'In Progress'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
  <Layout
      withScroll={false}
      header={{
        type: 'screen',
        title: 'Room List',
        onBack: () => navigation.goBack(),
        rightIcon: <RefreshCw size={18} color={COLORS.textOnDark} />,
        onRightPress: handleRefresh,
      }}
    >
      {!!multiplayerError && (
        <Text style={s.errorText}>{multiplayerError}</Text>
      )}

      <FlatList
        data={allRooms}
        keyExtractor={item => item.roomCode}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <DoorOpen size={40} color="#f68c88e2" />
            <Text style={s.emptyText}>No open rooms right now</Text>
            <Text style={s.emptySubText}>
              Pull down to refresh, or create your own room
            </Text>
          </View>
        }
      />
  </Layout>
  );
};

export default RoomListScreen;

const s = StyleSheet.create({
  errorText: {
    color: '#FF4B6E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },

  listContent: {
    flex: 0.5,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  roomCardDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  roomIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(159,195,245,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnDark,
  },
  roomHost: {
    fontSize: 12,
    color: 'rgba(245,239,224,0.6)',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: 80,
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textOnDark,
  },
  emptySubText: {
    fontSize: 12,
    color: 'rgba(245,239,224,0.6)',
    textAlign: 'center',
  },
});
