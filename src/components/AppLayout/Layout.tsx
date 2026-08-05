// for whole scrren 
import {
  View,
  ImageBackground,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import React, { useState } from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { IMAGES } from '../../constant';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ScreenHeader, HomeHeader, AuthHeader } from '../headers';

type HeaderConfig =
  | {
      type: 'screen';
      title: string;
      onBack?: () => void;
      rightIcon?: React.ReactNode;
      onRightPress?: () => void;
    }
  | {
      type: 'home';
      title: string;
      onAvatarPress: () => void;
      avatarName?: string | null;
      avatarPhotoURL?: string | null;
      avatarId?: string | null;
      notificationCount?: number;
    }
  | {
      type: 'auth';
      appName: string;
      title: string;
      subtitle: string;
    };

type Props = {
  children: React.ReactNode;
  withScroll?: boolean;
  header?: HeaderConfig;
};

const renderHeader = (header: HeaderConfig) => {
  switch (header.type) {
    case 'screen':
      return <ScreenHeader {...header} />;
    case 'home':
      return <HomeHeader {...header} />;
    case 'auth':
      return <AuthHeader {...header} />;
  }
};

const DEFAULT_HEADER_HEIGHT = 60;

const Layout = ({ children, withScroll = true, header }: Props) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  };

  const headerBottom = insets.top + headerHeight;
  const boostFade = Math.min(0.95, (headerBottom * 1.15) / screenHeight);

  const Content = withScroll ? ScrollView : View;
  const contentProps = withScroll
    ? {
        contentContainerStyle: [
          styles.scroll,
          { paddingBottom: insets.bottom },
        ],
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: styles.plainContent };
  return (
    <SafeAreaView edges={[]} style={{ flex: 1 }}>
      <ImageBackground
        source={IMAGES.background}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <Svg height="100%" width="100%" style={styles.overlays}>
          <Defs>
            <LinearGradient id="bgOverlay" x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor="#05081A" stopOpacity={0.82} />
              <Stop offset={0.35} stopColor="#12194A" stopOpacity={0.6} />
              <Stop offset={0.7} stopColor="#12194A" stopOpacity={0.38} />
              <Stop offset={1} stopColor="#12194A" stopOpacity={0.25} />
            </LinearGradient>
            <LinearGradient id="headerBoost" x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} stopColor="#000000" stopOpacity={0.32} />
              <Stop offset={boostFade} stopColor="#000000" stopOpacity={0} />
              <Stop offset={1} stopColor="#000000" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgOverlay)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerBoost)" />
        </Svg>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={[styles.main, { paddingTop: insets.top }]}>
          {header && (
            <View style={styles.header} onLayout={onHeaderLayout}>
              {renderHeader(header)}
            </View>
          )}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Content {...contentProps}>{children}</Content>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  overlays: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  plainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default Layout;
