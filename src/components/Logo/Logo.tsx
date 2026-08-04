import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';
import { IMAGES } from '../../constant';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const Logo = ({ size = 64, style }: Props) => (
  <Image
    source={IMAGES.logo}
    resizeMode="contain"
    style={[{ width: size, height: size }, styles.image, style]}
  />
);

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});

export default Logo;
