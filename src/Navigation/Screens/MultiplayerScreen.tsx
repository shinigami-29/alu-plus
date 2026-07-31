
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_LIST, getAvatarSource } from '../../avatar/Avatar';
import {
  ArrowLeft,
  PlusCircle,
  LogIn,
  User,
  Search,
  UserPlus,
} from 'lucide-react-native';

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
  } = useGameLogic();
  const { userProfile, user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const avatarSource = getAvatarSource(userProfile?.avatarId);
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

  // Screen focus hunda pani game friends refresh garne — kunai arko screen
  // (jastai PlayerProfile) bata friend remove garisake pachi ali "Add"
  // button feri dekhinu parxa
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

  // Kunai player already game friend ho ki hoina check garne — yesle
  // "Add" button lai Recent Players ra Search results duibai ma control garxa.
  // Friend remove vayesi gameFriends bata hataunxa, ani yo function le
  // automatic false return garxa, so "Add" button feri deखिन्छ।
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

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchPlayerByUsername(text);
  };

  // list rows (game friends / search results) ko avatar — avatarId > photo > letter
  const renderRowAvatar = (
    name: string,
    photo: string | null,
    avatarId?: string | null,
  ) => {
    const source = getAvatarSource(avatarId);
    if (source) {
      return <Image source={source} style={s.rowAvatarCircle} />;
    }
    if (photo) {
      return <Image source={{ uri: photo }} style={s.rowAvatarCircle} />;
    }
    return (
      <View style={s.rowAvatarCircle}>
        <Text style={s.rowAvatarLetter}>
          {name?.[0]?.toUpperCase() ?? '?'}
          {/* {item?.[0]?.toUpperCase() ?? '?'} */}
          </Text>
      </View>
    );
  };

  if (!profileReady) {
    return (
      <View style={[s.container, s.loadingContainer]}>
        <ActivityIndicator size="large" color="#182992" />
        <Text style={s.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.bg}
      resizeMode="cover"
    >
      <View style={s.container}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.navigate('Mode')}
          >
            <ArrowLeft size={20} color="#acb3ea" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Play with Friends</Text>
          <View style={{ width: 23 }} />
        </View>

        <View style={s.playerHeader}>
          {avatarSource ? (
            <Image source={avatarSource} style={s.avatar} />
          ) : myPhoto ? (
            <Image source={{ uri: myPhoto }} style={s.avatar} />
          ) : (
            <View style={s.avatarCircle}>
              <User size={20} color="#182992" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.playingAsName} numberOfLines={1}>
              {myName || 'Guest'}
            </Text>
            <Text style={s.playingAsLabel}>Your Player ID</Text>
          </View>
        </View>

        {/* Search by username */}
        <View style={s.searchBar}>
          <Search size={16} color="#9098a8" />
          <TextInput
            style={s.searchInput}
            placeholder="Search by username to add/invite"
            placeholderTextColor="#9098a8"
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
                    colors={['#182992']}
                    tintColor="#182992"
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
                  colors={['#182992']}
                  tintColor="#182992"
                />
              }
              // renderItem={({ item }) => (
              //   <View style={s.playerRow}>
              //     <View style={s.playerRowLeft}>
              //       <View style={s.avatarWrap}>
              //         {renderRowAvatar(item.name, item.photo, item.avatarId)}
              //         <View style={s.rowAvatarCircle}>
              //           <Text style={s.rowAvatarLetter}>
              //             {item?.[0]?.toUpperCase() ?? '?'}
              //           </Text>
              //         </View>
              //         <View
              //           style={[
              //             s.statusDot,
              //             onlineStatus[item] ? s.dotOnline : s.dotOffline,
              //           ]}
              //         />
              //       </View>
              //       <Text style={s.playerRowName} numberOfLines={1}>
              //         {item}
              //       </Text>
              //     </View>
              //     <View style={s.playerRowActions}>
              //       {!isFriend(item) && (
              //         <TouchableOpacity
              //           style={s.addBtn}
              //           onPress={() => handleAddFriend(item)}
              //         >
              //           <Text style={s.addBtnText}>Add</Text>
              //         </TouchableOpacity>
              //       )}
              //       <TouchableOpacity
              //         style={s.inviteBtn}
              //         onPress={() => handleInvite(item)}
              //       >
              //         <Text style={s.inviteBtnText}>Invite</Text>
              //       </TouchableOpacity>
              //     </View>
              //   </View>
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
          placeholderTextColor="#9098a8"
          value={roomName}
          onChangeText={setRoomName}
        />

        {/* Action buttons */}
        <View style={s.btnGroup}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#182992' }]}
            activeOpacity={0.85}
            onPress={() =>
              requireLogin(() => {
                generateRoomCode();
                navigation.navigate('Waiting');
              })
            }
          >
            <PlusCircle size={18} color="#fff" />
            <Text style={s.btnText}>Create Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: '#28C76F' }]}
            activeOpacity={0.85}
            onPress={() => requireLogin(() => navigation.navigate('JoinRoom'))}
          >
            <LogIn size={18} color="#fff" />
            <Text style={s.btnText}>Join Room</Text>
          </TouchableOpacity>
        </View>

        {toastMessage && (
          <View style={s.toast}>
            <Text style={s.toastText}>{toastMessage}</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

export default MultiplayerScreen;

const s = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#9098a8',
    fontWeight: '600',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d3d3f1',
  },

  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#182992',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingAsName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playingAsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '500',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#eef1f7',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#182992',
  },
  searchResultsBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef1f7',
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef1f7',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#182992',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9098a8',
  },
  tabTextActive: {
    color: '#fff',
  },

  listBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eef1f7',
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
    color: '#9098a8',
    fontWeight: '600',
  },
  playerRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#182992',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#182992',
    fontSize: 12,
    fontWeight: '700',
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F4F0',
    borderRadius: 14,
    padding: 10,
  },
  playerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#182992',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#182992',
    flexShrink: 1,
  },
  inviteBtn: {
    backgroundColor: '#182992',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  input: {
    backgroundColor: '#fff',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#eef1f7',
    marginBottom: 14,
    color: '#182992',
  },

  btnGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
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
    borderColor: '#F5F4F0',
  },
  dotOnline: { backgroundColor: '#28C76F' },
  dotOffline: { backgroundColor: '#9098a8' },
});