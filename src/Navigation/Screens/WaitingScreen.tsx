import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../avatar/Avatar';
import Layout from '../../components/AppLayout/Layout';
// import GameLogic from '../../Game2/Gamelogic';

type Props = { navigation: NativeStackNavigationProp<any> };

const WaitingScreen = ({ navigation }: Props) => {
  const { myName, roomCode, roomName, leaveRoom, gameStarted } = useGameLogic();
  const { user, userProfile } = useAuth();

  const myAvatarSource = getAvatarSource(userProfile?.avatarId);
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

      {myAvatarSource ? (
        <Image source={myAvatarSource} style={s.avatar} />
      ) : myPhoto ? (
        <Image source={{ uri: myPhoto }} style={s.avatar} />
      ) : (
        <View style={s.avatarCircle}>
          <Text style={s.avatarLetter}>
            {myName?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
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

      <ActivityIndicator size="large" color="#007AFF" />

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
    backgroundColor: '#F5F4F0',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#182992',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#189292',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  myNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#182992',
    marginBottom: 20,
    maxWidth: 200,
  },
  roomInfoBox: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dde3f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  roomInfoLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  roomInfoValue: {
    fontSize: 16,
    color: '#182992',
    fontWeight: '700',
  },
  roomCodeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#182992',
    letterSpacing: 4,
    marginVertical: 10,
  },
  shareText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  backBtn: {
    marginTop: 16,
    padding: 10,
  },
  backText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
