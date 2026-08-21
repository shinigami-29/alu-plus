import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import database from '@react-native-firebase/database';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/AppLayout/Layout';
import GradientCard from '../../components/GradientCard/GradientCard';
import { Users, Check, Crown, Copy } from 'lucide-react-native';
import { generateBracketRound1 } from '../../components/Utils/bracketGenerator';

type Participant = {
  uid: string;
  name: string;
  avatarId?: string;
  ready: boolean;
  joinedAt: number;
};

type Props = { navigation: any; route: any };

// NOTE: lowered to 1 for testing so a single player can start a tournament.
// Bump this back to 2 once you're done testing.
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 20;

const EventLobbyScreen = ({ navigation, route }: Props) => {
  const { eventId } = route.params as { eventId: string };
  const { user, userProfile } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hostUid, setHostUid] = useState<string | null>(null);
  const [eventCode, setEventCode] = useState('');
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Prevents the auto-join effect from re-adding the user right after they leave
  const isLeavingRef = useRef(false);

  const myUid = user?.uid;
  const isHost = myUid === hostUid;
  const me = participants.find((p) => p.uid === myUid);

  // FIX: the host never gets a "Mark Ready" toggle — they only ever see
  // Start/Waiting — so requiring the host's own `ready` flag meant the
  // Start button could never unlock. The host clicking Start IS their
  // readiness, so only the other participants need to be ready.
  const allReady =
    participants.length >= MIN_PLAYERS &&
    participants.filter((p) => p.uid !== hostUid).every((p) => p.ready);

  const applyEventSnapshot = (data: any) => {
    if (!data) return;
    setHostUid(data.createdBy);
    setEventCode(data.code || '');

    const list: Participant[] = data.participants
      ? Object.entries(data.participants).map(([uid, p]: any) => ({
          uid,
          name: p.name,
          avatarId: p.avatarId,
          ready: p.ready,
          joinedAt: p.joinedAt,
        }))
      : [];
    list.sort((a, b) => a.joinedAt - b.joinedAt);
    setParticipants(list);

    if (data.status === 'in_progress') {
      navigation.replace('EventBracket', { eventId });
    }
  };

  // Listen to event + participants (live updates)
  useEffect(() => {
    const eventRef = database().ref(`events/${eventId}`);
    const listener = eventRef.on('value', (snap) => {
      applyEventSnapshot(snap.val());
    });

    return () => eventRef.off('value', listener);
  }, [eventId]);

  // Join automatically on mount if not already in
  useEffect(() => {
    if (!myUid || isLeavingRef.current) return;
    const alreadyIn = participants.some((p) => p.uid === myUid);
    if (!alreadyIn && participants.length < MAX_PLAYERS) {
      database()
        .ref(`events/${eventId}/participants/${myUid}`)
        .set({
          name: userProfile?.name || user?.displayName || 'Guest',
          avatarId: userProfile?.avatarId || null,
          ready: false,
          joinedAt: Date.now(),
        });
    }
  }, [participants.length]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    database()
      .ref(`events/${eventId}`)
      .once('value')
      .then((snap) => {
        applyEventSnapshot(snap.val());
      })
      .catch(() => {})
      .finally(() => {
        setRefreshing(false);
      });
  }, [eventId]);

  const toggleReady = () => {
    if (!myUid || !me) return;
    database().ref(`events/${eventId}/participants/${myUid}/ready`).set(!me.ready);
  };

  const handleLeave = () => {
    if (!myUid) return;
    isLeavingRef.current = true;
    const wasHost = myUid === hostUid;

    database()
      .ref(`events/${eventId}/participants/${myUid}`)
      .remove()
      .then(() => database().ref(`events/${eventId}/participants`).once('value'))
      .then((snap) => {
        const remaining = snap.val();

        if (!remaining || Object.keys(remaining).length === 0) {
          // No one left in the room — remove the whole event
          return database().ref(`events/${eventId}`).remove();
        }

        if (wasHost) {
          // Host left — hand leadership to whoever joined earliest among those left
          const [nextHostUid] = Object.entries(remaining).sort(
            ([, a]: any, [, b]: any) => a.joinedAt - b.joinedAt
          )[0];
          return database().ref(`events/${eventId}/createdBy`).set(nextHostUid);
        }
      })
      .catch(() => {
        // Even if cleanup fails, still let the user leave the screen
      })
      .finally(() => {
        navigation.goBack();
      });
  };

  const handleStart = () => {
    if (participants.length < MIN_PLAYERS) {
      Alert.alert('Not enough players', `Need at least ${MIN_PLAYERS} to start.`);
      return;
    }
    if (!allReady) {
      Alert.alert('Waiting on players', 'All participants must be ready.');
      return;
    }
    setStarting(true);

    const { matches, totalRounds } = generateBracketRound1(
      participants.map((p) => ({ uid: p.uid, name: p.name }))
    );

    database()
      .ref(`events/${eventId}`)
      .update({
        status: 'in_progress',
        startedAt: Date.now(),
        'bracket/currentRound': 1,
        'bracket/totalRounds': totalRounds,
        'bracket/rounds/round1': matches,
      })
      .catch(() => {
        Alert.alert('Error', 'Could not start the tournament. Try again.');
      })
      .finally(() => {
        setStarting(false);
      });
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View style={s.participantRow}>
      <View style={s.participantLeft}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.participantName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.uid === hostUid && (
          <Crown size={14} color="#F2C879" style={{ marginLeft: 6 }} />
        )}
      </View>
      <View style={[s.readyPill, item.ready ? s.readyPillActive : s.readyPillInactive]}>
        {item.ready && <Check size={12} color="#0F1E63" />}
        <Text style={[s.readyPillText, item.ready ? s.readyPillTextActive : undefined]}>
          {item.uid === hostUid ? 'Host' : item.ready ? 'Ready' : 'Waiting'}
        </Text>
      </View>
    </View>
  );

  const ListHeader = (
    <>
      <GradientCard colors={['#E0972A', '#B31B34']} borderRadius={20} style={s.headerCard}>
        <View style={s.headerRow}>
          <Users size={22} color="#FFFFFF" />
          <Text style={s.headerTitle}>Tournament</Text>
        </View>
        <Text style={s.headerSubtitle}>
          {participants.length}/{MAX_PLAYERS} joined
        </Text>
      </GradientCard>

      <TouchableOpacity style={s.codeRow} activeOpacity={0.8}>
        <Text style={s.codeLabel}>Room Code</Text>
        <View style={s.codeValueRow}>
          <Text style={s.codeValue}>{eventCode || '------'}</Text>
          <Copy size={16} color="rgba(245,240,224,0.7)" />
        </View>
      </TouchableOpacity>
    </>
  );

  return (
    <Layout
      header={{
        type: 'screen',
        title: 'Event Lobby',
      }}
      withScroll={false}
    >
      <FlatList
        data={participants}
        keyExtractor={(item) => item.uid}
        renderItem={renderParticipant}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F2C879"
            colors={['#F2C879']}
          />
        }
      />

      <View style={s.bottomRow}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave} activeOpacity={0.85}>
          <Text style={s.leaveBtnText}>Leave</Text>
        </TouchableOpacity>

        {isHost ? (
          <TouchableOpacity
            style={[s.startBtn, (!allReady || starting) ? s.startBtnDisabled : undefined]}
            onPress={handleStart}
            disabled={!allReady || starting}
            activeOpacity={0.88}
          >
            <Text style={s.startBtnText}>
              {starting ? 'Starting…' : allReady ? 'Start Tournament' : 'Waiting for Ready'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.readyBtn, me?.ready ? s.readyBtnActive : undefined]}
            onPress={toggleReady}
            activeOpacity={0.88}
          >
            <Text style={[s.readyBtnText, me?.ready ? s.readyBtnTextActive : undefined]}>
              {me?.ready ? "I'm Ready ✓" : 'Mark Ready'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Layout>
  );
};

