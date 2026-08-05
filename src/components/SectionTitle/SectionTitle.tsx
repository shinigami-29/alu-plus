// for choose how you want 
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Gamepad2 } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const LINE_HEIGHT = 2;
const MAX_LINE_WIDTH = 46;

type Props = {
  title: string;
};

const FadeLine = ({ direction }: { direction: 'in' | 'out' }) => {
  const id = `section-line-${direction}`;
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={s.lineWrap} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={LINE_HEIGHT}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <Stop
                offset={0}
                stopColor={COLORS.gold}
                stopOpacity={direction === 'in' ? 0 : 0.9}
              />
              <Stop
                offset={1}
                stopColor={COLORS.gold}
                stopOpacity={direction === 'in' ? 0.9 : 0}
              />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={LINE_HEIGHT} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
};

const SectionTitle = ({ title }: Props) => {
  return (
    <View style={s.row}>
      <FadeLine direction="in" />
      <Gamepad2 size={13} color={COLORS.gold} style={s.icon} />
      <Text style={s.title} numberOfLines={1}>
        {title}
      </Text>
      <Gamepad2 size={13} color={COLORS.gold} style={s.icon} />
      <FadeLine direction="out" />
    </View>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  lineWrap: {
    flex: 1,
    maxWidth: MAX_LINE_WIDTH,
    height: LINE_HEIGHT,
  },
  icon: {
    opacity: 0.9,
  },
  title: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textOnDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default SectionTitle;
