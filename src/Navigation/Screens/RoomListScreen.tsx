import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { DoorOpen, Users, RefreshCw, Globe, Lock, X } from 'lucide-react-native';
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
  isPrivate: boolean;
};

const RoomListScreen = ({ navigation }: Props) => {
 const { allRooms, fetchAllRooms, stopFetchingAllRooms, joinRoomWithCode, multiplayerError } =
  useGameLogic();
  const [refreshing, setRefreshing] = useState(false);

  // Private-room join flow — tapping a private room opens this modal
  // instead of joining immediately; the user must type the room code.
  const [codeModalRoom, setCodeModalRoom] = useState<RoomItem | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

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

    if (room.isPrivate) {
      setCodeModalRoom(room);
      setEnteredCode('');
      setCodeError('');
      return;
    }

    joinRoomWithCode(room.roomCode);
  };

  const closeCodeModal = () => {
    setCodeModalRoom(null);
    setEnteredCode('');
    setCodeError('');
  };

  const handleConfirmCode = () => {
    if (!codeModalRoom) return;

    if (enteredCode.trim() !== codeModalRoom.roomCode) {
      setCodeError('Incorrect room code');
      return;
    }

    joinRoomWithCode(codeModalRoom.roomCode);
    closeCodeModal();
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
          <View style={s.roomNameRow}>
            <Text style={s.roomName} numberOfLines={1}>
              {item.roomName}
            </Text>
            <View
              style={[
                s.visBadge,
                item.isPrivate ? s.visBadgePrivate : s.visBadgePublic,
              ]}
            >
              {item.isPrivate ? (
                <Lock size={9} color="#f19191" />
              ) : (
                <Globe size={9} color="#5fd68f" />
              )}
              <Text
                style={[
                  s.visBadgeText,
                  { color: item.isPrivate ? '#f19191' : '#5fd68f' },
                ]}
              >
                {item.isPrivate ? 'PRIVATE' : 'PUBLIC'}
              </Text>
            </View>
          </View>
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

      {/* Private room — code entry */}
      <Modal
        visible={!!codeModalRoom}
        transparent
        animationType="fade"
        onRequestClose={closeCodeModal}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalPanel}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Private Room</Text>
              <TouchableOpacity style={s.modalCloseBtn} onPress={closeCodeModal}>
                <X size={16} color="#f2c9d1" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSubtitle} numberOfLines={1}>
              Enter the room code for "{codeModalRoom?.roomName}"
            </Text>

            <TextInput
              style={s.modalInput}
              placeholder="6-digit code"
              placeholderTextColor="rgba(245,239,224,0.4)"
              value={enteredCode}
              onChangeText={text => {
                setEnteredCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                if (codeError) setCodeError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {!!codeError && <Text style={s.modalError}>{codeError}</Text>}

            <TouchableOpacity
              style={[
                s.modalJoinBtn,
                enteredCode.length !== 6 && s.modalJoinBtnDisabled,
              ]}
              onPress={handleConfirmCode}
              disabled={enteredCode.length !== 6}
            >
              <Text style={s.modalJoinBtnText}>Join Room</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  roomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnDark,
    flexShrink: 1,
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

  // ---- Public/Private badge on each room card ----
  visBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  visBadgePublic: {
    backgroundColor: 'rgba(95,214,143,0.18)',
  },
  visBadgePrivate: {
    backgroundColor: 'rgba(241,145,145,0.18)',
  },
  visBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
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

  // ---- Private room code-entry modal ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalPanel: {
    backgroundColor: 'rgba(45, 48, 69, 0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 22,
    paddingHorizontal: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f2f3fa',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#9098b0',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: '#f2f3fa',
    textAlign: 'center',
  },
  modalError: {
    color: '#FF4B6E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  modalJoinBtn: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalJoinBtnDisabled: {
    opacity: 0.4,
  },
  modalJoinBtnText: {
    color: COLORS.navyDark,
    fontSize: 14,
    fontWeight: '700',
  },
});