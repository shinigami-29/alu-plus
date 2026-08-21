import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import database from '@react-native-firebase/database';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/AppLayout/Layout';
import GradientCard from '../../components/GradientCard/GradientCard';
import { RefreshCw, Users, KeyRound, Globe, Lock,Medal } from 'lucide-react-native';
import { generateRoomCode } from '../../components/Utils/roomCode';

type Props = { navigation: any };

type PublicEvent = {
  id: string;
  title: string;
  participantCount: number;
  maxPlayers: number;
};

const CreateEventScreen = ({ navigation }: Props) => {
  const { user, userProfile } = useAuth();
  const [joinCode, setJoinCode] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [joining, setJoining] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>([]);
  const [refreshingEvents, setRefreshingEvents] = useState(false);

  const myUid = user?.uid;

  // Listen for open public events (waiting status)
  useEffect(() => {
    const ref = database().ref('events').orderByChild('visibility').equalTo('public');

    const listener = ref.on('value', (snap) => {
      const data = snap.val() || {};
      const list: PublicEvent[] = Object.entries(data)
        .filter(([, e]: any) => e.status === 'waiting')
        .map(([id, e]: any) => ({
          id,
          title: e.title,
          participantCount: e.participants ? Object.keys(e.participants).length : 0,
          maxPlayers: e.maxPlayers || 20,
        }))
        .filter((e) => e.participantCount < e.maxPlayers);
      setPublicEvents(list);
    });

    return () => ref.off('value', listener);
  }, []);

  // Recursively tries a fresh code until it finds one that isn't taken (max 5 tries)
  const findUniqueCode = (attemptsLeft: number): Promise<string> => {
    const code = generateRoomCode();
    return database()
      .ref('events')
      .orderByChild('code')
      .equalTo(code)
      .once('value')
      .then((existing) => {
        if (!existing.exists() || attemptsLeft <= 0) {
          return code;
        }
        return findUniqueCode(attemptsLeft - 1);
      });
  };

  const handleCreateEvent = () => {
    if (!myUid) {
      Alert.alert('Not signed in', 'Please sign in to create an event.');
      return;
    }
    setCreating(true);

    findUniqueCode(5)
      .then((code) => {
        const eventRef = database().ref('events').push();
        const eventId = eventRef.key!;

        return eventRef
          .set({
            title: 'Tournament',
            code,
            visibility,
            status: 'waiting',
            minPlayers: 2,
            maxPlayers: 20,
            createdBy: myUid,
            createdAt: Date.now(),
            participants: {
              [myUid]: {
                name: userProfile?.name || user?.displayName || 'Guest',
                avatarId: userProfile?.avatarId || null,
                ready: false,
                joinedAt: Date.now(),
              },
            },
          })
          .then(() => eventId);
      })
      .then((eventId) => {
        navigation.navigate('EventLobby', { eventId });
      })
      .catch(() => {
        Alert.alert('Error', 'Could not create the event. Try again.');
      })
      .finally(() => {
        setCreating(false);
      });
  };

  const handleJoinByCode = () => {
    if (!myUid) {
      Alert.alert('Not signed in', 'Please sign in to join an event.');
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Enter a code', 'Please enter a room code to join.');
      return;
    }
    setJoining(true);

    database()
      .ref('events')
      .orderByChild('code')
      .equalTo(code)
      .once('value')
      .then((snap) => {
        if (!snap.exists()) {
          Alert.alert('Not found', 'No event found with that code.');
          return;
        }

        const data = snap.val();
        const matchId = Object.keys(data)[0];
        const eventData = data[matchId];

        if (eventData.status !== 'waiting') {
          Alert.alert('Already started', 'This event has already started.');
          return;
        }
        const participantCount = eventData.participants
          ? Object.keys(eventData.participants).length
          : 0;
        if (participantCount >= (eventData.maxPlayers || 20)) {
          Alert.alert('Room full', 'This event is already full.');
          return;
        }

        navigation.navigate('EventLobby', { eventId: matchId });
      })
      .catch(() => {
        Alert.alert('Error', 'Could not join the event. Try again.');
      })
      .finally(() => {
        setJoining(false);
      });
  };

  const handleJoinPublic = (eventId: string) => {
    navigation.navigate('EventLobby', { eventId });
  };

  const handleRefreshPublicEvents = () => {
  setRefreshingEvents(true);
  database()
    .ref('events')
    .orderByChild('visibility')
    .equalTo('public')
    .once('value')
    .then((snap) => {
      const data = snap.val() || {};
      const list: PublicEvent[] = Object.entries(data)
        .filter(([, e]: any) => e.status === 'waiting')
        .map(([id, e]: any) => ({
          id,
          title: e.title,
          participantCount: e.participants ? Object.keys(e.participants).length : 0,
          maxPlayers: e.maxPlayers || 20,
        }))
        .filter((e) => e.participantCount < e.maxPlayers);
      setPublicEvents(list);
    })
    .catch(() => {})
    .finally(() => {
      setRefreshingEvents(false);
    });
};

  return (
    <Layout
      header={{
        type: 'screen',
        title: 'Events',
        onBack: () => navigation.goBack(),
      }}
    >
      <GradientCard colors={['#6C3BAA', '#2E1065']}borderRadius={20} style={s.introCard}>
        <View style={s.introIconWrap}>
         <Medal size={24} color="#FFFFFF" />
        </View>
        <Text style={s.introTitle}>Tournament</Text>
      </GradientCard>

      <View style={s.visibilityRow}>
        <TouchableOpacity
          style={[s.visibilityBtn, visibility === 'private' && s.visibilityBtnActive]}
          onPress={() => setVisibility('private')}
          activeOpacity={0.85}
        >
          <Lock size={14} color={visibility === 'private' ? '#12194A' : 'rgba(245,240,224,0.6)'} />
          <Text style={[s.visibilityText, visibility === 'private' && s.visibilityTextActive]}>
            Private (Friends)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.visibilityBtn, visibility === 'public' && s.visibilityBtnActive]}
          onPress={() => setVisibility('public')}
          activeOpacity={0.85}
        >
          <Globe size={14} color={visibility === 'public' ? '#12194A' : 'rgba(245,240,224,0.6)'} />
          <Text style={[s.visibilityText, visibility === 'public' && s.visibilityTextActive]}>
            Public (Anyone)
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={s.createBtn}
        activeOpacity={0.88}
        onPress={handleCreateEvent}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Users size={18} color="#FFFFFF" />
            <Text style={s.createBtnText}>Create Event</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>OR</Text>
        <View style={s.dividerLine} />
      </View>

      <View style={s.joinRow}>
        <View style={s.joinInputWrap}>
          <KeyRound size={16} color="rgba(245,240,224,0.6)" />
          <TextInput
            style={s.joinInput}
            placeholder="Enter room code"
            placeholderTextColor="rgba(245,240,224,0.4)"
            autoCapitalize="characters"
            value={joinCode}
            onChangeText={setJoinCode}
          />
        </View>
        <TouchableOpacity
          style={s.joinBtn}
          activeOpacity={0.88}
          onPress={handleJoinByCode}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator color="#12194A" size="small" />
          ) : (
            <Text style={s.joinBtnText}>Join</Text>
          )}
        </TouchableOpacity>
      </View>

      {publicEvents.length > 0 && (
        <>
         <View style={s.sectionHeaderRow}>
      <Globe size={14} color="rgba(245,240,224,0.6)" />
      <Text style={s.sectionHeaderText}>Open Public Tournament</Text>
      <TouchableOpacity
        onPress={handleRefreshPublicEvents}
        disabled={refreshingEvents}
        activeOpacity={0.7}
        style={s.refreshBtn}
      >
        {refreshingEvents ? (
          <ActivityIndicator size="small" color="rgba(245,240,224,0.6)" />
        ) : (
          <RefreshCw size={14} color="rgba(245,240,224,0.6)" />
        )}
      </TouchableOpacity>
    </View>
          <FlatList
            data={publicEvents}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.publicRow}
                activeOpacity={0.85}
                onPress={() => handleJoinPublic(item.id)}
              >
                <View>
                  <Text style={s.publicTitle}>{item.title}</Text>
                  <Text style={s.publicSubtitle}>
                    {item.participantCount}/{item.maxPlayers} joined
                  </Text>
                </View>
                <View style={s.publicJoinPill}>
                  <Text style={s.publicJoinPillText}>Join</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </Layout>
  );
};

