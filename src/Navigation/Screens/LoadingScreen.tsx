import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Layout from '../../components/AppLayout/Layout';

type Props = { navigation: NativeStackNavigationProp<any> };

const { width } = Dimensions.get('window');

const LoadingScreen = ({ navigation }: Props) => {
  const [percent, setPercent] = useState(0);
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.85)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listenerId = loadingWidth.addListener(({ value }) => {
      setPercent(Math.round((value / (width * 0.7)) * 100));
    });

    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),  
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(loadingWidth, {
        toValue: width * 0.7,
        duration: 1800,
        useNativeDriver: false,
      }).start(() => {
        navigation.replace('Mode');
      });
    });

    return () => {
      loadingWidth.removeListener(listenerId);
    };
  }, []);

  return (
    <Layout>
      <View style={s.container}>
        <View style={s.contentWrap}>
          <View style={s.titleWrap}>
            <Animated.Text
              style={[
                s.title,
                { opacity: titleOpacity, transform: [{ scale: titleScale }] },
              ]}
            >
              आलु प्लस
            </Animated.Text>

            <Animated.Text style={[s.subtitle, { opacity: titleOpacity }]}>
              The Classic Game
            </Animated.Text>
          </View>

          <Animated.Image
            source={require('../../images/tik.png')}
            style={[s.tikImage, { opacity: titleOpacity }]}
            resizeMode="contain"
          />
        </View>

        {/* Loading bar */}
        <View style={s.loadingWrap}>
          <View style={s.loadingContainer}>
            <Animated.View style={[s.loadingBar, { width: loadingWidth }]} />
          </View>
          <Animated.Text style={[s.loadingLabel, { opacity: titleOpacity }]}>
            {percent}%
          </Animated.Text>
        </View>
      </View>
    </Layout>
  );
};

export default LoadingScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#cdcdf9',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#EAEAEA',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tikImage: {
    width: width * 0.85,
    height: width * 0.85,
    maxWidth: 350,
    maxHeight: 350,
  },
  loadingWrap: {
    width: '100%',
    alignItems: 'center',
  },
  loadingContainer: {
    width: width * 0.7,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loadingBar: {
    height: 10,
    backgroundColor: '#FFC857',
    borderRadius: 10,
    shadowColor: '#FFC857',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});