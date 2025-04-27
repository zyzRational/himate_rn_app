import React, {useState, useEffect, useRef} from 'react';
import {AppState, FlatList, RefreshControl} from 'react-native';
import {
  View,
  Text,
  Avatar,
  Drawer,
  Colors,
  TouchableOpacity,
  Badge,
} from 'react-native-ui-lib';
import {useSelector, useDispatch} from 'react-redux';
import {getUserSessionList, dleUserSession} from '../../api/session';
import {getBaseConst} from '../../api/commom';
import {useToast} from '../../components/commom/Toast';
import {useSocket} from '../../utils/socket';
import {useRealm} from '@realm/react';
import {
  setLocalMsg,
  decryptMsg,
  formatMsg,
  showMediaType,
} from '../../utils/handle/chatHandle';
import {
  onDisplayRealMsg,
  cancelNotification,
  playSystemSound,
} from '../../utils/notification';
import {
  setChatMsg,
  setNotRemindSessionIds,
  delNotRemindSessionIds,
  setRemindSessions,
  delRemindSessions,
  initChatMsgStore,
} from '../../stores/store-slice/chatMsgStore';
import Feather from 'react-native-vector-icons/Feather';
import {formatDateTime} from '../../utils/base';
import {useIsFocused} from '@react-navigation/native';

