import notifee, {AndroidImportance} from '@notifee/react-native';
import Sound from 'react-native-sound';

import {showMediaType} from './chatHandle';
import {getStorage} from './Storage';
import {name as appName} from '../../app.json';
import {store} from '../stores';

/* 系统消息通知 */
export async function onDisplayRealMsg(data) {
  const {STATIC_URL} = store.getState().baseConfigStore.baseConfig;

  const {
    session_name,
    session_avatar,
    session_id,
    msg_type,
    session,
    msgdata,
    msg_secret,
  } = data;

  await notifee.deleteChannel(session_id);

  const channelId = await notifee.createChannel({
    id: session_id,
    name: '实时消息',
    lights: true,
    vibration: false,
    importance: AndroidImportance.HIGH,
  });

  // Display a notification
  const unReadText =
    session.unread_count > 0 ? `(${session.unread_count + 1}条未读)` : '';

  await notifee.displayNotification({
    title: session_name + unReadText,
    body: showMediaType(msgdata, msg_type, msg_secret),
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      timestamp: Date.now(), // 8 minutes ago
      showTimestamp: true,
      largeIcon: STATIC_URL + session_avatar,
      pressAction: {
        id: session_id,
        mainComponent: appName,
      },
    },
  });
}

/* 取消系统通知 */
export const cancelNotification = async session_id => {
  await notifee.deleteChannel(session_id);
};

/* 播放系统声音 */
export async function playSystemSound(sound_name) {
  const soundName = await getStorage('setting', 'soundName');
  const sound = new Sound(
    sound_name || soundName || 'default_1.mp3',
    Sound.MAIN_BUNDLE,
    error => {
      if (error) {
        console.log('加载声音文件失败', error);
        return;
      }
      sound.setVolume(1.0);
      sound.play(success => {
        if (success) {
          sound.release();
          // console.log('successfully finished playing');
        } else {
          console.log('播放声音时出错');
        }
      });
    },
  );
}
