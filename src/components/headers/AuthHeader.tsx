// for login page 
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Logo from '../Logo/Logo';
import { COLORS } from '../../theme/colors';

type Props = {
  appName: string;
  title: string;
  subtitle: string;
};

const AuthHeader = ({ appName, title, subtitle }: Props) => {
  return (
    <View style={s.container}>
      <Logo size={56} style={s.logo} />
      <Text style={s.appName}>{appName}</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    marginBottom: 10,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textOnDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textOnDarkMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AuthHeader;
