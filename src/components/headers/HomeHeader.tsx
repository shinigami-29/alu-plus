import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Logo from '../Logo/Logo';
import Avatar from '../Avatar/Avatar';
import { COLORS } from '../../theme/colors';

const AVATAR_SIZE = 46;

type Props = {
  title: string;
  onAvatarPress: () => void;
  avatarName?: string | null;
  avatarPhotoURL?: string | null;
  avatarId?: string | null;
  notificationCount?: number;
};

const HomeHeader = ({
  title,
  onAvatarPress,
  avatarName,
  avatarPhotoURL,
  avatarId,
  notificationCount = 0,
}: Props) => {
  return (
    <View style={s.container}>
      <View style={s.brandRow}>
        <View style={s.logoChip}>
          <Logo size={36} />
        </View>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <TouchableOpacity style={s.avatarBtn} onPress={onAvatarPress} activeOpacity={0.85}>
        <Avatar
          name={avatarName}
          photoURL={avatarPhotoURL}
          avatarId={avatarId}
          size={AVATAR_SIZE - 6}
        />
        {notificationCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  logoChip: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(150,20,40,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  avatarBtn: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HomeHeader;
