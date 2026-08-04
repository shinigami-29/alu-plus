import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import { COLORS } from '../../theme/colors';

type Props = { navigation: NativeStackNavigationProp<any> };

const WaitingScreen = ({ navigation }: Props) => {
  const { myName, roomCode, roomName, leaveRoom, gameStarted } = useGameLogic();
  const { user, userProfile } = useAuth();

  const myPhoto = userProfile?.photoURL || user?.photoURL || null;

  useEffect(() => {
    if (gameStarted) {
      navigation.navigate('MultiplayerGame');
    }
  }, [gameStarted]);

  return (
  <Layout>
      <View style={s.container}>
      <Text style={s.title}>Waiting Room</Text>

      <Avatar
        name={myName}
        photoURL={myPhoto}
        avatarId={userProfile?.avatarId}
        size={72}
        backgroundColor="#189292"
        ring
        ringColor={COLORS.gold}
        style={{ marginBottom: 8 }}
      />
      <Text style={s.myNameText} numberOfLines={1}>
        {myName}
      </Text>

      <View style={s.roomInfoBox}>
        <Text style={s.roomInfoLabel}>Room:</Text>
        <Text style={s.roomInfoValue}>{roomName || `${myName}'s Room`}</Text>
      </View>

      <View style={s.roomInfoBox}>
        <Text style={s.roomInfoLabel}>Code:</Text>
        <Text style={s.roomCodeText}>{roomCode}</Text>
      </View>

      <ActivityIndicator size="large" color={COLORS.gold} />

      <Text style={s.shareText}>Waiting for opponent...</Text>

      <TouchableOpacity
        onPress={() => {
          leaveRoom();
          navigation.navigate('Mode');
        }}
        style={s.backBtn}
      >
        <Text style={s.backText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </Layout>
  );
};

export default WaitingScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
    marginBottom: 24,
  },
  myNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textOnDark,
    marginBottom: 20,
    maxWidth: 200,
  },
  roomInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    width: '100%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  roomInfoLabel: {
    fontSize: 14,
    color: 'rgba(245,239,224,0.65)',
    fontWeight: '600',
  },
  roomInfoValue: {
    fontSize: 16,
    color: COLORS.textOnDark,
    fontWeight: '700',
  },
  roomCodeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.gold,
    letterSpacing: 4,
    marginVertical: 10,
  },
  shareText: {
    fontSize: 13,
    color: 'rgba(245,239,224,0.6)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backText: {
    color: COLORS.textOnDark,
    fontSize: 16,
    fontWeight: '600',
  },
});
