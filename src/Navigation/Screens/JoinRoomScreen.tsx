 import React,{useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { LogIn } from 'lucide-react-native';
import { DoorOpen } from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import { useRoute } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<any> };

const JoinRoomScreen = ({ navigation }: Props) => {
  const { joinCode, setJoinCode, joinRoom, multiplayerError, leaveRoom } = useGameLogic();
  const route = useRoute<any>();
const prefillCode = route.params?.prefillCode;


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
    
    useEffect(() => {
  if (prefillCode) {
    setJoinCode(prefillCode);
  }
}, [prefillCode]);
    const handleLeave = () => {
  leaveRoom();
  navigation.navigate('Multiplayer' as never);
};


  return (
   <Layout withScroll={false}>
    <View style={s.container}>
        <View style={s.card}>
          <View style={s.iconCircle}>
            <LogIn size={26} color="#c7cbe0" />
          </View>

          <Text style={s.title}>Join a Room</Text>
          <Text style={s.subtitle}>
            Enter the 6-digit code your friend shared with you
          </Text>     

          <TextInput
            style={s.input}
            placeholder="000000"
            placeholderTextColor="#8890a8"
            value={joinCode}
            onChangeText={setJoinCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          {multiplayerError ? (
            <Text style={s.errorText}>{multiplayerError}</Text>
          ) : null}

          <TouchableOpacity
            style={[s.btn, !joinCode && s.btnDisabled]}
            disabled={!joinCode}
            onPress={() => {
              joinRoom();
            }}
          >
            <Text style={s.btnText}>Join Room</Text>
          </TouchableOpacity>
        
          <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
            <DoorOpen size={15} color="#f9d9e0"/>
            <Text style={s.leaveBtnText}>Leave</Text>
            </TouchableOpacity>
        </View>
      </View>
   </Layout>
  );
};

export default JoinRoomScreen;

const s = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backText: {
    color: '#e4e6f2',
    fontSize: 13,
    fontWeight: '600',
  },

  card: {
    backgroundColor: 'rgba(45, 48, 69, 0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f2f3fa',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#a3a9ba',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 17,
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: '100%',
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    color: '#3a3f5c',
    marginBottom: 14,
  },
  errorText: {
    color: '#f2a8a8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },

  btn: {
    backgroundColor: '#5c6a9e',
    paddingVertical: 15,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: 'rgba(92,106,158,0.4)',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    width: '100%',
    backgroundColor: 'rgba(226, 147, 161, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(242,201,209,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  leaveBtnText: {
    color: '#ffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
