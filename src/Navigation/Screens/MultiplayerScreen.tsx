
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle,
  LogIn,
  Search,
  UserPlus,
} from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import GradientCard from '../../components/GradientCard/GradientCard';
import { COLORS } from '../../theme/colors';
import InviteToast from '../../components/Toast/InviteToast'

type Props = { navigation: NativeStackNavigationProp<any> };

type SearchResultItem = {
  uid: string;
  username: string;
  photo: string | null;
  avatarId: string | null;
};

type Tab = 'friends' | 'recent';

const MultiplayerScreen = ({ navigation }: Props) => {
  const {
    myName,
    setMyName,
    roomName,
    setRoomName,
    generateRoomCode,
    recentOpponents,
    fetchRecentOpponents,
    sendInvitation,
    gameFriends,
    sendFriendRequest,
    searchPlayerByUsername,
    searchResults,
    fetchGameFriends,
    onlineStatus,
    incomingFriendRequests,
    incomingInvitations
  } = useGameLogic();
  const { userProfile, user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const myPhoto = userProfile?.photoURL || user?.photoURL || null;

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileReady(true);
      return;
    }

    const resolvedName =
      userProfile?.username ||
      userProfile?.name ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      '';

    if (resolvedName) {
      setMyName(resolvedName);
      setProfileReady(true);
    } else if (userProfile) {
      setProfileReady(true);
    }
  }, [userProfile, user]);

  useEffect(() => {
    fetchRecentOpponents();
    fetchGameFriends();
  }, [myName]);
  
// Refresh friends list on screen focus, in case it changed elsewhere
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGameFriends();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRecentOpponents(), fetchGameFriends()]);
    } finally {
      setRefreshing(false);
    }
  };

