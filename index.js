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
    .then(() => {
      const channelId =
        remoteMessage.data?.channelId === 'silent' ? 'silent' : 'default';

      return notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'Alu Plus',
        body: remoteMessage.notification?.body ?? '',
        android: {
          channelId,
          importance:
            channelId === 'silent' ? AndroidImportance.LOW : AndroidImportance.HIGH,
        },
      });
    })
    .catch(err => console.log('Background notification FAILED:', err.message));
});

AppRegistry.registerComponent(appName, () => App);