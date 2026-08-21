import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { Check, X, MailOpen, UserPlus, Clock } from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import { COLORS } from '../../theme/colors';
import Toast from '../../components/Toast/Toast';

type Props = { navigation: NativeStackNavigationProp<any> };
type Tab = 'invites' | 'requests';

const InvitationScreen = ({ navigation }: Props) => {
  const {
    myName,
    screen,
    acceptInvitation,
    rejectInvitation,
    incomingInvitations,
    acceptFriendRequest,
    rejectFriendRequest,
    incomingFriendRequests,
     multiplayerError,
     INVITE_TTL_MS,
  } = useGameLogic();

  const [activeTab, setActiveTab] = useState<Tab>('invites');

  // NEW: ticking clock so the countdown badge on each invite card updates
  // every second without needing a fresh Firebase write
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (screen === 'multiplayerGame') {
      navigation.replace('MultiplayerGame');
    }
  }, [screen]);

  const handleAccept = (fromName: string) => acceptInvitation(fromName);
  const handleReject = (fromName: string) => rejectInvitation(fromName);

  const handleAcceptFriend = (fromName: string) =>
    acceptFriendRequest(fromName);
  const handleRejectFriend = (fromName: string) =>
    rejectFriendRequest(fromName);

  // NEW: seconds left before this invite auto-expires, floored at 0
  const getSecondsLeft = (timestamp: number) => {
    if (!timestamp) return null;
    const msLeft = timestamp + INVITE_TTL_MS - now;
    return Math.max(0, Math.ceil(msLeft / 1000));
  };

  return (
    <Layout
      withScroll={false}
      header={{
        type: 'screen',
        title: 'Invitations',
        onBack: () => navigation.goBack(),
      }}
    >
      <View style={s.container}>
        {!myName ? (
          <View style={s.emptyContainer}>
            <Text style={s.sectionTitle}>Enter Your Name!</Text>
            <TouchableOpacity
              style={s.goBtn}
              onPress={() => navigation.navigate('Multiplayer')}
            >
              <Text style={s.goBtnText}>Go to Multiplayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Tabs */}
            <View style={s.tabRow}>
              <TouchableOpacity
                style={[s.tabBtn, activeTab === 'invites' && s.tabBtnActive]}
                onPress={() => setActiveTab('invites')}
              >
                <Text
                  style={[
                    s.tabText,
                    activeTab === 'invites' && s.tabTextActive,
                  ]}
                >
                  Game Invites
                  {incomingInvitations.length > 0
                    ? ` (${incomingInvitations.length})`
                    : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tabBtn, activeTab === 'requests' && s.tabBtnActive]}
                onPress={() => setActiveTab('requests')}
              >
                <Text
                  style={[
                    s.tabText,
                    activeTab === 'requests' && s.tabTextActive,
                  ]}
                >
                  Friend Requests
                  {incomingFriendRequests.length > 0
                    ? ` (${incomingFriendRequests.length})`
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'invites' ? (
              incomingInvitations.length === 0 ? (
                <View style={s.emptyContainer}>
                  <View style={s.emptyIconCircle}>
                    <MailOpen size={28} color="#a1a1a1" />
                  </View>
                  <Text style={s.emptyText}>No invitations</Text>
                  <Text style={s.emptySubText}>
                    Invites from friends will show up here
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={incomingInvitations}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={s.content}
                  renderItem={({ item }) => {
                    const secondsLeft = getSecondsLeft(item.timestamp);
                    return (
                      <View style={s.playerCard}>
                        <Avatar
                          name={item.from}
                          photoURL={item.fromPhoto}
                          avatarId={item.fromAvatarId}
                          size={46}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={s.playerName} numberOfLines={1}>
                            {item.from}
                          </Text>
                          <Text style={s.inviteSubtext}>
                            wants to play with you
                          </Text>
                          {secondsLeft !== null && (
                            <View style={s.countdownRow}>
                              <Clock size={11} color="rgba(245,239,224,0.5)" />
                              <Text style={s.countdownText}>
                                {secondsLeft}s left
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={s.actionRow}>
                          <TouchableOpacity
                            style={s.acceptBtn}
                            onPress={() => handleAccept(item.from)}
                          >
                            <Check size={16} color="#fff" strokeWidth={3} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.rejectBtn}
                            onPress={() => handleReject(item.from)}
                          >
                            <X size={16} color="#fff" strokeWidth={3} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />
              )
            ) : incomingFriendRequests.length === 0 ? (
              <View style={s.emptyContainer}>
                <View style={s.emptyIconCircle}>
                  <UserPlus size={28} color="#a1a1a1" />
                </View>
                <Text style={s.emptyText}>No friend requests</Text>
                <Text style={s.emptySubText}>
                  Friend requests will show up here
                </Text>
              </View>
            ) : (
              <FlatList
                data={incomingFriendRequests}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={s.content}
                renderItem={({ item }) => (
                  <View style={s.playerCard}>
                    <Avatar
                      name={item.from}
                      photoURL={item.fromPhoto}
                      avatarId={item.fromAvatarId}
                      size={46}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.playerName} numberOfLines={1}>
                        {item.from}
                      </Text>
                      <Text style={s.inviteSubtext}>
                        wants to be your game friend
                      </Text>
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={s.acceptBtn}
                        onPress={() => handleAcceptFriend(item.from)}
                      >
                        <Check size={16} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.rejectBtn}
                        onPress={() => handleRejectFriend(item.from)}
                      >
                        <X size={16} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}
      </View>

      <Toast message={multiplayerError} />
    </Layout>
  );
};

export default InvitationScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.gold },
  tabText: { fontSize: 12, fontWeight: '700', color: 'rgba(245,239,224,0.6)' },
  tabTextActive: { color: COLORS.navyDark },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textOnDark },
  emptySubText: {
    fontSize: 13,
    color: 'rgba(245,239,224,0.6)',
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
    marginBottom: 12,
  },
  goBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  goBtnText: { color: COLORS.navyDark, fontWeight: 'bold', fontSize: 15 },

  content: { paddingBottom: 24 },

  playerCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerName: { fontSize: 15, fontWeight: '700', color: COLORS.textOnDark },
  inviteSubtext: { fontSize: 12, color: 'rgba(245,239,224,0.6)', marginTop: 2 },

  // NEW: countdown badge shown under the "wants to play with you" subtext
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.5)',
    fontWeight: '600',
  },

  actionRow: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#28C76F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e57373',
    alignItems: 'center',
    justifyContent: 'center',
  },
});