// Whether this player is already a friend — controls the "Add" button
  const isFriend = (name: string) =>
    gameFriends.some(
      (f: any) => f.name?.toLowerCase() === name?.toLowerCase()
    );

  const handleInvite = (name: string) => {
    sendInvitation(name);
    setToastMessage(`Invitation sent to ${name}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const requireLogin = (action: () => void) => {
    if (!profileReady) return;
    if (!myName) {
      Alert.alert('Login required', 'Please login before playing multiplayer.');
      return;
    }
    action();
  };

  const handleAddFriend = (name: string) => {
    sendFriendRequest(name);
    setToastMessage(`Friend request sent to ${name}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      searchPlayerByUsername(text);
    }, 350);
  };

  // Avatar for list rows (game friends / search results) — avatarId > photo > letter
  const renderRowAvatar = (
    name: string,
    photo: string | null,
    avatarId?: string | null,
  ) => (
    <Avatar name={name} photoURL={photo} avatarId={avatarId} size={36} backgroundColor={COLORS.navy} />
  );

  if (!profileReady) {
    return (
     <Layout>
      <View style={[s.container, s.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={s.loadingText}>Loading your profile...</Text>
      </View>
    </Layout>
    );
  }

  return (
    <Layout 
      withScroll={false}
      header={{
        type: 'screen',
        title: 'Play with Friends',
        onBack: () => navigation.navigate('Mode'),
      }}
    >
       <View style={s.container}>
        <View style={s.playerHeader}>
          <Avatar name={myName || 'Guest'} photoURL={myPhoto} avatarId={userProfile?.avatarId} size={44} ring ringColor={COLORS.cream} />
          <View style={{ flex: 1 }}>
            <Text style={s.playingAsName} numberOfLines={1}>
              {myName || 'Guest'}
            </Text>
            <Text style={s.playingAsLabel}>Your Player ID</Text>
          </View>
        </View>

        <InviteToast
        invitations={incomingInvitations}
        friendRequests={incomingFriendRequests}
        navigation={navigation}
      />

        {/* Search by username */}
        <View style={s.searchBar}>
          <Search size={16} color="rgba(245,239,224,0.6)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search by username to add/invite"
            placeholderTextColor="rgba(245,239,224,0.5)"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        {searchQuery.length > 0 && (
          <View style={s.searchResultsBox}>
            {searchResults.length === 0 ? (
              <Text style={s.emptyText}>No user found</Text>
            ) : (
              searchResults.map((item: SearchResultItem) => (
                <View key={item.uid} style={s.playerRow}>
                  <View style={s.playerRowLeft}>
                    {renderRowAvatar(item.username, item.photo, item.avatarId)}
                    <Text style={s.playerRowName} numberOfLines={1}>
                      {item.username}
                    </Text>
                  </View>
                  <View style={s.playerRowActions}>
                    {!isFriend(item.username) && (
                      <TouchableOpacity
                        style={s.addBtn}
                        onPress={() => handleAddFriend(item.username)}
                      >
                        <Text style={s.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={s.inviteBtn}
                      onPress={() => handleInvite(item.username)}
                    >
                      <Text style={s.inviteBtnText}>Invite</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tabBtn, activeTab === 'friends' && s.tabBtnActive]}
            onPress={() => setActiveTab('friends')}  
          >
            <Text
              style={[s.tabText, activeTab === 'friends' && s.tabTextActive]}
            >
              Game Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabBtn, activeTab === 'recent' && s.tabBtnActive]}
            onPress={() => setActiveTab('recent')}  
          >
            <Text
              style={[s.tabText, activeTab === 'recent' && s.tabTextActive]}
            >
              Recent Players
            </Text>
          </TouchableOpacity>
        </View>

        {/* List area */}
        <View style={s.listBox}>
          {activeTab === 'friends' ? (
            gameFriends.length === 0 ? (
              <View style={s.emptyState}>
                <UserPlus size={30} color="#c3c9d6" />
                <Text style={s.emptyText}>No game friends yet</Text>
              </View>
            ) : (
              <FlatList
                data={gameFriends}
                keyExtractor={item => item.name}
                contentContainerStyle={{ padding: 12, gap: 10 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[COLORS.gold]}
                    tintColor={COLORS.gold}
                  />
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.playerRow}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('PlayerProfile', {
                        name: item.name,
                        uid: item.uid,
                        photo: item.photo,
                        avatarId: item.avatarId,
                      })
                    }
                  >
                    <View style={s.playerRowLeft}>
                      <View style={s.avatarWrap}>
                        {renderRowAvatar(item.name, item.photo, item.avatarId)}
                        <View
                          style={[
                            s.statusDot,
                            onlineStatus[item.name]
                              ? s.dotOnline
                              : s.dotOffline,
                          ]}
                        />
                      </View>
                      <Text style={s.playerRowName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.inviteBtn}
                      onPress={() => handleInvite(item.name)}
                    >
                      <Text style={s.inviteBtnText}>Invite</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )
          ) : recentOpponents.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No recent players</Text>
            </View>
          ) : (
            <FlatList
              data={recentOpponents}
              keyExtractor={item => item.name}
              contentContainerStyle={{ padding: 12, gap: 10 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.gold]}
                  tintColor={COLORS.gold}
                />
              }
              renderItem={({ item }) => (
    <View style={s.playerRow}>
      <View style={s.playerRowLeft}>
        <View style={s.avatarWrap}>
          {renderRowAvatar(item.name, item.photo, item.avatarId)}
          <View
            style={[
              s.statusDot,
              onlineStatus[item.name] ? s.dotOnline : s.dotOffline,
            ]}
          />
        </View>
        <Text style={s.playerRowName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={s.playerRowActions}>
        {!isFriend(item.name) && (
          <TouchableOpacity style={s.addBtn} onPress={() => handleAddFriend(item.name)}>
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.inviteBtn} onPress={() => handleInvite(item.name)}>
          <Text style={s.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>
    </View>
              )}
            />
          )}
        </View>

        {/* Room name input (optional) */}
        <TextInput
          style={s.input}
          placeholder="Room name (optional)"
          placeholderTextColor="rgba(245,239,224,0.5)"
          value={roomName}
          onChangeText={setRoomName}
        />

        {/* Action buttons */}
        <View style={s.btnGroup}>
          <TouchableOpacity
            style={s.btnTouchable}
            activeOpacity={0.88}
            onPress={() =>
              requireLogin(() => {
                generateRoomCode();
              })
            }
          >
            <GradientCard colors={['#2A5FCB', '#0F1E63']} borderRadius={16} style={s.btn}>
              <PlusCircle size={18} color="#fff" />
              <Text style={s.btnText}>Create Room</Text>
            </GradientCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnTouchable}
            activeOpacity={0.88}
            onPress={() => requireLogin(() => navigation.navigate('JoinRoom'))}
          >
            <GradientCard colors={['#3FD68F', '#1B8552']} borderRadius={16} style={s.btn}>
              <LogIn size={18} color="#fff" />
              <Text style={s.btnText}>Join Room</Text>
            </GradientCard>
          </TouchableOpacity>
        </View>

        {toastMessage && (
          <View style={s.toast}>
            <Text style={s.toastText}>{toastMessage}</Text>
          </View>
        )}
      </View>
    </Layout>
  );
};

export default MultiplayerScreen;

const s = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(245,239,224,0.7)',
    fontWeight: '600',
  },

  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 14,
    marginBottom: 14,
  },
  playingAsName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
  },
  playingAsLabel: {
    fontSize: 11,
    color: 'rgba(245,239,224,0.65)',
    marginTop: 2,
    fontWeight: '500',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textOnDark,
  },
  searchResultsBox: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 12,
    gap: 10,
    marginBottom: 10,
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
  tabBtnActive: {
    backgroundColor: COLORS.gold,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(245,239,224,0.6)',
  },
  tabTextActive: {
    color: COLORS.navyDark,
  },

  listBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(245,239,224,0.6)',
    fontWeight: '600',
  },
  playerRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addBtnText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 10,
  },
  playerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  playerRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnDark,
    flexShrink: 1,
  },
  inviteBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  inviteBtnText: {
    color: COLORS.navyDark,
    fontSize: 12,
    fontWeight: '700',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 14,
    color: COLORS.textOnDark,
  },

  btnGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  btnTouchable: {
    flex: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#182992',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ---- Online/offline status dot ----
  avatarWrap: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.navyDark,
  },
  dotOnline: { backgroundColor: '#28C76F' },
  dotOffline: { backgroundColor: '#9098a8' },
});