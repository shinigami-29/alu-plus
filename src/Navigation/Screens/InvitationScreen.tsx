import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import {
  ArrowLeft,
  Check,
  X,
  Mail,
  MailOpen,
  UserPlus,
} from 'lucide-react-native';
import { getAvatarSource } from '../../avatar/Avatar';

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
  } = useGameLogic();

  const [activeTab, setActiveTab] = useState<Tab>('invites');

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

  const totalCount = incomingInvitations.length + incomingFriendRequests.length;

  // avatarId bhaye avatar image, natra photo, natra first-letter circle
  const renderAvatar = (
    name: string,
    avatarId?: string | null,
    photo?: string | null,
  ) => {
    const avatarSource = getAvatarSource(avatarId);
    if (avatarSource) {
      return <Image source={avatarSource} style={s.avatarImage} />;
    }
    if (photo) {
      return <Image source={{ uri: photo }} style={s.avatarImage} />;
    }
    return (
      <View style={s.avatar}>
        <Text style={s.avatarText}>{name?.[0]?.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.container}
      resizeMode="cover"
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#182992" />
          </TouchableOpacity>
          <View style={s.titleRow}>
            <Mail size={19} color="#bdc3f4" />
            <Text style={s.title}>Invitations</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

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
                  renderItem={({ item }) => (
                    <View style={s.playerCard}>
                      {renderAvatar(
                        item.from,
                        item.fromAvatarId,
                        item.fromPhoto,
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.playerName} numberOfLines={1}>
                          {item.from}
                        </Text>
                        <Text style={s.inviteSubtext}>
                          wants to play with you
                        </Text>
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
                  )}
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
                    {renderAvatar(item.from, item.fromAvatarId, item.fromPhoto)}
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
    </ImageBackground>
  );
};

export default InvitationScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#cbd8f4'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eef1f7',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cdcdf9',
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
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
  tabBtnActive: { backgroundColor: '#182992' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#9098a8' },
  tabTextActive: { color: '#fff' },

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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eef1f7',
  },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#cdcdf9' },
  emptySubText: {
    fontSize: 13,
    color: '#9098a8',
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#182992',
    marginBottom: 12,
  },
  goBtn: {
    backgroundColor: '#182992',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  goBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },

  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef1f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#182992',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#182992',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  playerName: { fontSize: 15, fontWeight: '700', color: '#182992' },
  inviteSubtext: { fontSize: 12, color: '#9098a8', marginTop: 2 },

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
