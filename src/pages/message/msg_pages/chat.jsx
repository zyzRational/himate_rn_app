/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useCallback, useState, useRef} from 'react';
import {ActivityIndicator, StyleSheet, Vibration, Modal} from 'react-native';
import {
  View,
  Button,
  Text,
  Colors,
  TouchableOpacity,
  Card,
  LoaderScreen,
  Avatar,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  GiftedChat,
  Bubble,
  Send,
  InputToolbar,
  LoadEarlier,
  Composer,
  Day,
  MessageText,
} from 'react-native-gifted-chat';
import Clipboard from '@react-native-clipboard/clipboard';
import ImagePicker from 'react-native-image-crop-picker';
import {useSelector, useDispatch} from 'react-redux';
import {useSocket} from '../../../utils/socket';
import {getSessionDetail} from '../../../api/session';
import {useToast} from '../../../components/commom/Toast';
import {useRealm} from '@realm/react';
import {
  formatMsg,
  formatJoinUser,
  setLocalMsg,
  getLocalMsg,
  getLocalUser,
  delLocalMsg,
  addOrUpdateLocalUser,
} from '../../../utils/handle/chatHandle';
import {setIsPlaySound} from '../../../stores/store-slice/settingStore';
import {setNowSessionId} from '../../../stores/store-slice/chatMsgStore';
import {
  deepClone,
  getfileFormdata,
  getDocumentfileFormdata,
  createRandomNumber,
  getRecordfileFormdata,
  isEmptyObject,
} from '../../../utils/base';
import {
  UploadFile,
  getFileName,
  getFileExt,
  getFileColor,
} from '../../../utils/handle/fileHandle';
import DocumentPicker from 'react-native-document-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  FlatList,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import {fullWidth, fullHeight} from '../../../styles';
import {DownloadFile} from '../../../utils/handle/fileHandle';
import BaseSheet from '../../../components/commom/BaseSheet';
import {
  requestCameraPermission,
  requestMicrophonePermission,
  requestFolderPermission,
} from '../../../stores/store-slice/permissionStore';
import {cancelNotification} from '../../../utils/notification';
import {
  createRandomSecretKey,
  encryptAES,
} from '../../../utils/handle/cryptoHandle';
import VideoModal from '../../../components/commom/VideoModal';
import ImgModal from '../../../components/commom/ImgModal';
import VideoMsg from '../../../components/message/VideoMsg';
import ImageMsg from '../../../components/message/ImageMsg';
import AudioMsg from '../../../components/message/AudioMsg';
import 'dayjs/locale/zh-cn';

const audioRecorderPlayer = new AudioRecorderPlayer();
let recordTimer = null;

