
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Modal,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useGameLogic } from '../GameLogicContext';
import { getAvatarSource } from '../../avatar/Avatar';
import {
  Trophy,
  Mail,
  Users,
  Globe,
  ChevronRight,
  Shuffle,
  History,
  DoorOpen,
  LogOut,
} from 'lucide-react-native';
import Layout from '../../components/AppLayout/Layout';

type Props = { navigation: NativeStackNavigationProp<any> };

// Naya invite VA friend request duibai ko lagi 10 sec ko banner
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

  // FIX: phone ma header/nav bar nabhako screen haru ma toast seedhai
  // status bar / notch mathi ghusdo thiyo. insets.top thapera tesle
  // safe area (status bar/notch) tala matra deखिne, jasari header
  // bhako screen ma dekhincha ustai.
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
  const avatarSource = getAvatarSource(userProfile?.avatarId);
  const photoURL = userProfile?.photoURL || user?.photoURL || null;
  const AvatarComponent = () => {
    if (avatarSource) {
      return <Image source={avatarSource} style={s.avatarImage} />;
    }
    if (photoURL) {
      return <Image source={{ uri: photoURL }} style={s.avatarImage} />;
    }
    return (
      <View style={s.avatarCircle}>
        <Text style={s.avatarLetter}>
          {displayName?.[0]?.toUpperCase() ?? 'G'}
        </Text>
      </View>
    );
  };
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
   <Layout>
      <InviteToast
        invitations={incomingInvitations}
        friendRequests={incomingFriendRequests}
        navigation={navigation}
      />
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <AvatarComponent />
        </TouchableOpacity>
      </View>
      {/* Title */}
      <View style={s.titleWrap}>
        <Text style={s.title}>आलु प्लस</Text>
        <View style={s.titleUnderline} />
      </View>
      {/* Leaderboard + Invitation + Match History + Room List */}
      <View style={s.quickRow}>
        <TouchableOpacity
        activeOpacity={0.8}
          style={s.quickBtn}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <View style={[s.quickIconWrap, { backgroundColor: 'rgba(255,178,29,0.22)' }]}>
            <Trophy size={24} color="#E0972A" />
          </View>
          <Text style={s.quickBtnText} numberOfLines={1}>
            Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Invitation')}
        >
          <View style={{ position: 'relative' }}>
            <View style={[s.quickIconWrap, { backgroundColor: 'rgba(0,56,147,0.16)' }]}>
              <Mail size={24} color="#003893" />
            </View>
            {notificationCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={s.quickBtnText} numberOfLines={1}>
            Invitation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MatchHistory')}
        >
          <View style={[s.quickIconWrap, { backgroundColor: 'rgba(220,20,60,0.14)' }]}>
            <History size={24} color="#B31B34" />
          </View>
          <Text style={s.quickBtnText} numberOfLines={1}>
            Match History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RoomList')}
        >
          <View style={[s.quickIconWrap, { backgroundColor: 'rgba(35, 255, 94, 0.16)' }]}>
            <DoorOpen size={24} color='#1f8552' />
          </View>
          <Text style={s.quickBtnText} numberOfLines={1}>
            Room List
          </Text>
        </TouchableOpacity>
      </View>
      {/* Choose how you want to play */}
      <Text style={s.chooseText}>Choose how you want to play</Text>
      {/* Mode buttons */}
      <View style={s.center}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => navigation.navigate('Game')}
          activeOpacity={0.8}
        >
          <View style={[s.accentBar, { backgroundColor: '#DC143C' }]} />
          <View style={[s.btnIconCircle, { backgroundColor: 'rgba(220,20,60,0.14)' }]}>
            <Users size={22} color="#B31B34" />
          </View>
          <View style={s.btnTextWrap}>
            <Text style={s.btnText}>2 Player</Text>
            <Text style={s.btnSubText}>Play locally, take turns</Text>
          </View>
          <ChevronRight size={20} color="#B31B34" />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.btn}
          onPress={() => navigation.navigate('Multiplayer')}
          activeOpacity={0.8}
        >
          <View style={[s.accentBar, { backgroundColor: '#003893' }]} />
          <View style={[s.btnIconCircle, { backgroundColor: 'rgba(0,56,147,0.14)' }]}>
            <Globe size={22} color="#003893" />
          </View>
          <View style={s.btnTextWrap}>
            <Text style={s.btnText}>Play with Friends</Text>
            <Text style={s.btnSubText}>Online, invite or join</Text>
          </View>
          <ChevronRight size={20} color="#003893" />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.btn}
          onPress={handleRandomMatch}
          activeOpacity={0.8}
        >
          <View style={[s.accentBar, { backgroundColor: '#E0972A' }]} />
          <View style={[s.btnIconCircle, { backgroundColor: 'rgba(224,151,42,0.16)' }]}>
            <Shuffle size={22} color="#C97F1E" />
          </View>
          <View style={s.btnTextWrap}>
            <Text style={s.btnText}>Random Match</Text>
            <Text style={s.btnSubText}>Play with a stranger</Text>
          </View>
          <ChevronRight size={20} color="#C97F1E" />
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0972A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B31B34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleWrap: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    // color: '#FFF6E8',
    color: '#E0972A',
    letterSpacing: 1,
    textShadowColor: 'rgba(150,20,40,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleUnderline: {
    marginTop: 8,
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0972A',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
    rowGap: 12,
  },
  quickBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,251,244,0.88)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A2A1E',
    flexShrink: 1,
  },
  center: {
    flex: 1,
  justifyContent: 'flex-start',
  gap: 14,
  paddingTop: 10,
  paddingBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 14,
    backgroundColor: 'rgba(255,251,244,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(224,151,42,0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 5,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
  },
  btnIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginHorizontal: 8,
  },
  btnTextWrap: {
    flex: 1,
  },
  btnText: {
    color: '#3A2A1E',
    fontWeight: '700',
    fontSize: 16,
  },
  btnSubText: {
    color: '#8A7A6A',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  chooseText: {
    fontSize: 13,
    color: '#FFF3DD',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 70,
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
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