const Msg = ({navigation}) => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  const userId = useSelector(state => state.userStore.userId);
  const isPlaySound = useSelector(state => state.settingStore.isPlaySound);
  const acceptMsgData = useSelector(state => state.chatMsgStore.msgData);
  const socketReady = useSelector(state => state.chatMsgStore.socketReady);
  const nowSessionId = useSelector(state => state.chatMsgStore.nowSessionId);
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const remindSessions = useSelector(
    state => state.chatMsgStore.remindSessions,
  );
  const notRemindSessionIds = useSelector(
    state => state.chatMsgStore.notRemindSessionIds,
  );
  const {showToast} = useToast();
  const realm = useRealm();
  const {socket} = useSocket();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (sessionlist?.length && roomName && socketReady) {
      sessionlist.forEach(item => {
        chatMsglistener(roomName, item);
      });
    }
  }, [sessionlist?.length, roomName, socketReady, isFocused]);

  /* 获取会话列表 */
  const [sessionlist, setSessionlist] = useState([]);
  const sessionDataInit = async _userId => {
    try {
      setRefreshing(true);
      const res = await getUserSessionList({
        uid: _userId,
        msg_status: 'unread',
      });
      if (res.success) {
        // console.log(res.data.list);
        setSessionlist(res.data.list);
        getSelfReminds(res.data.list);
        setRefreshing(false);
      }
    } catch (error) {
      console.error(error);
      setRefreshing(false);
    }
  };

  /* 删除会话 */
  const deleteSession = async sessionId => {
    try {
      const res = await dleUserSession(sessionId);
      if (res.success) {
        sessionDataInit(userId);
      }
      showToast(res.message, res.success ? 'success' : 'error');
    } catch (error) {
      console.error(error);
    }
  };

  /* 向服务器确认收到消息 */
  const readMsg = async (msgId, sessionId, uid) => {
    return new Promise((resolve, reject) => {
      if (socketReady) {
        socket?.emit(
          'message',
          {
            type: 'readMsg',
            data: {
              sId: sessionId,
              msgId,
              uid,
            },
          },
          res => {
            if (res.success) {
              resolve(res.data);
            } else {
              showToast(res.message, 'error');
              reject(new Error('确认已读失败'));
            }
          },
        );
      } else {
        showToast('socket 未连接', 'error');
        reject(new Error('socket 未连接'));
      }
    });
  };

  /* 本地确认收到消息 */
  const readListMsg = async sessionInfo => {
    cancelNotification(sessionInfo.session_id);
    dispatch(delRemindSessions(sessionInfo.session_id));
    if (sessionInfo.msgs.length > 0) {
      const newlist = [];

      const readMsgPromises = sessionInfo.msgs.map(async msg => {
        try {
          await readMsg(msg.id, sessionInfo.id, userId);
          newlist.push(formatMsg(msg));
        } catch (error) {
          console.error(error);
        }
      });
      await Promise.all(readMsgPromises);
      setLocalMsg(realm, newlist);
      sessionDataInit(userId);
    }
  };

  /* 监听云端消息 */
  const chatMsglistener = (room_name, session) => {
    const {session_id, session_name, session_avatar} = session || {};
    if (socketReady) {
      socket?.on(room_name + session_id, data => {
        // console.log('从服务器收到的消息', data);
        dispatch(
          setChatMsg({
            session_name,
            session_avatar,
            ...data,
          }),
        );
      });
    }
  };

  // 监听页面聚焦
  useEffect(() => {
    if (userId) {
      sessionDataInit(userId);
    }
  }, [isFocused, userId]);

  // 监听应用状态
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  /* 设置勿扰 */
  const setNotRemind = session_id => {
    if (notRemindSessionIds.includes(session_id)) {
      dispatch(delNotRemindSessionIds(session_id));
    } else {
      dispatch(setNotRemindSessionIds(session_id));
    }
  };

  /* 强制显示提醒 */
  const [selfRemindList, setSelfRemindList] = useState([]); // 提醒自己的@
  const getSelfReminds = sessions => {
    sessions.forEach(sessionInfo => {
      if (sessionInfo.chat_type === 'group') {
        const selfGroupInfo = sessionInfo.group?.members.find(
          item => item.member_uid === userId,
        );
        const selfRemind = `@${selfGroupInfo?.member_remark}`;
        setSelfRemindList(prev => {
          if (
            prev.find(
              item =>
                item.session_id === sessionInfo.session_id &&
                item.selfRemind === selfRemind,
            )
          ) {
            return prev;
          } else {
            return [
              ...prev,
              {
                session_id: sessionInfo.session_id,
                selfRemind,
              },
            ];
          }
        });
      }
    });
  };

  useEffect(() => {
    //console.log('store接受到的消息', acceptMsgData);

    if (acceptMsgData?.id && userId) {
      sessionDataInit(userId);
      if (
        isPlaySound &&
        nowSessionId !== acceptMsgData.session_id &&
        !notRemindSessionIds.includes(acceptMsgData.session_id)
      ) {
        playSystemSound();
        if (appStateVisible === 'background' || !isFocused) {
          onDisplayRealMsg(acceptMsgData);
        }
      }
      // 提醒@的消息
      if (acceptMsgData.chat_type === 'group') {
        const trueMsg = decryptMsg(
          acceptMsgData?.msgdata,
          acceptMsgData?.msg_secret,
        );
        selfRemindList.forEach(item => {
          if (
            trueMsg.includes(item.selfRemind) &&
            item.session_id === acceptMsgData.session_id
          ) {
            dispatch(setRemindSessions(item.session_id));
            playSystemSound();
            if (
              (appStateVisible === 'background' &&
                notRemindSessionIds.includes(acceptMsgData.session_id)) ||
              !isFocused
            ) {
              onDisplayRealMsg(acceptMsgData);
            }
          }
        });
      }
    }
  }, [acceptMsgData?.id, userId]);

  const [roomName, setRoomName] = useState(null);
  useEffect(() => {
    /* 获取会话名称 */
    getBaseConst()
      .then(res => {
        if (res.success) {
          setRoomName(res.data.RoomName);
        }
      })
      .catch(error => {
        console.error(error);
      });
    return () => {
      dispatch(initChatMsgStore());
    };
  }, []);

  useEffect(() => {
    if (nowSessionId !== '') {
      dispatch(delRemindSessions(nowSessionId));
    }
  }, [nowSessionId]);

  /* 列表元素 */
  const renderSessionItem = item => {
    return (
      <Drawer
        disableHaptic={true}
        itemsMinWidth={80}
        rightItems={[
          {
            text: notRemindSessionIds.includes(item.session_id)
              ? '恢复提醒'
              : '勿扰',
            background: notRemindSessionIds.includes(item.session_id)
              ? Colors.success
              : Colors.warning,
            onPress: () => {
              setNotRemind(item.session_id);
            },
          },
          {
            text: '删除',
            background: Colors.error,
            onPress: () => {
              deleteSession(item.id);
            },
          },
        ]}
        leftItem={{
          text: '已读',
          background: Colors.Primary,
          onPress: () => {
            readListMsg(item);
          },
        }}>
        <TouchableOpacity
          centerV
          row
          padding-s4
          bg-white
          onPress={() => {
            navigation.navigate('Chat', {
              session_id: item.session_id,
              chat_type: item.chat_type,
              to_remark: item.session_name,
            });
          }}>
          <Avatar
            source={{
              uri: STATIC_URL + item.session_avatar,
            }}
          />
          <View marginL-12>
            <View flexG row centerV spread style={{width: '92%'}}>
              <Text text70BL>{item.session_name}</Text>
              <View flexS row centerV>
                {userId === item.last_msgUid ? null : item.unread_count ===
                  0 ? null : (
                  <Badge
                    marginR-6
                    label={item.unread_count}
                    backgroundColor={
                      notRemindSessionIds.includes(item.session_id)
                        ? Colors.grey50
                        : Colors.error
                    }
                    size={16}
                  />
                )}
                {notRemindSessionIds.includes(item.session_id) ? (
                  <Feather name="bell-off" color={Colors.grey40} size={16} />
                ) : null}
              </View>
            </View>
            <View flexG row centerV spread style={{width: '92%'}}>
              <Text text80 numberOfLines={1} grey30 style={{width: '70%'}}>
                {remindSessions.includes(item.session_id) ? (
                  <Text text80 red40>
                    [有人@你]
                  </Text>
                ) : null}
                {showMediaType(
                  item.last_msg,
                  item.last_msgType,
                  item?.last_msgSecret,
                )}
              </Text>
              <Text text90L grey40>
                {formatDateTime(item.update_time)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Drawer>
    );
  };

  return (
    <View>
      <FlatList
        refreshControl={
          <RefreshControl
            colors={[Colors.Primary]}
            refreshing={refreshing}
            onRefresh={() => {
              if (userId) {
                sessionDataInit(userId);
              }
            }}
          />
        }
        data={sessionlist}
        keyExtractor={(item, index) => item + index}
        onEndReached={() => {}}
        renderItem={({item}) => renderSessionItem(item)}
        ListEmptyComponent={
          <View marginT-16 center>
            <Text text90L grey40>
              还没有发现任何消息~
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default Msg;