const Chat = React.memo(({navigation, route}) => {
  const {session_id, chat_type, searchMsg_cid} = route.params;

  const dispatch = useDispatch();
  const {showToast} = useToast();
  const {socket} = useSocket();
  const realm = useRealm();
  const userInfo = useSelector(state => state.userStore.userInfo);
  const userId = useSelector(state => state.userStore.userId);
  const acceptMsgData = useSelector(state => state.chatMsgStore.msgData);
  const socketReady = useSelector(state => state.chatMsgStore.socketReady);
  const secretStr = useSelector(state => state.baseConfigStore.secretStr);

  const accessCamera = useSelector(state => state.permissionStore.accessCamera);
  const accessMicrophone = useSelector(
    state => state.permissionStore.accessMicrophone,
  );
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);

  // baseConfig
  const {STATIC_URL, THUMBNAIL_URL} = useSelector(
    state => state.baseConfigStore.baseConfig,
  );
  const isEncryptMsg = useSelector(state => state.settingStore.isEncryptMsg);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cancelNotification(session_id);
      dispatch(setIsPlaySound(false));
      dispatch(setNowSessionId(session_id));
      audioRecorderPlayer.addPlayBackListener(value => {
        setAudioPlayprogress(value);
        if (value.isFinished) {
          setNowReadyAudioId(null);
          setAudioIsPlaying(false);
          setAudioPlayprogress({});
        }
      });
    });
    return () => {
      dispatch(setIsPlaySound(true));
      dispatch(setNowSessionId(''));
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      return unsubscribe;
    };
  }, [navigation, session_id]);

  /* 获取未读消息 */
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [userInGroupInfo, setUserInGroupInfo] = useState({});
  const [groupMembers, setGroupMembers] = useState([]);
  const [sId, setSId] = useState(null); // session的数字id
  const [jionUsers, setJionUsers] = useState(getLocalUser(realm) || []);
  const getUnreadMsg = async (sessionId, chatType, user_info) => {
    const {id: user_id, user_name, user_avatar} = user_info || {};
    try {
      const unreadRes = await getSessionDetail({
        session_id: sessionId,
        chat_type: chatType,
        msg_status: 'unread',
      });
      if (unreadRes.success) {
        const {id: sess_id, msgs, mate, group} = unreadRes.data;
        setSId(sess_id);

        //将消息格式化，向服务器发送已读消息
        const newlist = [];
        msgs.forEach(item => {
          if (item.send_uid !== user_id) {
            readMessage(item.id, sess_id, user_id);
            newlist.push(formatMsg(item));
          }
        });

        const joinUserList = [];
        if (chat_type === 'personal') {
          const {
            agree_uid,
            agree_avatar,
            agree_remark,
            apply_uid,
            apply_remark,
            apply_avatar,
          } = mate || {};
          if (user_id === apply_uid) {
            joinUserList.push(
              ...[
                formatJoinUser(
                  agree_uid,
                  agree_remark,
                  agree_avatar,
                  session_id,
                ),
                formatJoinUser(user_id, user_name, user_avatar, session_id),
              ],
            );
            route.params.to_uid = agree_uid;
          }
          if (user_id === agree_uid) {
            joinUserList.push(
              ...[
                formatJoinUser(
                  apply_uid,
                  apply_remark,
                  apply_avatar,
                  session_id,
                ),
                formatJoinUser(user_id, user_name, user_avatar, session_id),
              ],
            );
            route.params.to_uid = apply_uid;
          }
        }
        if (chat_type === 'group') {
          setGroupMembers(group.members);
          const selfInfo = group.members.find(
            item => item.member_uid === user_id,
          );
          if (selfInfo) {
            setUserInGroupInfo(selfInfo);
          }
          const memberList = group.members.map(item => {
            return formatJoinUser(
              item.member_uid,
              item.member_remark,
              item.member_avatar,
              session_id,
              group.group_name,
            );
          });
          joinUserList.push(...memberList);
        }
        // 加载一次未读消息
        addMessage(newlist, joinUserList);
        setLocalMsg(realm, newlist);

        // 同步本地缓存用户信息
        setJionUsers(joinUserList);
        addOrUpdateLocalUser(realm, joinUserList);
        // 加载完成
        setIsLoadingComplete(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*  添加来自数据库的消息 */
  const addMessage = useCallback(
    (msgList = [], userList = [], isNew = true) => {
      if (!msgList.length && !userList.length) {
        return;
      }
      setMessages(previousMessages => {
        const newList = deepClone(msgList);
        const needList = [];
        const prevMsgMap = new Map(
          previousMessages.map(item => [item._id, item._id]),
        );
        newList.forEach(msg => {
          const send_uid = msg.send_uid;
          if (!prevMsgMap.has(msg._id)) {
            const needUser = userList.find(
              ele => ele.uid === send_uid && ele.session_id === session_id,
            );
            switch (msg.msg_type) {
              case 'image':
                msg.image = `${THUMBNAIL_URL}${msg.text}`;
                msg.originalImage = `${STATIC_URL}${msg.text}`;
                msg.text = null;
                break;
              case 'video':
                msg.video = `${STATIC_URL}${msg.text}`;
                msg.text = null;
                break;
              case 'audio':
                msg.audio = `${STATIC_URL}${msg.text}`;
                msg.text = null;
                break;
              case 'other':
                msg.filePath = `${STATIC_URL}${msg.text}`;
                msg.text = getFileExt(msg.text);
                break;
            }
            if (needUser) {
              msg.user = {
                _id: userId === msg.send_uid ? 1 : 2,
                avatar: STATIC_URL + needUser.avatar,
                name: needUser.remark,
                uid: needUser.uid,
              };
              needList.push(msg);
            }
          }
        });
        return GiftedChat.append(previousMessages, needList, isNew);
      });
    },
    [session_id, userId],
  );

  /* 移除消息 */
  const removeMessage = useCallback(
    cmsg_id => {
      setMessages(previousMessages => {
        const filteredItems = previousMessages.filter(
          item => item.clientMsg_id !== cmsg_id,
        );
        return GiftedChat.append(filteredItems, []);
      });
      delLocalMsg(realm, cmsg_id);
    },
    [realm],
  );

  /* 更改消息状态 */
  const updateMessage = useCallback((msgId, status) => {
    setMessages(previousMessages => {
      const index = previousMessages.findIndex(item => item._id === msgId);
      if (index !== -1) {
        const formattedMsg = addMsgToLocal(previousMessages[index], status);
        previousMessages[index] = {...previousMessages[index], ...formattedMsg};
      }
      return GiftedChat.append(previousMessages, []);
    });
  }, []);

  /* 添加消息到本地数据库 */
  const addMsgToLocal = useCallback(
    (message, status = 'failed') => {
      const newMsg = {
        _id: createRandomNumber(),
        clientMsg_id: String(message._id),
        session_id: session_id,
        send_uid: userId,
        text: message.text,
        chat_type: chat_type,
        msg_type: message.msg_type || 'text',
        msg_status: 'unread',
        createdAt: message.createdAt,
        status: status,
      };
      setLocalMsg(realm, [newMsg]);
      return newMsg;
    },
    [realm, userId],
  );

  /* 添加系统消息 */
  const handleSystemMsg = useCallback((msg, isAdd = true) => {
    setMessages(prevMsgs => {
      const filteredMsgs = prevMsgs.filter(item => !item?.system);
      const newMsgs = [];
      if (isAdd) {
        newMsgs.push({
          text: msg,
          system: true,
          _id: 'system' + Date.now().toString(),
          createdAt: new Date(),
        });
      }
      return GiftedChat.append(filteredMsgs, newMsgs);
    });
  }, []);

  /* 发送消息 */
  const sendMessage = useCallback(
    (message, msg_type = 'text', isReSend = false) => {
      const baseMsg = {
        sId,
        session_id,
        send_uid: userId,
        msgdata: message,
        chat_type,
        msg_type,
        isReSend,
      };
      // 加密消息
      if (isEncryptMsg) {
        const {secret, trueSecret} = createRandomSecretKey(secretStr);
        baseMsg.msg_secret = secret;
        baseMsg.msgdata = JSON.stringify(encryptAES(message, trueSecret));
      }
      return new Promise((resolve, reject) => {
        if (socketReady) {
          try {
            socket?.emit('chat', baseMsg, res => {
              // console.log('chat msg', res);
              if (res.success) {
                resolve(res.data);
              } else {
                showToast(res.message, 'error');
                reject(new Error('发送失败'));
              }
            });
          } catch (error) {
            reject(new Error(error));
          }
        } else {
          showToast('socket 未连接', 'error');
          reject(new Error('socket 未连接'));
        }
      });
    },
    [sId, session_id, userId, chat_type, isEncryptMsg],
  );

  /* 向服务器确认收到消息 */
  const readMessage = useCallback(
    (msgId, sess_id) => {
      return new Promise((resolve, reject) => {
        if (socketReady) {
          try {
            socket?.emit(
              'message',
              {
                type: 'readMsg',
                data: {
                  sId: sess_id,
                  msgId,
                  uid: userId,
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
          } catch (error) {
            console.error(error);
            reject(new Error(error));
          }
        } else {
          showToast('socket 未连接', 'error');
          reject(new Error('socket 未连接'));
        }
      });
    },
    [userId],
  );

  /* 添加为待上传的媒体消息 */
  const addUploadIds = useCallback((Msgs = []) => {
    const newIds = [];
    Msgs.forEach(item => {
      if (item?.msg_type && item?.msg_type !== 'text') {
        newIds.push(item._id);
      }
    });
    setUploadIds(prevIds => Array.from(new Set([...prevIds, ...newIds])));
  }, []);

  /* 上传完成的媒体消息移除 */
  const removeUploadId = useCallback(message_id => {
    setUploadIds(prevIds => prevIds.filter(id => id !== message_id));
  }, []);

  const [nowSendId, setNowSendId] = useState(null);
  const [uploadIds, setUploadIds] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* 本地发送 */
  const onSend = useCallback(async (_messages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, _messages),
    );
    addUploadIds(_messages);

    for (const message of _messages) {
      const {_id, msg_type, text, file} = message;
      let content = text;
      try {
        if (msg_type && msg_type !== 'text' && file) {
          setNowSendId(_id);
          const res = await UploadFile(
            file,
            value => {
              setUploadProgress(value);
            },
            {uid: userId, fileType: msg_type, useType: 'chat'},
          );
          setNowSendId(null);
          removeUploadId(_id);
          setUploadProgress(0);
          const upRes = JSON.parse(res.text());
          if (!upRes.success) {
            continue;
          }
          content = upRes.data.file_name;
        }

        const reslut = await sendMessage(content, msg_type);
        const msg = formatMsg(reslut);
        setLocalMsg(realm, [msg]);
        handleSystemMsg(null, false);
      } catch (error) {
        console.error('消息发送失败:', error);
        handleSystemMsg('发送失败！');
        updateMessage(_id, 'failed');
      }
    }
  }, []);

  /* 媒体消息 */
  const sendMediaMsg = useCallback(
    (medias, sourceType) => {
      const mediaMsgs = [];
      for (let i = 0; i < medias.length; i++) {
        const media = medias[i];
        let mediaRes = {};
        if (sourceType === 'camera') {
          mediaRes = getfileFormdata('chat', media);
        }
        if (sourceType === 'folder') {
          mediaRes = getDocumentfileFormdata('chat', media);
        }
        if (sourceType === 'record') {
          mediaRes = getRecordfileFormdata('chat', media);
        }
        const media_type = mediaRes.type;
        const mediaMsg = {
          text: null,
          _id: createRandomNumber(),
          createdAt: new Date(),
          msg_type: media_type,
          file: mediaRes.file,
          user: {
            _id: 1,
            name:
              chat_type === 'group'
                ? userInGroupInfo?.member_remark
                : userInfo?.user_name,
            avatar: STATIC_URL + userInfo?.user_avatar,
          },
        };
        if (media_type === 'image') {
          mediaMsg.image = mediaRes.uri;
          mediaMsg.originalImage = mediaRes.uri;
        }
        if (media_type === 'video') {
          mediaMsg.video = mediaRes.uri;
        }
        if (media_type === 'audio') {
          mediaMsg.audio = mediaRes.uri;
        }
        if (media_type === 'other') {
          mediaMsg.text = mediaRes.ext;
        }
        mediaMsgs.push(mediaMsg);
      }
      onSend(mediaMsgs);
    },
    [userInfo, userInGroupInfo],
  );

  /* 加载本地消息 */
  useEffect(() => {
    setMessages([]);
    if (session_id) {
      const localMsg = getLocalMsg(realm, session_id);
      setLocalMsgList(localMsg.list);
    }
  }, [session_id]);

  /* 本地消息分页 */
  const [page, setPage] = useState(0);
  const [localMsgList, setLocalMsgList] = useState([]);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  const pageSize = 30;
  const getNowPageMsg = useCallback((list = [], _page, cid) => {
    setIsLoadingEarlier(true);
    const start = _page * pageSize;
    const end = start + pageSize;
    const newList = list.slice(start, end);
    if (end >= list.length) {
      showToast('没有更多消息了', 'warning');
      setAllLoaded(true);
    }
    setIsLoadingEarlier(false);
    return newList;
  }, []);

  const onLoadEarlier = useCallback(() => {
    if (isLoadingEarlier || allLoaded) {
      return;
    }
    setPage(prevPage => prevPage + 1);
  }, [setPage]);

  /* 滑动加载历史消息 */
  useEffect(() => {
    if (localMsgList.length && jionUsers.length) {
      addMessage(
        getNowPageMsg(localMsgList, page, searchMsg_cid),
        jionUsers,
        false,
      );
    }
  }, [page, localMsgList, jionUsers, searchMsg_cid]);

  /* 监听接受的消息 */
  useEffect(() => {
    if (acceptMsgData?.id && sId && userId && jionUsers.length) {
      if (acceptMsgData.session_id !== session_id) {
        return;
      }
      const {id: msgId, send_uid, isReSend} = acceptMsgData || {};
      if (isLoadingComplete && (send_uid !== userId || isReSend)) {
        const msg = formatMsg(acceptMsgData);
        addMessage([msg], jionUsers);
        setLocalMsg(realm, [msg]);
        readMessage(msgId, sId);
      }
    }
  }, [
    acceptMsgData?.id,
    session_id,
    sId,
    jionUsers,
    userId,
    isLoadingComplete,
  ]);

  /* 首次加载未读消息 */
  useEffect(() => {
    if (!isEmptyObject(userInfo) && session_id && chat_type) {
      getUnreadMsg(session_id, chat_type, userInfo);
    }
  }, [userInfo, session_id, chat_type]);

  /* 自定义气泡 */
  const renderBubble = props => {
    const IsText =
      !props.currentMessage?.msg_type ||
      props.currentMessage?.msg_type === 'text';
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: IsText ? Colors.Primary : 'transparent',
            borderRadius: 8,
            padding: IsText ? 4 : 0,
          },
          left: {
            backgroundColor: IsText ? Colors.white : 'transparent',
            borderRadius: 8,
            padding: IsText ? 4 : 0,
          },
        }}
      />
    );
  };

  /* 自定义发送按钮 */
  const renderSend = props => {
    return (
      <Send
        {...props}
        containerStyle={{
          backgroundColor: Colors.Primary,
          borderRadius: 8,
          margin: 8,
          height: 30,
        }}
        label="发送"
        textStyle={{
          color: Colors.white,
          fontSize: 14,
          position: 'relative',
          top: fullHeight * 0.006,
        }}
      />
    );
  };

  /* 自定义输入框容器 */
  const renderInputToolbar = props => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbarContainerStyle}
        accessoryStyle={[
          styles.inputToolbarAccessoryStyle,
          {height: showMore ? 80 : 0},
        ]}
      />
    );
  };

  /* 自定义输入框 */
  const renderComposer = props => {
    return <Composer {...props} textInputStyle={styles.textInputStyle} />;
  };

  /* 点击头像 */
  const onAvatarPress = User => {
    navigation.navigate('Mateinfo', {
      uid: User._id === 1 ? userId : User?.uid,
    });
  };

  /* 长按头像 */
  const [msgText, setMsgText] = useState('');
  const onLongPressAvatar = User => {
    if (chat_type === 'group') {
      Vibration.vibrate(50);
      setMsgText(prevText => prevText + `@${User.name} `);
    }
  };

  /* 渲染成员列表 */
  const renderMemberList = (item, index) => {
    return (
      <TouchableOpacity
        flexS
        row
        centerV
        backgroundColor={Colors.white}
        paddingH-12
        paddingV-6
        onPress={() => {
          setMsgText(prevText => prevText + item.member_remark + ' ');
          setShowMebers(false);
        }}>
        <Avatar
          source={{
            uri: STATIC_URL + item.member_avatar,
          }}
          size={40}
        />
        <Text marginL-10 text70>
          {item.member_remark}
        </Text>
      </TouchableOpacity>
    );
  };

  /* 选择@对象 */
  const [showMebers, setShowMebers] = useState(false);
  const prevMsgTextRef = useRef('');
  useEffect(() => {
    if (chat_type === 'group') {
      if (
        msgText.endsWith('@') &&
        msgText.length > prevMsgTextRef.current.length
      ) {
        setShowMebers(true);
      } else if (
        !msgText.endsWith('@') &&
        prevMsgTextRef.current.endsWith('@')
      ) {
        setShowMebers(false);
      }
    }
    prevMsgTextRef.current = msgText;
  }, [msgText]);

  /* 加载更多 */
  const renderLoadEarlier = props => {
    return (
      <LoadEarlier
        {...props}
        label="加载更多"
        wrapperStyle={{
          backgroundColor: Colors.white,
        }}
        textStyle={{color: Colors.grey20}}
        activityIndicatorColor={Colors.Primary}
      />
    );
  };

  /* 自定义时间 */
  const renderDay = props => {
    return (
      <Day
        {...props}
        containerStyle={styles.DayContainerStyle}
        wrapperStyle={{backgroundColor: Colors.transparent}}
        textStyle={styles.DayTextStyle}
      />
    );
  };

  /* 滚动到底部按钮 */
  const scrollToBottomComponent = () => {
    return (
      <View>
        <Ionicons name="chevron-down" color={Colors.Primary} size={24} />
      </View>
    );
  };

  /* 自定义消息状态 */
  const renderTicks = useCallback(
    message => {
      const {_id, status, msg_type} = message;
      if (status === 'failed') {
        return (
          <View flexS>
            <Text text100L red40 center>
              <FontAwesome
                name="exclamation-circle"
                color={Colors.error}
                size={11}
              />
              &nbsp;未发送
            </Text>
          </View>
        );
      }
      if (msg_type && msg_type !== 'text') {
        if (uploadIds.includes(_id) && nowSendId === _id) {
          return (
            <View flexG row center marginT-4>
              <ActivityIndicator color={Colors.Primary} size={14} />
              <Text marginL-4 grey30 text100L>
                发送中...{uploadProgress.toFixed(0)}%
              </Text>
            </View>
          );
        }
        if (uploadIds.includes(_id) && nowSendId !== _id) {
          return (
            <View flexG row center marginT-4>
              <Text marginL-4 grey30 text100L>
                等待发送
              </Text>
            </View>
          );
        }
      }
    },
    [uploadIds, nowSendId, uploadProgress],
  );

  /* 自定义长按消息 */
  const onLongPress = (context, currentMessage) => {
    if (currentMessage.msg_type === 'text') {
      Vibration.vibrate(50);
      const options = ['复制消息', '取消'];
      const cancelButtonIndex = options.length - 1;
      if (currentMessage.status === 'failed') {
        options.unshift('取消发送');
        options.unshift('重新发送');
      }
      context.actionSheet().showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        buttonIndex => {
          const showMsghandle = currentMessage.status === 'failed';

          if (showMsghandle && buttonIndex === 0) {
            sendMessage(currentMessage?.text, 'text', true)
              .then(res => {
                if (res) {
                  removeMessage(currentMessage.clientMsg_id);
                  handleSystemMsg(null, false);
                }
              })
              .catch(error => {
                handleSystemMsg('发送失败！');
                console.error(error);
              });
          }

          if (showMsghandle && buttonIndex === 1) {
            removeMessage(currentMessage.clientMsg_id);
          }

          if (
            (showMsghandle && buttonIndex === 2) ||
            (!showMsghandle && buttonIndex === 0)
          ) {
            Clipboard.setString(currentMessage.text);
            showToast('已复制到剪贴板', 'success');
            return;
          }
        },
      );
    }
  };

  /*自定义系统消息 */
  const renderSystemMessage = props => {
    return (
      <View center padding-4>
        <Text text90L grey40>
          {props.currentMessage.text}
        </Text>
      </View>
    );
  };

  /* 自定义文件消息 */
  const renderFileMessage = props => {
    if (props.currentMessage.msg_type === 'other') {
      const fileMsg = props.currentMessage;
      return (
        <TouchableOpacity
          bg-white
          padding-8
          margin-4
          style={styles.fileContainer}
          onPress={() => {
            if (fileMsg.text === 'pdf') {
              navigation.navigate('PdfView', {url: fileMsg.filePath});
            } else {
              showToast('暂不支持该类型文件预览，请长按下载后查看', 'warning');
            }
          }}
          onLongPress={() => {
            Vibration.vibrate(50);
            setIsInCameraRoll(false);
            setSavePath(fileMsg.filePath);
            setShowActionSheet(true);
          }}>
          <FontAwesome
            name="file"
            color={getFileColor(fileMsg.text)}
            size={80}
          />
          <Text white text50BL style={styles.fileExt}>
            {fileMsg.text}
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <View>
        <MessageText {...props} />
      </View>
    );
  };

  /* 自定义图片消息 */
  const [imageShow, setImageShow] = useState(false);
  const [nowImage, setNowImage] = useState('');
  const renderMessageImage = props => {
    const curMsg = props.currentMessage;
    return (
      <ImageMsg
        Msg={curMsg}
        OnPress={() => {
          setImageShow(true);
          setNowImage(curMsg?.originalImage);
        }}
        OnLongPress={() => {
          Vibration.vibrate(50);
          setIsInCameraRoll(true);
          setSavePath(curMsg?.originalImage);
          setShowActionSheet(true);
        }}
        UploadIds={uploadIds}
        NowSendId={nowSendId}
        UploadProgress={uploadProgress}
      />
    );
  };

  /* 处理视频状态 */
  const [modalVisible, setModalVisible] = useState(false);
  const [fullscreenUri, setFullscreenUri] = useState(null);

  /* 自定义视频消息 */
  const renderMessageVideo = props => {
    const videoMsg = props.currentMessage;
    return (
      <View padding-4>
        <VideoMsg
          Msg={videoMsg}
          OnPress={() => {
            setFullscreenUri(videoMsg.video);
            setModalVisible(true);
          }}
          OnLongPress={() => {
            Vibration.vibrate(50);
            setIsInCameraRoll(true);
            setSavePath(videoMsg.video);
            setShowActionSheet(true);
          }}
          UploadIds={uploadIds}
          NowSendId={nowSendId}
          UploadProgress={uploadProgress}
        />
      </View>
    );
  };

  /* 自定义音频消息 */
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [nowReadyAudioId, setNowReadyAudioId] = useState(null);
  const [audioPlayprogress, setAudioPlayprogress] = useState({});

  const playAudio = async audioMsg => {
    const {clientMsg_id, audio} = audioMsg;
    if (nowReadyAudioId === clientMsg_id) {
      return;
    }
    setNowReadyAudioId(clientMsg_id);
    await audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer
      .startPlayer(audio)
      .then(() => {
        setAudioIsPlaying(true);
      })
      .catch(error => {
        console.error(error);
        showToast('无法播放音频', 'error');
      });
  };

  const renderMessageAudio = props => {
    const audioMsg = props.currentMessage;
    return (
      <AudioMsg
        Msg={audioMsg}
        OnPress={() => {
          playAudio(audioMsg);
        }}
        OnLongPress={() => {
          Vibration.vibrate(50);
          setSavePath(audioMsg.audio);
          setIsInCameraRoll(false);
          setShowActionSheet(true);
        }}
        NowReadyAudioId={nowReadyAudioId}
        AudioPlayprogress={audioPlayprogress}
        AudioIsPlaying={audioIsPlaying}
        OnPause={() => {
          audioRecorderPlayer
            .pausePlayer()
            .then(() => setAudioIsPlaying(false));
        }}
        OnPlay={() => {
          audioRecorderPlayer
            .resumePlayer()
            .then(() => setAudioIsPlaying(true));
        }}
        OnValueChange={value => {
          audioRecorderPlayer.seekToPlayer(value);
        }}
      />
    );
  };

  /* 语音消息 */
  const [recordTime, setRecordTime] = useState(0);
  const [recordFlag, setRecordFlag] = useState('');
  const recorderVisible = useSharedValue(false);
  const isSureSend = useSharedValue(false);
  const isCancelSend = useSharedValue(false);
  const setRecordTimeValue = () => {
    recordTimer = setInterval(() => {
      setRecordTime(prevs => prevs + 1);
    }, 1000);
  };

  /* 显示语音录制弹窗 */
  const AnimatedRadioStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(recorderVisible.value ? 1 : 0),
      width: recorderVisible.value ? fullWidth : 0,
      height: recorderVisible.value ? fullHeight : 0,
    };
  });
  /* 显示确认/取消发送按钮 */
  const AnimatedButStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(recorderVisible.value ? 1 : 0),
      width: withSpring(recorderVisible.value ? 60 : 0),
      height: withSpring(recorderVisible.value ? 60 : 0),
    };
  });
  /* 滑动到确认/取消按钮样式 */
  const AnimatedSureBut = useAnimatedStyle(() => {
    return {
      backgroundColor: isSureSend.value ? '#52c41a' : '#bfbfbf',
    };
  });
  const AnimatedCancelBut = useAnimatedStyle(() => {
    return {
      backgroundColor: isCancelSend.value ? '#f5222d' : '#bfbfbf',
    };
  });

  /* 开始录制语音 */
  const startRecord = () => {
    if (!accessMicrophone) {
      showToast('请授予应用麦克风使用权限', 'warning');
      dispatch(requestMicrophonePermission());
      return;
    }
    Vibration.vibrate(50);
    audioRecorderPlayer
      .startRecorder()
      .then(res => {
        // console.log('startRecorder', res);
        setRecordTimeValue();
      })
      .catch(error => {
        console.error(error);
        recorderVisible.value = false;
        showToast('无法开始录制语音', 'error');
      });
  };

  /* 停止录制语音 */
  const stopRecord = () => {
    clearInterval(recordTimer);
    setRecordTime(0);
    audioRecorderPlayer
      .stopRecorder()
      .then(res => {
        if (recordFlag === 'sure') {
          // console.log('stopRecorder', res);
          sendMediaMsg([res], 'record');
        }
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setShowMore(false);
        isCancelSend.value = false;
        isSureSend.value = false;
        setRecordFlag('');
      });
  };

  // 手势动画
  const gesture = Gesture.Pan()
    .activateAfterLongPress(1000)
    .minDistance(10)
    .onStart(() => {
      // console.log('onBegin');
      recorderVisible.value = true;
      runOnJS(startRecord)();
    })
    .onUpdate(({translationX, translationY}) => {
      // console.log('onUpdate', translationX, translationY);
      if (
        translationX > 0 &&
        translationX < 70 &&
        translationY > -150 &&
        translationY < -90
      ) {
        isCancelSend.value = true;
        runOnJS(setRecordFlag)('cancel');
        return;
      }
      if (
        translationX > 90 &&
        translationX < 150 &&
        translationY > -70 &&
        translationY < 0
      ) {
        isSureSend.value = true;
        runOnJS(setRecordFlag)('sure');
        return;
      }
      isCancelSend.value = false;
      isSureSend.value = false;
      runOnJS(setRecordFlag)('');
    })
    .onEnd(({velocityX, velocityY}) => {
      // console.log('onEnd', velocityX, velocityY);
      recorderVisible.value = false;
      runOnJS(stopRecord)();
    });

  /* 自定义左侧按钮 */
  const [showMore, setShowMore] = useState(false);
  const rotate = useSharedValue('0deg');

  const rotateAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{rotate: rotate.value}],
    };
  });

  useEffect(() => {
    if (showMore) {
      rotate.value = withTiming('45deg', {
        easing: Easing.linear,
        duration: 300,
      });
    } else {
      rotate.value = withTiming('0deg', {
        easing: Easing.linear,
        duration: 300,
      });
    }
  }, [showMore]);

  const renderActions = () => {
    return (
      <View flexS center style={{marginBottom: fullHeight * 0.008}}>
        <TouchableOpacity
          onPress={() => {
            setShowMore(prev => {
              if (userInGroupInfo?.member_status === 'forbidden') {
                showToast('你已被禁言，无法使用!', 'error');
                return false;
              }
              if (uploadIds.length > 0) {
                showToast('请先等待当前消息发送完成', 'error');
                return false;
              }
              return !prev;
            });
          }}>
          <Animated.View style={rotateAnimatedStyle}>
            <Ionicons
              name="add-circle-outline"
              color={Colors.Primary}
              size={34}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  /* 自定义下方内容 */
  const renderAccessory = props => {
    return showMore ? (
      <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
        <View flexS row paddingT-8 paddingH-8 spread>
          <TouchableOpacity
            flexS
            centerH
            onPress={() => {
              showToast('长按开始说话', 'warning');
            }}>
            <GestureHandlerRootView>
              <GestureDetector gesture={gesture}>
                <View
                  flexS
                  center
                  backgroundColor={Colors.Primary}
                  style={styles.radioBut}>
                  <FontAwesome
                    name="microphone"
                    color={Colors.white}
                    size={24}
                  />
                </View>
              </GestureDetector>
            </GestureHandlerRootView>
            <Text marginT-4 text90L grey30>
              语音
            </Text>
          </TouchableOpacity>
          <View flexS row>
            <TouchableOpacity
              flexS
              centerH
              onPress={() => {
                if (!accessCamera) {
                  showToast('请授予应用相机使用权限', 'warning');
                  dispatch(requestCameraPermission());
                  return;
                }
                ImagePicker.openCamera({
                  cropping: true,
                  mediaType: 'photo',
                  cropperActiveWidgetColor: Colors.Primary,
                })
                  .then(image => {
                    sendMediaMsg([image], 'camera');
                  })
                  .finally(() => {
                    setShowMore(false);
                  });
              }}>
              <View
                flexS
                center
                backgroundColor={Colors.grey40}
                style={styles.otherBut}>
                <FontAwesome name="camera" color={Colors.white} size={20} />
              </View>
              <Text marginT-4 text90L grey30>
                拍照
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              flexS
              centerH
              marginL-16
              onPress={() => {
                if (!accessCamera) {
                  showToast('请授予应用相机使用权限', 'warning');
                  dispatch(requestCameraPermission());
                  return;
                }
                ImagePicker.openCamera({
                  mediaType: 'video',
                })
                  .then(video => {
                    sendMediaMsg([video], 'camera');
                  })
                  .finally(() => {
                    setShowMore(false);
                  });
              }}>
              <View
                flexS
                center
                backgroundColor={Colors.blue40}
                style={styles.otherBut}>
                <FontAwesome
                  name="video-camera"
                  color={Colors.white}
                  size={24}
                />
              </View>
              <Text marginT-4 text90L grey30>
                录像
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              flexS
              centerH
              marginL-16
              onPress={() => {
                if (!accessFolder) {
                  showToast('请授予媒体使用权限', 'warning');
                  dispatch(requestFolderPermission());
                  return;
                }
                ImagePicker.openPicker({
                  cropping: true,
                  mediaType: 'photo',
                  cropperActiveWidgetColor: Colors.Primary,
                })
                  .then(image => {
                    sendMediaMsg([image], 'camera');
                  })
                  .finally(() => {
                    setShowMore(false);
                  });
              }}>
              <View
                flexS
                center
                backgroundColor={Colors.cyan40}
                style={styles.otherBut}>
                <FontAwesome name="image" color={Colors.white} size={24} />
              </View>
              <Text marginT-4 text90L grey30>
                图库
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              flexS
              centerH
              marginL-16
              onPress={() => {
                if (!accessFolder) {
                  showToast('请授予应用文件和媒体使用权限', 'warning');
                  dispatch(requestFolderPermission());
                  return;
                }
                DocumentPicker.pick({
                  type: [DocumentPicker.types.allFiles],
                  allowMultiSelection: true,
                })
                  .then(medias => {
                    // console.log('文件:', medias);
                    sendMediaMsg(medias, 'folder');
                  })
                  .finally(() => {
                    setShowMore(false);
                  });
              }}>
              <View
                flexS
                center
                backgroundColor={Colors.yellow40}
                style={styles.otherBut}>
                <FontAwesome
                  name="folder-open"
                  color={Colors.white}
                  size={24}
                />
              </View>
              <Text marginT-4 text90L grey30>
                文件
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    ) : null;
  };

  /* 其他状态 */
  const [showActionSheet, setShowActionSheet] = useState(false); // 显示保存文件系统消息
  const [savePath, setSavePath] = useState(''); // 需要保存的文件源路径
  const [isInCameraRoll, setIsInCameraRoll] = useState(true); // 是否保存到相册
  const [downloadProgress, setDownloadProgress] = useState(0); // 保存文件进度

  /* 保存文件 */
  const saveFile = async url => {
    setShowActionSheet(false);
    showToast('已开始保存文件...', 'success');
    const saveRes = await DownloadFile(
      url || savePath,
      getFileName(url || savePath),
      progress => {
        if (progress) {
          setDownloadProgress(progress);
        }
      },
      isInCameraRoll,
    );
    setDownloadProgress(0);
    if (saveRes) {
      showToast('文件已保存到' + saveRes, 'success');
    } else {
      showToast('保存失败', 'error');
    }
  };

  const shouldUpdateMessage = useCallback(
    (currentProps, prevProps) => {
      const {currentMessage} = currentProps;
      return (
        currentMessage.clientMsg_id === nowReadyAudioId ||
        currentMessage._id === nowSendId ||
        uploadIds.includes(currentMessage._id) ||
        uploadProgress > 0
      );
    },
    [nowReadyAudioId, nowSendId, uploadIds, uploadProgress],
  );

  return (
    <>
      <GiftedChat
        placeholder={
          userInGroupInfo?.member_status === 'forbidden'
            ? '您已被禁言!'
            : '开始聊天吧~'
        }
        locale={'zh-cn'}
        dateFormat={'MM/DD HH:mm'}
        timeFormat={'HH:mm'}
        renderDay={renderDay}
        messages={messages}
        text={msgText}
        onInputTextChanged={text => setMsgText(text)}
        minInputToolbarHeight={60}
        alignTop={true}
        showUserAvatar={chat_type === 'group'}
        showAvatarForEveryMessage={chat_type === 'group'}
        renderUsernameOnMessage={chat_type === 'group'}
        renderLoadEarlier={renderLoadEarlier}
        infiniteScroll={true}
        loadEarlier={!allLoaded}
        isLoadingEarlier={isLoadingEarlier}
        onLoadEarlier={onLoadEarlier}
        scrollToBottom={true}
        scrollToBottomComponent={scrollToBottomComponent}
        onLongPress={onLongPress}
        onPressAvatar={onAvatarPress}
        onLongPressAvatar={onLongPressAvatar}
        renderBubble={renderBubble}
        renderTicks={renderTicks}
        renderSend={renderSend}
        renderTime={() => {}}
        renderActions={renderActions}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderAccessory={renderAccessory}
        renderMessageImage={renderMessageImage}
        renderMessageVideo={renderMessageVideo}
        renderMessageAudio={renderMessageAudio}
        renderSystemMessage={renderSystemMessage}
        renderMessageText={renderFileMessage}
        onSend={onSend}
        shouldUpdateMessage={shouldUpdateMessage}
        textInputProps={{
          readOnly: userInGroupInfo?.member_status === 'forbidden',
        }}
        user={{
          _id: 1,
          avatar: STATIC_URL + userInfo?.user_avatar,
          name:
            chat_type === 'group'
              ? userInGroupInfo?.member_remark
              : userInfo?.user_name,
        }}
      />

      {/* 图片预览弹窗 */}
      <ImgModal
        Uri={nowImage}
        Visible={imageShow}
        OnClose={() => setImageShow(false)}
        IsSave={true}
        OnSave={url => {
          saveFile(url);
          setImageShow(false);
        }}
      />
      {/* 视频播放器 */}
      <VideoModal
        Uri={fullscreenUri}
        Visible={modalVisible}
        OnClose={() => {
          setFullscreenUri(null);
          setModalVisible(!modalVisible);
        }}
        OnPress={() => setModalVisible(false)}
        OnError={e => {
          showToast('视频加载失败', 'error');
          console.log(e);
        }}
      />

      {/* 语音录制弹窗 */}
      <Animated.View style={[AnimatedRadioStyles, styles.radioTips]}>
        <Card flexS padding-16 center width={160}>
          <ActivityIndicator color={Colors.Primary} size={24} />
          <Text grey30 marginT-4>
            倾听中... {recordTime}S
          </Text>
          {recordFlag === 'sure' ? (
            <Text green40 marginT-4>
              松手后发送
            </Text>
          ) : null}
          {recordFlag === 'cancel' ? (
            <Text red40 marginT-4>
              松手后取消发送
            </Text>
          ) : null}
        </Card>
      </Animated.View>
      <Animated.View
        style={[styles.cancelBut, AnimatedSureBut, AnimatedButStyles]}>
        <FontAwesome name="check" color={Colors.white} size={24} />
      </Animated.View>
      <Animated.View
        style={[styles.sureBut, AnimatedCancelBut, AnimatedButStyles]}>
        <FontAwesome name="remove" color={Colors.white} size={24} />
      </Animated.View>
      {/* 保存文件弹窗 */}
      <BaseSheet
        Title={'保存文件'}
        Visible={showActionSheet}
        SetVisible={setShowActionSheet}
        Actions={[
          {
            label: '保存到本地',
            color: Colors.Primary,
            onPress: () => saveFile(),
          },
        ]}
      />
      {/* @成员列表弹窗 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMebers}
        onRequestClose={() => {
          setShowMebers(!showMebers);
        }}>
        <View
          height={fullHeight * 0.5}
          width={fullWidth}
          style={styles.memeberDialog}>
          <View flexS row centerV spread padding-16>
            <Text grey30>请选择要@的成员</Text>
            <Button
              label={'取消'}
              size={'small'}
              color={Colors.blue30}
              link
              onPress={() => setShowMebers(!showMebers)}
            />
          </View>
          <FlatList
            data={groupMembers}
            keyExtractor={(item, index) => item + index}
            renderItem={({item, index}) => renderMemberList(item, index)}
          />
        </View>
      </Modal>
      {isLoadingEarlier && searchMsg_cid ? (
        <LoaderScreen
          message={'跳转中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  inputToolbarContainerStyle: {
    paddingRight: 6,
    paddingLeft: 10,
    paddingVertical: 8,
  },
  textInputStyle: {
    backgroundColor: Colors.$backgroundNeutral,
    borderRadius: 8,
    padding: 8,
    lineHeight: 22,
  },
  inputToolbarAccessoryStyle: {paddingLeft: 26},
  DayContainerStyle: {marginVertical: 20},
  DayTextStyle: {color: Colors.grey40, fontWeight: 'normal'},
  rightLine: {
    borderRightColor: Colors.grey40,
  },
  radioBut: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  otherBut: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  sureBut: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: 60,
    bottom: 140,
    borderRadius: 30,
    overflow: 'hidden',
  },
  cancelBut: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: 140,
    bottom: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  radioTips: {
    position: 'absolute',
    width: fullWidth,
    height: fullHeight,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  imageContainer: {
    width: '100%',
    height: '40%',
    bottom: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  fileContainer: {
    borderRadius: 8,
  },
  fileExt: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  dialogStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  memeberDialog: {
    backgroundColor: Colors.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export default Chat;
