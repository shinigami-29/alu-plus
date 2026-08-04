import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const SLOT_SIZE = 40;

type Props = {
  title: string;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
};

const ScreenHeader = ({ title, onBack, rightIcon, onRightPress }: Props) => {
  return (
    <View style={s.container}>
      {onBack ? (
        <TouchableOpacity style={s.iconBtn} onPress={onBack} hitSlop={8}>
          <ArrowLeft size={20} color={COLORS.textOnDark} />
        </TouchableOpacity>
      ) : (
        <View style={s.slot} />
      )}

      <View style={s.titleRow}>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightIcon ? (
        <TouchableOpacity style={s.iconBtn} onPress={onRightPress} hitSlop={8}>
          {rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={s.slot} />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
  },
  iconBtn: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textOnDark,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default ScreenHeader;
