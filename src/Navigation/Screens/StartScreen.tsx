import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../context/AuthContext';

type Props = {navigation: NativeStackNavigationProp<any>};                      

const {width} = Dimensions.get('window');
   
const StartScreen = ({navigation}: Props) => {
  const {user, loading} = useAuth();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.85)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
        duration: 3000,
        useNativeDriver: false,
      }).start(() => {
        if (loading) return;

        if (user) {
          navigation.replace('Mode');
        } else {
          navigation.replace('Login');
        }
      });
    });
  }, [loading]);

  return (
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.container}
      resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="#F5F4F0" />

      <View style={s.titleWrap}>
        <Animated.Text
          style={[
            s.title,
            {opacity: titleOpacity, transform: [{scale: titleScale}]},
          ]}>
          आलु प्लस
        </Animated.Text>

        <Animated.Text style={[s.subtitle, {opacity: titleOpacity}]}>
          The Classic Game
        </Animated.Text>
      </View>

      <Animated.Image
        source={require('../../images/tik.png')}
        style={[s.tikImage, {opacity: titleOpacity}]}
        resizeMode="contain"
      />

      {/* Loading bar */}
      <View style={s.loadingWrap}>
        <View style={s.loadingContainer}>
          <Animated.View style={[s.loadingBar, {width: loadingWidth}]} />
        </View>
        <Animated.Text style={[s.loadingLabel, {opacity: titleOpacity}]}>
          Loading...
        </Animated.Text>
      </View>
    </ImageBackground>
  );
};

export default StartScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F4F0',
  },
  titleWrap: {
    position: 'absolute',
    top: 140,
    alignItems: 'center',
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#cdcdf9',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#EAEAEA',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  tikImage: {
    position: 'absolute',
    top: 220,
    width: 350,
    height: 350,
  },
  loadingWrap: {
    position: 'absolute',
    bottom: 110,
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
    shadowOffset: {width: 0, height: 0},
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
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
});