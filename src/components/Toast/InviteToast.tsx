import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../../Navigation/GameLogicContext';

type Invitation = {
  from: string;
  status: string;
  fromAvatarId: string | null;
  timestamp?: number;
};

type Props = {
  invitations: Invitation[];
  friendRequests: Invitation[];
  navigation: NativeStackNavigationProp<any>;
};

const InviteToast = ({ invitations, friendRequests, navigation }: Props) => {
  const {
    acceptInvitation,
    rejectInvitation,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useGameLogic();

  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [toastType, setToastType] = useState<'invite' | 'friend' | null>(null);
  const [activeFrom, setActiveFrom] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // हरेक "from" को पछिल्लो देखिसकेको timestamp — यसैबाट थाहा हुन्छ नयाँ हो कि पुरानै
  const seenInviteRef = useRef<Map<string, number>>(new Map());
  const seenFriendRef = useRef<Map<string, number>>(new Map());
  const isFirstRun = useRef(true);

  const startAutoDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 10000);
  };

  useEffect(() => {
    // पहिलो mount मा जे pending invitations/requests छन्, तिनलाई "seen" मानेर
    // toast नदेखाउने (app खोल्दा पुरानै invite को लागि toast नआओस्)
    if (isFirstRun.current) {
      isFirstRun.current = false;
      invitations.forEach(inv =>
        seenInviteRef.current.set(inv.from, inv.timestamp ?? 0),
      );
      friendRequests.forEach(req =>
        seenFriendRef.current.set(req.from, req.timestamp ?? 0),
      );
      return;
    }

    // ---- Invitations: कुनै भी entry को timestamp पहिले भन्दा नयाँ छ भने "नयाँ invite" ----
    const currentInviteFroms = new Set(invitations.map(i => i.from));
    seenInviteRef.current.forEach((_, from) => {
      if (!currentInviteFroms.has(from)) seenInviteRef.current.delete(from);
    });

    let newestNewInvite: Invitation | null = null;
    invitations.forEach(inv => {
      const ts = inv.timestamp ?? 0;
      const seenTs = seenInviteRef.current.get(inv.from);
      const isNew = seenTs === undefined || ts > seenTs;
      if (
        isNew &&
        (!newestNewInvite || ts >= (newestNewInvite.timestamp ?? 0))
      ) {
        newestNewInvite = inv;
      }
    });

    invitations.forEach(inv =>
      seenInviteRef.current.set(inv.from, inv.timestamp ?? 0),
    );

    if (newestNewInvite) {
      const inv = newestNewInvite as Invitation;
      setMessage(`${inv.from} invited you to play!`);
      setToastType('invite');
      setActiveFrom(inv.from);
      setVisible(true);
      startAutoDismiss();
      return;
    }

    // ---- Friend requests: उस्तै logic ----
    const currentFriendFroms = new Set(friendRequests.map(i => i.from));
    seenFriendRef.current.forEach((_, from) => {
      if (!currentFriendFroms.has(from)) seenFriendRef.current.delete(from);
    });

    let newestNewFriend: Invitation | null = null;
    friendRequests.forEach(req => {
      const ts = req.timestamp ?? 0;
      const seenTs = seenFriendRef.current.get(req.from);
      const isNew = seenTs === undefined || ts > seenTs;
      if (
        isNew &&
        (!newestNewFriend || ts >= (newestNewFriend.timestamp ?? 0))
      ) {
        newestNewFriend = req;
      }
    });

    friendRequests.forEach(req =>
      seenFriendRef.current.set(req.from, req.timestamp ?? 0),
    );

    if (newestNewFriend) {
      const req = newestNewFriend as Invitation;
      setMessage(`${req.from} sent you a friend request!`);
      setToastType('friend');
      setActiveFrom(req.from);
      setVisible(true);
      startAutoDismiss();
    }
  }, [invitations, friendRequests]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible || !activeFrom) return null;

  const handleViewMore = () => {
    setVisible(false);
    if (toastType === 'friend') {
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
          onPress={e => {
            e.stopPropagation?.();
            handleDecline();
          }}
        >
          <Text style={s.inviteToastBtnDeclineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.inviteToastBtn, s.inviteToastBtnAccept]}
          onPress={e => {
            e.stopPropagation?.();
            handleAccept();
          }}
        >
          <Text style={s.inviteToastBtnAcceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  inviteToast: {
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
});

export default InviteToast;
