
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import Clipboard from '@react-native-clipboard/clipboard';
import { Copy, Users, DoorOpen, Crown } from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const RoomScreen = ({ navigation }: Props) => {
  const {
    myName,
    myPhoto,
    roomCode,
    opponentName,
    opponentPhoto,
    leaveRoom,
  } = useGameLogic();

  const guestJoined = !!opponentName;

   useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
          const actionType = e.data?.action?.type;
          console.log('beforeRemove fired, actionType:', actionType);
          if (actionType === 'GO_BACK' || actionType === 'POP') {
            console.log('Calling leaveRoom()...');
            leaveRoom();
          }
        });
        return unsubscribe;
      }, [navigation, leaveRoom]);
      
      const handleLeave = () => {
    leaveRoom();
    navigation.navigate('Multiplayer' as never);
  };
  

  const handleCopyCode = () => {
    Clipboard.setString(roomCode);
    Alert.alert('Copied', 'Room code copied to clipboard');
  };


  return (
    <Layout>
      <View style={s.container}>
        <View style={s.panel}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Game Room</Text>
          <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
            <DoorOpen size={17} color="#f2c9d1" />
          </TouchableOpacity>
        </View>

        {/* Room code row */}
        <View style={s.codeRow}>
          <View>
            <Text style={s.codeLabel}>ROOM CODE</Text>
            <Text style={s.codeText}>{roomCode}</Text>
          </View>
          <TouchableOpacity style={s.copyBtn} onPress={handleCopyCode}>
            <Copy size={15} color="#eef0fa" />
            <Text style={s.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.codeHint}>Share this code with a friend to join</Text>

        <View style={s.divider} />

        {/* Players */}
        <View style={s.playersWrap}>
          <PlayerSlot name={myName} photo={myPhoto} isHost filled />
          <View style={s.vsCircle}>
            <Text style={s.vsText}>VS</Text>
          </View>
          <PlayerSlot
            name={opponentName}
            photo={opponentPhoto}
            isHost={false}
            filled={guestJoined}
          />
        </View>

        <View style={s.statusRow}>
          {!guestJoined ? (
            <>
              <ActivityIndicator size="small" color="#c7cbe0" />
              <Text style={s.waitingText}>Waiting for opponent to join...</Text>
            </>
          ) : (
            <Text style={s.guestWaitingText}>
              Opponent joined — starting game...
            </Text>
          )}
        </View>

        <TouchableOpacity style={s.leaveRoomBtn} onPress={handleLeave}>
          <DoorOpen size={15} color="#f9d9e0" />
          <Text style={s.leaveRoomBtnText}>Leave Room</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Layout>
  );
};

const PlayerSlot = ({
  name,
  photo,
  isHost,
  filled,
}: {
  name?: string | null;
  photo?: string | null;
  isHost: boolean;
  filled: boolean;
}) => (
  <View style={s.playerSlot}>
    <View
      style={[
        s.playerAvatar,
        filled ? s.playerAvatarFilled : s.playerAvatarEmpty,
      ]}
    >
      {filled ? (
        <Avatar name={name} photoURL={photo} size={56} backgroundColor="#5c6a9e" />
      ) : (
        <Users size={20} color="#c7cbe0" />
      )}
    </View>
    {isHost && filled && (
      <View style={s.hostBadge}>
        <Crown size={11} color="#c9a227" />
      </View>
    )}
    <Text style={s.playerName} numberOfLines={1}>
      {filled ? name : 'Waiting...'}
    </Text>
  </View>
);

export default RoomScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  panel: {
    backgroundColor: 'rgba(45, 48, 69, 0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 22,
    paddingHorizontal: 22,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f2f3fa',
    letterSpacing: 0.3,
  },
  leaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    fontSize: 10,
    color: '#a3a9ba',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#f2f3fa',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  copyBtnText: {
    color: '#eef0fa',
    fontSize: 12,
    fontWeight: '600',
  },
  codeHint: {
    fontSize: 11,
    color: '#9098b0',
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },

  playersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerSlot: {
    alignItems: 'center',
    width: 108,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  playerAvatarFilled: {
    backgroundColor: '#5c6a9e',
  },
  playerAvatarEmpty: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  hostBadge: {
    position: 'absolute',
    top: 40,
    right: 26,
    backgroundColor: '#fff',
    borderRadius: 9,
    padding: 3,
  },
  playerName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#e4e6f2',
  },

  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c7cbe0',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
  },
  waitingText: {
    fontSize: 13,
    color: '#c7cbe0',
    fontWeight: '600',
  },
  guestWaitingText: {
    fontSize: 13,
    color: '#a8e6bf',
    fontWeight: '700',
  },
  leaveRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    backgroundColor: 'rgba(236, 169, 182, 0.39)',
    borderWidth: 1,
    borderColor: 'rgba(242,201,209,0.25)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  leaveRoomBtnText: {
    color: '#ffff',
    fontSize: 13,
    fontWeight: '600',
  },
});