export default EventLobbyScreen;

const s = StyleSheet.create({
  headerCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  codeRow: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  codeLabel: {
    color: 'rgba(245,240,224,0.65)',
    fontSize: 11,
    fontWeight: '700',
  },
  codeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeValue: {
    color: '#FFF6E8',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A5FCB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  participantName: {
    color: 'rgba(245,240,224,0.92)',
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  readyPillActive: {
    backgroundColor: '#7FD9A6',
  },
  readyPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  readyPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(245,240,224,0.7)',
  },
  readyPillTextActive: {
    color: '#0F1E63',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingBottom: 15,
  },
  leaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(179,27,52,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(179,27,52,0.4)',
  },
  leaveBtnText: {
    color: '#F19191',
    fontWeight: '700',
    fontSize: 14,
  },
  startBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#E0972A',
  },
  startBtnDisabled: {
    backgroundColor: 'rgba(224,151,42,0.35)',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  readyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(127,217,166,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(127,217,166,0.5)',
  },
  readyBtnActive: {
    backgroundColor: '#7FD9A6',
    borderColor: '#7FD9A6',
  },
  readyBtnText: {
    color: '#7FD9A6',
    fontWeight: '800',
    fontSize: 14,
  },
  readyBtnTextActive: {
    color: '#0F1E63',
  },
});