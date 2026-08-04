import {
  View,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import React from 'react';
import { IMAGES } from '../../constant';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  withScroll?: boolean;
};

const Layout = ({ children, withScroll = true }: Props) => {
  const insets = useSafeAreaInsets();
  const Content = withScroll ? ScrollView : View;
  const contentProps = withScroll
    ? {
        contentContainerStyle: styles.scroll,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: styles.plainContent };
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <ImageBackground
        source={IMAGES.background}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <View style={styles.overlays} />
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={[styles.main, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* <ScrollView
                contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={withScroll}
            >
              {children}
            </ScrollView> */}
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  plainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default Layout;
