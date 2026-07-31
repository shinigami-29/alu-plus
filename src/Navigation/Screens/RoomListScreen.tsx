import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  FlatList,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { DoorOpen, Users, ArrowLeft, RefreshCw } from 'lucide-react-native';

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
  const { allRooms, fetchAllRooms, joinRoomWithCode, multiplayerError } =
    useGameLogic();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllRooms();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllRooms();
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleJoin = (room: RoomItem) => {
    if (room.status !== 'waiting') return;
    joinRoomWithCode(room.roomCode);
    // GameLogicContext's effect auto-navigates to Waiting/MultiplayerGame
    // once the join updates logic.screen — no manual navigate needed here.
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
            { backgroundColor: isWaiting ? '#E9FBF0' : '#FDEBEE' },
          ]}
        >
          <Text
            style={[s.statusText, { color: isWaiting ? '#28C76F' : '#FF4B6E' }]}
          >
            {isWaiting ? 'Waiting' : 'In Progress'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.container}
      resizeMode="cover"
    >
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#182992" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Room List</Text>
        <TouchableOpacity style={s.backBtn} onPress={handleRefresh}>
          <RefreshCw size={18} color="#182992" />
        </TouchableOpacity>
      </View>

      {!!multiplayerError && (
        <Text style={s.errorText}>{multiplayerError}</Text>
      )}

      <FlatList
        data={allRooms}
        keyExtractor={item => item.roomCode}
        renderItem={renderItem}
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
    </ImageBackground>
  );
};

export default RoomListScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cbd8f4',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#cdcdf9',
    marginTop: 16
  },

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
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#182992',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roomCardDisabled: {
    opacity: 0.6,
  },
  roomIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#182992',
  },
  roomHost: {
    fontSize: 12,
    color: '#9098a8',
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
    color: '#cdcdf9',
  },
  emptySubText: {
    fontSize: 12,
    color: '#dce0ee',
    textAlign: 'center',
  },
});
