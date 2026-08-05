// for btn in modescreen down btn
import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

let uid = 0;

type Props = {
  colors: [string, string]; 
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const GradientCard = ({ colors, borderRadius = 20, style, children }: Props) => {
  const idRef = useRef<string | null>(null);
  idRef.current ??= `gradient-card-${uid++}`;
  const id = idRef.current;

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        { borderRadius, overflow: 'hidden', backgroundColor: colors[0] },
        style,
      ]}
    >
      {size && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors[0]} />
              <Stop offset="1" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            rx={borderRadius}
            ry={borderRadius}
            fill={`url(#${id})`}
          />
        </Svg>
      )}
      {children}
    </View>
  );
};

export default GradientCard;
