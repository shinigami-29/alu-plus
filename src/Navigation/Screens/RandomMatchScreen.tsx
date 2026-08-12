
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/AppLayout/Layout';
import Avatar from '../../components/Avatar/Avatar';
import { COLORS } from '../../theme/colors';

type Props = { navigation: NativeStackNavigationProp<any> };

const RandomMatchScreen = ({ navigation }: Props) => {
  const {
    screen,
    cancelRandomMatch,
    randomMatchStatus,
    opponentName,
    opponentPhoto,
    opponentAvatarId,
  } = useGameLogic();
  const { user, userProfile } = useAuth();

  const found = randomMatchStatus === 'found';

  const displayName =
    userProfile?.username ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'You';
  const photoURL = userProfile?.photoURL || user?.photoURL || null;

  // Dots animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Question mark pulse
  const pulse = useRef(new Animated.Value(1)).current;

  // Opponent found bounce-in
  const foundScale = useRef(new Animated.Value(0.6)).current;

  const dotLoops = useRef<Animated.CompositeAnimation[]>([]);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Dots bouncing animation
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      );
    };

    // Question mark pulse
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    const d1 = animateDot(dot1, 0);
    const d2 = animateDot(dot2, 200);
    const d3 = animateDot(dot3, 400);

    dotLoops.current = [d1, d2, d3];
    pulseLoop.current = pulseAnim;

    d1.start();
    d2.start();
    d3.start();
    pulseAnim.start();

    return () => {
      d1.stop();
      d2.stop();
      d3.stop();
      pulseAnim.stop();
    };
  }, []);
  
 // When an opponent is found: stop the searching animations and
  // bounce-in the "found" box
  useEffect(() => {
    if (found) {
      dotLoops.current.forEach(loop => loop.stop());
      pulseLoop.current?.stop();

      Animated.spring(foundScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [found]);

  useEffect(() => {
    if (screen === 'multiplayerGame') {
      navigation.replace('MultiplayerGame');
    }
  }, [screen]);

  const handleCancel = () => {
    cancelRandomMatch();
    navigation.goBack();
  };

  return (
   <Layout>
    <View style={s.container}>
      <Text style={s.title}>
        {found ? 'Opponent Found!' : 'Finding Opponent'}
      </Text>
      <Text style={s.subtitle}>
        {found
          ? `Get ready — you're up against ${opponentName || 'your opponent'}`
          : 'Searching for someone to play with you...'}
      </Text>

      {/* Player boxes */}
      <View style={s.playersRow}>
        {/* My box */}
        <View style={s.playerBox}>
          <Avatar
            name={displayName}
            photoURL={photoURL}
            avatarId={userProfile?.avatarId}
            size={64}
            backgroundColor="#189292"
            style={{ marginBottom: 10 }}
          />
          <Text style={s.playerName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={s.readyBadge}>
            <Text style={s.readyText}>Ready</Text>
          </View>
        </View>

        {/* VS + dots/checkmark */}
        <View style={s.vsSection}>
          <Text style={s.vsText}>VS</Text>
          {!found && (
            <View style={s.dotsRow}>
              <Animated.View
                style={[s.dot, { transform: [{ translateY: dot1 }] }]}
              />
              <Animated.View
                style={[s.dot, { transform: [{ translateY: dot2 }] }]}
              />
              <Animated.View
                style={[s.dot, { transform: [{ translateY: dot3 }] }]}
              />
            </View>
          )}
        </View>

        {/* Opponent box */}
        <View style={[s.playerBox, found ? s.foundBox : s.opponentBox]}>
          {found ? (
            <Animated.View style={{ transform: [{ scale: foundScale }] }}>
              <Avatar
                name={opponentName || 'Opponent'}
                photoURL={opponentPhoto}
                avatarId={opponentAvatarId}
                size={64}
                backgroundColor="#28a745"
                style={{ marginBottom: 10 }}
              />
            </Animated.View>
          ) : (
            <Animated.View
              style={[s.questionCircle, { transform: [{ scale: pulse }] }]}
            >
              <Text style={s.questionMark}>?</Text>
            </Animated.View>
          )}
          <Text style={s.playerName} numberOfLines={1}>
            {found ? opponentName || 'Opponent' : 'Opponent'}
          </Text>
          <View style={[s.readyBadge, found ? undefined : s.searchingBadge]}>
            <Text style={found ? s.readyText : s.searchingText}>
              {found ? 'Ready' : 'Searching...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Cancel button */}
      {!found && (
        <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  </Layout>
);
};

export default RandomMatchScreen;

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 48,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Players row
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 48,
    width: '100%',
  },

  // Player box
  playerBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  opponentBox: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
  },
  foundBox: {
    borderColor: '#5FD68F',
  },
  questionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  questionMark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(245,239,224,0.7)',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textOnDark,
    marginBottom: 8,
    maxWidth: 90,
    textAlign: 'center',
  },
  readyBadge: {
    backgroundColor: '#5FD68F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  readyText: {
    color: COLORS.navyDark,
    fontSize: 11,
    fontWeight: '700',
  },
  searchingBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  searchingText: {
    color: 'rgba(245,239,224,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },

  // VS section
  vsSection: {
    alignItems: 'center',
    gap: 8,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Cancel
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cancelText: {
    color: '#F19191',
    fontWeight: '700',
    fontSize: 15,
  },
});