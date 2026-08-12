
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet, Modal,
  BackHandler
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useGameLogic } from '../GameLogicContext';
import {
  Trophy,
  Mail,
  Users,
  Globe,
  Shuffle,
  History,
  DoorOpen,
  LogOut,
} from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';
import GradientCard from '../../components/GradientCard/GradientCard';
import SectionTitle from '../../components/SectionTitle/SectionTitle';

type Props = { navigation: NativeStackNavigationProp<any> };

// A 10-second banner shown for both a new game invite AND a friend request
function InviteToast({
  invitations,
  friendRequests,
  navigation,
}: {
  invitations: { from: string; status: string; fromAvatarId: string | null }[];
  friendRequests: { from: string; status: string; fromAvatarId: string | null }[];
  navigation: NativeStackNavigationProp<any>;
}) {
  const {
    acceptInvitation,
    rejectInvitation,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useGameLogic();

 // Push the toast below the status bar/notch on every device

  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [toastType, setToastType] = useState<'invite' | 'friend' | null>(null);
  const [activeFrom, setActiveFrom] = useState<string | null>(null);
  const [prevInviteCount, setPrevInviteCount] = useState(invitations.length);
  const [prevFriendCount, setPrevFriendCount] = useState(friendRequests.length);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startAutoDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 10000);
  };

  useEffect(() => {
    if (invitations.length > prevInviteCount) {
      const newest = invitations[invitations.length - 1];
      setMessage(`${newest.from} invited you to play!`);
      setToastType('invite');
      setActiveFrom(newest.from);
      setVisible(true);
      startAutoDismiss();
    } else if (friendRequests.length > prevFriendCount) {
      const newest = friendRequests[friendRequests.length - 1];
      setMessage(`${newest.from} sent you a friend request!`);
      setToastType('friend');
      setActiveFrom(newest.from);
      setVisible(true);
      startAutoDismiss();
    }

    setPrevInviteCount(invitations.length);
    setPrevFriendCount(friendRequests.length);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [invitations.length, friendRequests.length]);

  if (!visible || !activeFrom) return null;

  const handleViewMore = () => {
    setVisible(false);
    if (toastType === 'friend') {
      // NOTE: adjust the route/params below if friend requests live on a
      // different screen or tab than game invites in your app.
      navigation.navigate('Invitation', { initialTab: 'requests' });
    } else {
      navigation.navigate('Invitation', { initialTab: 'invites' });
    }
  };

  const handleAccept = () => {
    if (toastType === 'friend') {
      acceptFriendRequest(activeFrom);
    } else {
      acceptInvitation(activeFrom);
    }
    setVisible(false);
  };

  const handleDecline = () => {
    if (toastType === 'friend') {
      rejectFriendRequest(activeFrom);
    } else {
      rejectInvitation(activeFrom);
    }
    setVisible(false);
  };

  return (
    <TouchableOpacity
      
      style={[s.inviteToast, { top: insets.top + 12 }]}
      onPress={handleViewMore}
      activeOpacity={0.9}
    >
      <Text style={s.inviteToastText}>{message}</Text>
      <View style={s.inviteToastBtnRow}>
        <TouchableOpacity
          style={[s.inviteToastBtn, s.inviteToastBtnDecline]}
          onPress={(e) => {
            e.stopPropagation?.();
            handleDecline();
          }}
        >
          <Text style={s.inviteToastBtnDeclineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.inviteToastBtn, s.inviteToastBtnAccept]}
          onPress={(e) => {
            e.stopPropagation?.();
            handleAccept();
          }}
        >
          <Text style={s.inviteToastBtnAcceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const ModeScreen = ({ navigation }: Props) => {
  const { user, userProfile } = useAuth();
  const { myName, setMyName, findRandomMatch, incomingInvitations, incomingFriendRequests } = useGameLogic();
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const displayName =
    userProfile?.name ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Guest';
  const photoURL = userProfile?.photoURL || user?.photoURL || null;
  React.useEffect(() => {
    if (!myName) {
      if (userProfile?.username) {
        setMyName(userProfile.username);
      } else if (userProfile?.name) {
        setMyName(userProfile.name);
      }
    }
  }, [userProfile]);
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );
  const notificationCount = incomingInvitations.length + incomingFriendRequests.length;
  const handleRandomMatch = () => {
    if (!myName) {
      return;
    }
    navigation.navigate('RandomMatch');
    findRandomMatch();
  };
  return (
   <Layout
      header={{
        type: 'home',
        title: 'आलु प्लस',
        onAvatarPress: () => navigation.navigate('Profile'),
        avatarName: displayName,
        avatarPhotoURL: photoURL,
        avatarId: userProfile?.avatarId,
        notificationCount,
      }}
    >
      <InviteToast
        invitations={incomingInvitations}
        friendRequests={incomingFriendRequests}
        navigation={navigation}
      />

      {/* Player card: greeting + stats grouped in one glass panel */}
      <View style={s.playerCard}>
        <Text style={s.greetingLabel}>Welcome back,</Text>
        <Text style={s.greetingName} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={s.statsRow}>
          <View style={s.statCol}>
            <Text style={[s.statValue, { color: '#5FD68F' }]}>
              {userProfile?.wins ?? 0}
            </Text>
            <Text style={s.statLabel}>Wins</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCol}>
            <Text style={[s.statValue, { color: '#F19191' }]}>
              {userProfile?.losses ?? 0}
            </Text>
            <Text style={s.statLabel}>Losses</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCol}>
            <Text style={[s.statValue, { color: '#F2C879' }]}>
              {userProfile?.draw ?? 0}
            </Text>
            <Text style={s.statLabel}>Draws</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard + Invitation + Match History + Room List */}
      <View style={s.quickGrid}>
        <TouchableOpacity
          style={s.quickTile}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <View style={[s.quickIconWrap, { backgroundColor: 'rgba(242,200,121,0.18)' }]}>
            <Trophy size={24} color="#F2C879" />
          </View>
          <Text style={s.quickTileText} numberOfLines={1}>
            Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickTile}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Invitation')}
        >
          <View>
            <View style={[s.quickIconWrap, { backgroundColor: 'rgba(159,195,245,0.18)' }]}>
              <Mail size={24} color="#9FC3F5" />
            </View>
            {notificationCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={s.quickTileText} numberOfLines={1}>
            Invitation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickTile}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MatchHistory')}
        >
          <View style={[s.quickIconWrap, { backgroundColor: 'rgba(241,145,145,0.18)' }]}>
            <History size={24} color="#F19191" />
          </View>
          <Text style={s.quickTileText} numberOfLines={1}>
            Match History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickTile}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RoomList')}
        >
          <View style={[s.quickIconWrap, { backgroundColor: 'rgba(127,217,166,0.18)' }]}>
            <DoorOpen size={24} color="#7FD9A6" />
          </View>
          <Text style={s.quickTileText} numberOfLines={1}>
            Room List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Choose how you want to play */}
      <SectionTitle title="Choose how you want to play" />

      {/* Mode tiles — one hero card + two paired cards */}
      <TouchableOpacity
        style={s.heroTouchable}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('Multiplayer')}
      >
        <GradientCard
          colors={['#2A5FCB', '#0F1E63']}
          borderRadius={22}
          style={s.heroTile}
        >
          <View style={s.heroIconWrap}>
            <Globe size={26} color="#FFFFFF" />
          </View>
          <Text style={s.tileTitle}>Play with Friends</Text>
          <Text style={s.tileSubtitle}>Online — invite or join a room</Text>
        </GradientCard>
      </TouchableOpacity>

      <View style={s.tileRow}>
        <TouchableOpacity
          style={s.tileHalf}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Game')}
        >
          <GradientCard
            colors={['#E15C74', '#8B1029']}
            borderRadius={20}
            style={s.smallTile}
          >
            <Users size={24} color="#FFFFFF" />
            <Text style={s.tileTitleSmall} numberOfLines={1}>2 Player</Text>
            <Text style={s.tileSubtitleSmall} numberOfLines={2}>Take turns, same device</Text>
          </GradientCard>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.tileHalf}
          activeOpacity={0.88}
          onPress={handleRandomMatch}
        >
          <GradientCard
            colors={['#F0AE49', '#B9741E']}
            borderRadius={20}
            style={s.smallTile}
          >
            <Shuffle size={24} color="#FFFFFF" />
            <Text style={s.tileTitleSmall} numberOfLines={1}>Random Match</Text>
            <Text style={s.tileSubtitleSmall} numberOfLines={2}>Play a stranger</Text>
          </GradientCard>
        </TouchableOpacity>
      </View>
      {/* Exit Confirmation Modal */}
      <Modal
        visible={exitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconCircle}>
              <LogOut size={26} color="#B31B34" />
            </View>
            <Text style={s.modalTitle}>Leave आलु प्लस?</Text>
            <Text style={s.modalSubtitle}>
              You'll exit the app. Any ongoing match progress may be lost.
            </Text>
            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnGhost]}
                onPress={() => setExitModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnGhostText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnDanger]}
                onPress={() => BackHandler.exitApp()}
                activeOpacity={0.8}
              >
                <Text style={s.modalBtnDangerText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
   </Layout>
  );
};
export default ModeScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  playerCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  greetingLabel: {
    fontSize: 12,
    color: 'rgba(245,240,224,0.75)',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 18,
    color: '#FFF6E8',
    fontWeight: '800',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(245,240,224,0.65)',
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 28,
  },
  quickTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTileText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(245,240,224,0.92)',
  },
  heroTouchable: {
    width: '100%',
  },
  heroTile: {
    width: '100%',
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 19,
  },
  tileSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tileHalf: {
    flex: 1,
  },
  smallTile: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    height: 132,
    justifyContent: 'center',
  },
  tileTitleSmall: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    marginTop: 10,
  },
  tileSubtitleSmall: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  notifBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#12194A',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  inviteToast: {
    // NOTE: `top` is no longer set here — it's applied inline per-instance
    // as insets.top + 12 so the toast clears the status bar / notch on
    // every device, whether or not the screen has its own header.
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#7A1128',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.4)',
  },
  inviteToastText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  inviteToastBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  inviteToastBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  inviteToastBtnAccept: {
    backgroundColor: '#E0972A',
  },
  inviteToastBtnAcceptText: {
    color: '#3A2A1E',
    fontWeight: '700',
    fontSize: 13,
  },
  inviteToastBtnDecline: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  inviteToastBtnDeclineText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(50,20,20,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(179,27,52,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3A2A1E',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8A7A6A',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',  
  },
  modalBtnGhost: {
    backgroundColor: 'rgba(0,56,147,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,56,147,0.25)',
  },
  modalBtnGhostText: {
    color: '#003893',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBtnDanger: {
    backgroundColor: '#B31B34',
  },
  modalBtnDangerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});