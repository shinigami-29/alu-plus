
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameLogic } from '../GameLogicContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../avatar/Avatar';

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

  // Profile ko "username" field deखाउने — "name" field hoina
  const displayName =
    userProfile?.username ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'You';
  const avatarSource = getAvatarSource(userProfile?.avatarId);
  const photoURL = userProfile?.photoURL || user?.photoURL || null;

  // opponent ko avatarId bata avatar source nikaalne — GameLogic bata aauxa
  const opponentAvatarSource = getAvatarSource(opponentAvatarId);

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

  // Opponent bhetiyo bhane: searching animation haru rokera,
  // "found" box lai bounce-in garaune
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
    <ImageBackground
      source={require('../../images/bg3.png')}
      style={s.container}
      resizeMode="cover"
    >
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
          {avatarSource ? (
            <Image source={avatarSource} style={s.avatar} />
          ) : photoURL ? (
            <Image source={{ uri: photoURL }} style={s.avatar} />
          ) : (
            <View style={s.avatarCircle}>
              <Text style={s.avatarLetter}>
                {displayName?.[0]?.toUpperCase() ?? 'Y'}
              </Text>
            </View>
          )}
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
            // avatarId lai photo bhanda priority — avatar select gareko bhaye tyo dekhaune,
            // natra photo, natra letter fallback
            opponentAvatarSource ? (
              <Animated.Image
                source={opponentAvatarSource}
                style={[s.avatar, { transform: [{ scale: foundScale }] }]}
              />
            ) : opponentPhoto ? (
              <Animated.Image
                source={{ uri: opponentPhoto }}
                style={[s.avatar, { transform: [{ scale: foundScale }] }]}
              />
            ) : (
              <Animated.View
                style={[
                  s.avatarCircle,
                  s.foundAvatar,
                  { transform: [{ scale: foundScale }] },
                ]}
              >
                <Text style={s.avatarLetter}>
                  {opponentName?.[0]?.toUpperCase() ?? 'O'}
                </Text>
              </Animated.View>
            )
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

      {/* Cancel button - found bhaisakepachi hide garne */}
      {!found && (
        <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </ImageBackground>
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#182992',
    elevation: 4,
  },
  opponentBox: {
    borderColor: '#dde3f0',
    borderStyle: 'dashed',
  },
  foundBox: {
    borderColor: '#28a745',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#189292',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  foundAvatar: {
    backgroundColor: '#28a745',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  questionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dde3f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  questionMark: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9098a8',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#182992',
    marginBottom: 8,
    maxWidth: 90,
    textAlign: 'center',
  },
  readyBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  readyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchingBadge: {
    backgroundColor: '#dde3f0',
  },
  searchingText: {
    color: '#9098a8',
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
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dde3f0',
  },
  cancelText: {
    color: '#e57373',
    fontWeight: '700',
    fontSize: 15,
  },
});