export default CreateEventScreen;

const s = StyleSheet.create({
  introCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  introIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  visibilityRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  visibilityBtnActive: {
    backgroundColor: '#F2C879',
  },
  visibilityText: {
    color: 'rgba(245,240,224,0.6)',
    fontWeight: '700',
    fontSize: 12,
  },
  visibilityTextActive: {
    color: '#12194A',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A5FCB',
    paddingVertical: 16,
    borderRadius: 16,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dividerText: {
    color: 'rgba(245,240,224,0.5)',
    fontSize: 11,
    fontWeight: '700',
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  joinInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14,
  },
  joinInput: {
    flex: 1,
    color: '#FFF6E8',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 14,
  },
  joinBtn: {
    backgroundColor: '#F2C879',
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#12194A',
    fontWeight: '800',
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    justifyContent: 'space-between', 
  },
  
  sectionHeaderText: {
    color: 'rgba(245,240,224,0.6)',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
      flexShrink: 1, 
  },
  refreshBtn: {
  padding: 4,
},
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  publicTitle: {
    color: 'rgba(245,240,224,0.92)',
    fontWeight: '700',
    fontSize: 13.5,
  },
  publicSubtitle: {
    color: 'rgba(245,240,224,0.55)',
    fontSize: 11,
    marginTop: 2,
  },
  publicJoinPill: {
    backgroundColor: '#7FD9A6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  publicJoinPillText: {
    color: '#0F1E63',
    fontWeight: '800',
    fontSize: 12,
  },
});