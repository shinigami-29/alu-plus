/**
 * @format
 */

import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const messagingInstance = getMessaging(getApp());

setBackgroundMessageHandler(messagingInstance, remoteMessage => {
  console.log('Background message:', remoteMessage);


  const incomingChannelId = remoteMessage.data?.channelId || 'default';

  return notifee
    .createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    })
    .then(() =>
      notifee.createChannel({
        id: 'silent',
        name: 'Silent Notifications',
        importance: AndroidImportance.LOW,
      }),
    )
    .then(() =>
      notifee.createChannel({
        id: 'game_invites',
        name: 'Game Invites',
        importance: AndroidImportance.HIGH,
      }),
    )
    .then(() =>
      notifee.createChannel({
        id: 'friend_requests',
        name: 'Friend Requests',
        importance: AndroidImportance.HIGH,
      }),
    )
    .then(() => {
      const validChannels = ['default', 'silent', 'game_invites', 'friend_requests'];
      const channelId = validChannels.includes(incomingChannelId)
        ? incomingChannelId
        : 'default';

      return notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'Alu Plus',
        body: remoteMessage.notification?.body ?? '',
        android: {
          channelId,
          importance:
            channelId === 'silent' ? AndroidImportance.LOW : AndroidImportance.HIGH,
            pressAction: {
              id: "default",
              launchActivity: "default"
            }
        },
      });
    })
    .catch(err => console.log('Background notification FAILED:', err.message));
});

AppRegistry.registerComponent(appName, () => App);