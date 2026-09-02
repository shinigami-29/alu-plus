import React, {createContext, useContext, useEffect, useRef} from 'react';
import GameLogic from '../gameLogic/Gamelogic';
import {NavigationContainerRef} from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage, getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

type GameLogicType = ReturnType<typeof GameLogic>;

const GameLogicContext = createContext<GameLogicType | any>(null);

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// Reads the notification data and navigates to the right screen.
// Called from three places: killed state, background state, and foreground tap.
const handleNotificationNavigation = (data?: { [key: string]: string | object }) => {
  if (!data) return;

  const tryNavigate = () => {
    if (!navigationRef.current) {
      setTimeout(tryNavigate, 300);
      return;
    }

    if (data.type === 'invite') {
      navigationRef.current.navigate('Invitation' as never);
    } else if (data.type === 'friend_request') {
      navigationRef.current.navigate('Multiplayer' as never);
    }else if (data.type === 'event_invite') {
  navigationRef.current.navigate('Invitation' as never);
  };
}

  tryNavigate();
};

// All notification channels are created here in one place to avoid duplication
const ensureNotificationChannels = async () => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: 'silent',
    name: 'Silent Notifications',
    importance: AndroidImportance.LOW,
  });
  await notifee.createChannel({
    id: 'game_invites',
    name: 'Game Invites',
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: 'friend_requests',
    name: 'Friend Requests',
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
  id: 'event_invites',
  name: 'Tournament Invites',
  importance: AndroidImportance.HIGH,
});
};

export const GameLogicProvider = ({children}: {children: React.ReactNode}) => {
  const { userProfile } = useAuth();
  const logic = GameLogic(userProfile?.avatarId, userProfile?.photoURL);
  const prevUsernameRef = useRef<string | null>(null);

 // Sync myName when the username changes, and also update the
  // leaderboard entry with the new name
  useEffect(() => {
    if (
      userProfile?.username &&
      userProfile.username !== prevUsernameRef.current
    ) {
      const isFirstLoad = prevUsernameRef.current === null;
      logic.setMyName(userProfile.username);

      if (!isFirstLoad) {
         // Not the first mount — this is an actual username change,
        // so update the name in the leaderboard too
        logic.updateLeaderboardName(userProfile.username);
      }

      prevUsernameRef.current = userProfile.username;
    }
  }, [userProfile?.username]);

 // If navigationRef isn't ready yet, retry shortly instead of giving up —
// otherwise a screen change could silently fail to navigate.
  useEffect(() => {
    let cancelled = false;

    const tryNavigate = () => {
      if (cancelled) return;

      if (!navigationRef.current) {
        setTimeout(tryNavigate, 100);
        return;
      }

      if (logic.screen === 'multiplayerGame') {
        navigationRef.current.navigate('MultiplayerGame' as never);
      } else if (logic.screen === 'waiting') {
        navigationRef.current.navigate('Waiting' as never);
      } else if (logic.screen === 'multiplayer') {
        navigationRef.current.navigate('Multiplayer' as never);
      } else if (logic.screen === 'Mode') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Mode' }],
        } as never);
      }
    };

    tryNavigate();

    return () => {
      cancelled = true;
    };
  }, [logic.screen]);

    useEffect(() => {
    if (!logic.myName) return;
    logic.listenToInvitations();
    logic.listenToSentInvitations();
    logic.listenToFriendRequests();
     logic.listenToEventInvitations();
  }, [logic.myName]);

 useEffect(() => {
    const messagingInstance = getMessaging(getApp());

    // Notification arrives while the app is open (foreground) — show the custom UI
    const unsubscribeOnMessage = onMessage(messagingInstance, remoteMessage => {
      ensureNotificationChannels()
        .then(() => {
          const incomingChannelId = remoteMessage.data?.channelId as string | undefined;
          const validChannels = ['default', 'silent', 'game_invites', 'friend_requests',  'event_invites' ];
          const channelId = validChannels.includes(incomingChannelId ?? '')
            ? incomingChannelId!
            : 'default';

          return notifee.displayNotification({
            title: remoteMessage.notification?.title ?? 'Alu Plus',
            body: remoteMessage.notification?.body ?? '',
            data: remoteMessage.data,
            android: {
              channelId,
              importance:
                channelId === 'silent' ? AndroidImportance.LOW : AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
                launchActivity: 'default',
              },
            },
          });
        })
        .catch(err => console.log('Foreground notification FAILED:', err.message));
    });

    // Check whether the app was opened from a fully closed (quit) state by tapping a notification
    getInitialNotification(messagingInstance).then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from quit state by notification:', remoteMessage);
        handleNotificationNavigation(remoteMessage.data);
      }
    });

    // App was in the background and got brought to the foreground by a notification tap
    const unsubscribeOnOpenedApp = onNotificationOpenedApp(messagingInstance, remoteMessage => {
      console.log('App opened from background by notification:', remoteMessage);
      handleNotificationNavigation(remoteMessage.data);
    });

    // App was open (foreground) and the notifee-displayed notification was tapped
    const unsubscribeForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Foreground notification tapped:', detail.notification);
        handleNotificationNavigation(detail.notification?.data as { [key: string]: string } | undefined);
      }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpenedApp();
      unsubscribeForegroundEvent();
    };
  }, []);


  return (
    <GameLogicContext.Provider value={logic}>
      {children}
    </GameLogicContext.Provider>
  );
};

// export const useGameLogic = () => useContext(GameLogicContext);
export const useGameLogic = (): GameLogicType => {
  const ctx = useContext(GameLogicContext);
  if (!ctx) {
    throw new Error('useGameLogic must be used within GameLogicProvider');
  }
  return ctx; 
};  //ctx = context

