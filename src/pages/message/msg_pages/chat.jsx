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
import {audioExtNames} from '../../../constants/baseConst';
import VideoModal from '../../../components/commom/VideoModal';
import ImgModal from '../../../components/commom/ImgModal';
import VideoMsg from '../../../components/message/VideoMsg';
import ImageMsg from '../../../components/message/ImageMsg';
import AudioMsg from '../../../components/message/AudioMsg';
import 'dayjs/locale/zh-cn';

const audioRecorderPlayer = new AudioRecorderPlayer();
let recordTimer = null;

const Chat = ({navigation, route}) => {
  const {session_id, chat_type, searchMsg_cid} = route.params;

  const flatListRef = useRef(null);

  const dispatch = useDispatch();
  const {showToast} = useToast();
  const {socket} = useSocket();
  const realm = useRealm();
  const userInfo = useSelector(state => state.userStore.userInfo);
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

  const [cahtMessages, setChatMessages] = useState([]);

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
  const [sId, setSId] = useState(null); // session id
  const [jionUsers, setJionUsers] = useState(getLocalUser(realm) || []);
  const getUnreadMsg = async (sessionId, chatType, user_info) => {
    const {id: userId, user_name, user_avatar} = user_info || {};
    try {
      const unreadRes = await getSessionDetail({
        session_id: sessionId,
        chat_type: chatType,
        msg_status: 'unread',
      });
      if (unreadRes.success) {
        const {id, msgs, mate, group} = unreadRes.data;
        setSId(id);

        //将消息格式化，向服务器发送已读消息
        const newlist = [];
        msgs.forEach(item => {
          if (item.send_uid !== userId) {
            readMsg(item.id, id, userId);
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
          if (userId === apply_uid) {
            joinUserList.push(
              ...[
                formatJoinUser(
                  agree_uid,
                  agree_remark,
                  agree_avatar,
                  session_id,
                ),
                formatJoinUser(userId, user_name, user_avatar, session_id),
              ],
            );
            route.params.to_uid = agree_uid;
          }
          if (userId === agree_uid) {
            joinUserList.push(
              ...[
                formatJoinUser(
                  apply_uid,
                  apply_remark,
                  apply_avatar,
                  session_id,
                ),
                formatJoinUser(userId, user_name, user_avatar, session_id),
              ],
            );
            route.params.to_uid = apply_uid;
          }
        }
        if (chat_type === 'group') {
          setGroupMembers(group.members);
          const selfInfo = group.members.find(
            item => item.member_uid === userId,
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
        addMsg(newlist, joinUserList, userId);
        setLocalMsg(realm, newlist);

        // 同步本地缓存用户信息
        setJionUsers(joinUserList);
        addOrUpdateLocalUser(realm, joinUserList);
        // 加载完成
        setIsLoadingComplete(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*  添加消息  */
  const addMsg = (msgList, userList, userId, isNew = true) => {
    setChatMessages(previousMessages => {
      const newList = deepClone(msgList);
      const needList = [];
      newList?.forEach(msg => {
        if (!previousMessages.find(item => item._id === msg._id)) {
          const needUser = userList.find(
            ele => ele.uid === msg.send_uid && ele.session_id === session_id,
          );
          if (msg.msg_type === 'image') {
            msg.image = `${THUMBNAIL_URL}${msg.text}`;
            msg.originalImage = `${STATIC_URL}${msg.text}`;
            msg.text = null;
          }
          if (msg.msg_type === 'video') {
            msg.video = `${STATIC_URL}${msg.text}`;
            msg.text = null;
          }
          if (msg.msg_type === 'audio') {
            msg.audio = `${STATIC_URL}${msg.text}`;
            msg.text = null;
          }
          if (msg.msg_type === 'other') {
            msg.filePath = `${STATIC_URL}${msg.text}`;
            msg.text = getFileExt(msg.text);
          }
          if (needUser) {
            msg.user = {};
            msg.user._id = userId === msg.send_uid ? 1 : 2;
            msg.user.avatar = STATIC_URL + needUser?.avatar;
            msg.user.name = needUser?.remark;
            msg.user.uid = needUser.uid;
            needList.push(msg);
          }
        }
      });
      return GiftedChat.append(previousMessages, [...needList], isNew);
    });
  };

  /* 添加系统消息 */
  const addSystemMsg = msg => {
    const newMsg = {
      text: msg,
      system: true,
      _id: Date.now().toString(),
      createdAt: new Date(),
    };
    setChatMessages(prevMsgs => {
      if (prevMsgs.find(item => item.system === true)) {
        return prevMsgs;
      }
      return GiftedChat.append(prevMsgs, [newMsg]);
    });
  };

  /* 发送消息 */
  const [failMsgList, setFailMsgList] = useState([]);
  const sendMsg = async (message, msg_type = 'text', isReSend = false) => {
    const baseMsg = {
      sId,
      session_id,
      send_uid: userInfo?.id,
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
        socket?.emit('chat', baseMsg, res => {
          // console.log('chat msg', res);
          if (res.success) {
            resolve(res.data);
          } else {
            showToast(res.message, 'error');
            reject(new Error('发送失败'));
          }
        });
      } else {
        showToast('socket 未连接', 'error');
        reject(new Error('socket 未连接'));
      }
    });
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

  /* 添加为待上传的媒体消息 */
  const addUploadIds = useCallback((Msgs = []) => {
    const newIds = [];
    Msgs.forEach(item => {
      if (item?.msg_type && item?.msg_type !== 'text') {
        newIds.push(item._id);
      }
    });
    setUploadIds(prevIds => [...prevIds, ...newIds]);
  }, []);
  /* 上传完毕移除 */
  const removeUploadIds = useCallback(message_id => {
    setUploadIds(prevIds => prevIds.filter(id => id !== message_id));
  }, []);

  const [nowSendId, setNowSendId] = useState(null);
  const [uploadIds, setUploadIds] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  /* 本地发送 */
  const onSend = useCallback(
    async (messages = []) => {
      setChatMessages(previousMessages =>
        GiftedChat.append(previousMessages, messages),
      );
      addUploadIds(messages);
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const msgType = message?.msg_type;
        let msgContent = message.text;
        if (msgType && msgType !== 'text') {
          setNowSendId(message._id);
          const res = await UploadFile(
            message.file,
            value => {
              setUploadProgress(value);
            },
            {uid: userInfo?.id, fileType: msgType, useType: 'chat'},
          );
          setNowSendId(null);
          removeUploadIds(message._id);
          setUploadProgress(0); // 重置媒体消息进度
          const upRes = JSON.parse(res.text());
          if (upRes.success) {
            msgContent = upRes.data.file_name;
          } else {
            continue;
          }
        }
        sendMsg(msgContent, msgType)
          .then(async reslut => {
            const msg = formatMsg(reslut);
            setLocalMsg(realm, [msg]);
          })
          .catch(error => {
            setFailMsgList(previousFailMsgIds => [
              ...previousFailMsgIds,
              message._id,
            ]);
            console.log(error);
          });
      }
    },
    [setChatMessages],
  );

  /* 媒体消息 */
  const sendMediaMsg = (medias, sourceType) => {
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
              ? userInGroupInfo.member_remark
              : userInfo.user_name,
          avatar: STATIC_URL + userInfo.user_avatar,
        },
      };
      if (media_type === 'image') {
        mediaMsg.image = mediaRes.uri;
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
      mediaMsgs.unshift(mediaMsg);
    }
    onSend(mediaMsgs);
  };

  /* 本地消息分页 */
  const [page, setPage] = useState(0);
  const [localMsgList, setLocalMsgList] = useState([]);
  const [localMsgCount, setLocalMsgCount] = useState(0);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false); // 是否正在加载早期消息
  const [allLoaded, setAllLoaded] = useState(false); // 是否全部加载完毕
  const [startIndex, setStartIndex] = useState(0); // 开始索引
  const [lastMsg, setLastMsg] = useState(null); // 结束索引的消息

  // 加载更早的消息
  const onLoadEarlier = useCallback(async () => {
    console.log(111111);

    if (isLoadingEarlier || allLoaded) {
      return;
    }
    setIsLoadingEarlier(true);
    try {
      const olderMessages = getNowPageMsg(page + 1);
      if (olderMessages.length === 0) {
        setAllLoaded(true);
        return;
      }
      addMsg(olderMessages, jionUsers, userInfo.id, false);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('加载历史消息失败:', error);
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [page, isLoadingEarlier, allLoaded, jionUsers, userInfo?.id]);

  // 获取本页消息
  const pageSize = 20;
  const getNowPageMsg = useCallback(
    (_page, cid) => {
      const start = _page * pageSize;
      const end = start + pageSize;
      return Array.from(localMsgList.slice(start, end));
    },
    [localMsgList],
  );

  /* 加载本地消息*/
  useEffect(() => {
    setChatMessages([]);
    if (session_id) {
      const localMsg = getLocalMsg(realm, session_id);
      const {count, list} = localMsg || {};
      setLocalMsgList(list);
      setLocalMsgCount(count);
      // 重置页码
      setPage(0);
    }
  }, [session_id]);

  /* 首次加载消息 */
  useEffect(() => {
    if (jionUsers.length > 0 && userInfo?.id) {
      const moreMsg = getNowPageMsg(0, searchMsg_cid);
      addMsg(localMsgList, jionUsers, userInfo.id, false);
    }
  }, [localMsgList,jionUsers, userInfo, searchMsg_cid]);

  /* 监听接受的消息 */
  useEffect(() => {
    if (acceptMsgData?.id && sId && userInfo && jionUsers) {
      if (acceptMsgData.session_id !== session_id) {
        return;
      }
      const {id: msgId, send_uid, isReSend} = acceptMsgData || {};
      const msg = formatMsg(acceptMsgData);
      if (isLoadingComplete && (send_uid !== userInfo.id || isReSend)) {
        addMsg([msg], jionUsers, userInfo.id);
      }
      setLocalMsg(realm, [msg]);
      readMsg(msgId, sId, userInfo.id);
    }
  }, [
    acceptMsgData?.id,
    session_id,
    sId,
    jionUsers,
    userInfo,
    isLoadingComplete,
  ]);

  /* 首次加载未读消息 */
  useEffect(() => {
    if (userInfo && session_id && chat_type) {
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

  /* 自定义滚动到底部 */
  const scrollToBottomComponent = () => {
    return (
      <View>
        <Ionicons name="chevron-down" color={Colors.Primary} size={24} />
      </View>
    );
  };

  /* 点击头像 */
  const onAvatarPress = User => {
    navigation.navigate('Mateinfo', {
      uid: User.uid,
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

  /* 自定义消息状态 */
  const renderTicks = message => {
    if (failMsgList.includes(message._id)) {
      const newMsg = {
        _id: createRandomNumber(),
        clientMsg_id: String(message._id),
        session_id: session_id,
        send_uid: userInfo.id,
        text: message.text,
        chat_type: chat_type,
        msg_type: message.msg_type || 'text',
        msg_status: 'unread',
        createdAt: message.createdAt,
        status: 'failed',
      };
      setLocalMsg(realm, [newMsg]);
    }
    if (failMsgList.includes(message._id) || message.status === 'failed') {
      return (
        <View flexS>
          <Text text100L white center>
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
    if (message.msg_type && message.msg_type !== 'text') {
      if (uploadIds.includes(message._id) && nowSendId === message._id) {
        return (
          <View flexG row center marginT-4>
            <ActivityIndicator color={Colors.Primary} size={14} />
            <Text marginL-4 grey30 text100L>
              发送中...{uploadProgress.toFixed(0)}%
            </Text>
          </View>
        );
      }
      if (uploadIds.includes(message._id) && nowSendId !== message._id) {
        return (
          <View flexG row center marginT-4>
            <Text marginL-4 grey30 text100L>
              等待发送
            </Text>
          </View>
        );
      }
    }
  };

  /* 自定义长按消息 */
  const onLongPress = (context, currentMessage) => {
    if (currentMessage.msg_type === 'text') {
      Vibration.vibrate(50);
      let options = ['复制消息', '取消'];
      const cancelButtonIndex = options.length - 1;
      if (
        failMsgList.includes(currentMessage._id) ||
        currentMessage.status === 'failed'
      ) {
        options.unshift('重新发送');
      }
      context.actionSheet().showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        buttonIndex => {
          if (
            (failMsgList.includes(currentMessage._id) ||
              currentMessage.status === 'failed') &&
            buttonIndex === 0
          ) {
            sendMsg(currentMessage?.text, 'text', true)
              .then(res => {
                if (res) {
                  setChatMessages(previousMessages => {
                    const filteredItems = previousMessages.filter(
                      item => item.clientMsg_id !== currentMessage.clientMsg_id,
                    );
                    return GiftedChat.append(filteredItems, []);
                  });
                  const toDelete = realm
                    .objects('ChatMsg')
                    .filtered(
                      'clientMsg_id == $0',
                      currentMessage.clientMsg_id,
                    );
                  realm.write(() => {
                    realm.delete(toDelete);
                  });
                }
              })
              .catch(error => {
                console.log(error);
              });
            return;
          } else if (buttonIndex === 0) {
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

  /* 跳转到指定消息 */
  useEffect(() => {}, [flatListRef?.current]);

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
            if (audioExtNames.includes(fileMsg.text)) {
              setFullscreenUri(fileMsg.filePath);
              setModalVisible(true);
            } else if (fileMsg.text === 'pdf') {
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
    if (videoMsg?.video) {
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
    }
  };

  /* 自定义音频消息 */
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [nowReadyAudioId, setNowReadyAudioId] = useState(null);
  const [audioPlayprogress, setAudioPlayprogress] = useState({});
  const playAudio = audioMsg => {
    const {clientMsg_id, audio} = audioMsg;
    if (nowReadyAudioId === clientMsg_id) {
      return;
    } else {
      audioRecorderPlayer.stopPlayer();
    }
    setNowReadyAudioId(clientMsg_id);
    audioRecorderPlayer
      .startPlayer(audio)
      .then(() => {
        setAudioIsPlaying(true);
      })
      .catch(error => {
        console.log(error);
        showToast('无法播放音频', 'error');
      });
  };

  const renderMessageAudio = props => {
    const audioMsg = props.currentMessage;
    if (audioMsg?.audio) {
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
    }
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
        console.log(error);
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
        console.log(error);
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
      if (uploadIds.length > 0) {
        showToast('请先等待当前消息发送完成!', 'warning');
        return;
      }
      if (userInGroupInfo.member_status === 'forbidden') {
        showToast('你已被禁言，无法使用!', 'error');
        return;
      }
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
            setShowMore(!showMore);
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

  /* 格式化时间 */
  const FormatCalendarObj = {
    sameDay: '[今天] HH:mm',
    lastDay: '[昨天] HH:mm',
    lastWeek: '[上周] DDDD HH:mm',
    sameElse: 'YYYY-MM-DD HH:mm',
  };

  return (
    <>
      <GiftedChat
        messageContainerRef={flatListRef}
        placeholder={
          userInGroupInfo.member_status === 'forbidden'
            ? '您已被禁言!'
            : '开始聊天吧~'
        }
        locale={'zh-cn'}
        dateFormat={'MM/DD HH:mm'}
        timeFormat={'HH:mm'}
        renderDay={renderDay}
        renderTime={() => null}
        dateFormatCalendar={FormatCalendarObj}
        messages={cahtMessages}
        text={msgText}
        onInputTextChanged={text => setMsgText(text)}
        minInputToolbarHeight={60}
        alignTop={true}
        showUserAvatar={chat_type === 'group'}
        showAvatarForEveryMessage={chat_type === 'group'}
        renderUsernameOnMessage={chat_type === 'group'}
        loadEarlier={!allLoaded}
        infiniteScroll={true}
        isLoadingEarlier={isLoadingEarlier}
        renderLoadEarlier={renderLoadEarlier}
        onLoadEarlier={onLoadEarlier}
        isScrollToBottomEnabled={true}
        scrollToBottomComponent={scrollToBottomComponent}
        onLongPress={onLongPress}
        onPressAvatar={onAvatarPress}
        onLongPressAvatar={onLongPressAvatar}
        renderBubble={renderBubble}
        renderTicks={renderTicks}
        renderSend={renderSend}
        renderActions={renderActions}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderAccessory={renderAccessory}
        renderMessageImage={renderMessageImage}
        renderMessageVideo={renderMessageVideo}
        renderMessageAudio={renderMessageAudio}
        renderSystemMessage={renderSystemMessage}
        renderMessageText={renderFileMessage}
        onSend={msgs => onSend(msgs)}
        textInputProps={{
          readOnly: userInGroupInfo.member_status === 'forbidden',
        }}
        user={{
          _id: 1,
          avatar: STATIC_URL + userInfo.user_avatar,
          name:
            chat_type === 'group'
              ? userInGroupInfo.member_remark
              : userInfo.user_name,
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
};

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
