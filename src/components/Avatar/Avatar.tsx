import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getAvatarSource } from '../../avatar/Avatar';
import { COLORS } from '../../theme/colors';

type Props = {
  name?: string | null;
  photoURL?: string | null;
  avatarId?: string | null;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

const getInitials = (name?: string | null) => {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? '?';
  return (words[0][0] + words[1][0]).toUpperCase();
};

const Avatar = ({
  name,
  photoURL,
  avatarId,
  size = 40,
  ring = false,
  ringColor = COLORS.gold,
  backgroundColor = COLORS.navy,
  style,
}: Props) => {
  const presetSource = getAvatarSource(avatarId);
  const source = presetSource ?? (photoURL ? { uri: photoURL } : null);

  const containerStyle: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor,
    },
    ring && {
      borderWidth: 2,
      borderColor: ringColor,
    },
    style,
  ];

  if (source) {
    return (
      <View style={containerStyle}>
        <Image source={source} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default Avatar;
