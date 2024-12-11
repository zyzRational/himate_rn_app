import React, {useEffect, useCallback, useState} from 'react';
import {ActivityIndicator, StyleSheet, Vibration, Modal} from 'react-native';
import {
  View,
  Button,
  Text,
  Colors,
  TouchableOpacity,
  AnimatedScanner,
  Card,
  Slider,
  LoaderScreen,
  Avatar,
  Image,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
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
} from '../../../utils/chatHandle';
import {setIsPlaySound} from '../../../stores/store-slice/settingStore';
import {setNowSessionId} from '../../../stores/store-slice/chatMsgStore';
import {
  deepClone,
  getfileFormdata,
  getDocumentfileFormdata,
  createRandomNumber,
  getRecordfileFormdata,
  formatSeconds,
  getFileName,
  getFileExt,
  getFileColor,
} from '../../../utils/base';
import {UploadFile} from '../../../api/upload';
import Video from 'react-native-video';
import VideoPlayer from 'react-native-video-controls';
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
} from 'react-native-reanimated';
import {fullWidth, fullHeight} from '../../../styles';
import {DownloadFile} from '../../../utils/Download';
import BaseSheet from '../../../components/commom/BaseSheet';
import {
  requestCameraPermission,
  requestMicrophonePermission,
  requestFolderPermission,
} from '../../../stores/store-slice/permissionStore';
import {cancelNotification} from '../../../utils/MsgNotification';
import {createRandomSecretKey, encryptAES} from '../../../utils/cryptoHandle';
import ImageViewer from 'react-native-image-zoom-viewer';

const audioRecorderPlayer = new AudioRecorderPlayer();
let recordTimer = null;

const Chat = ({navigation, route}) => {
  const {session_id, chat_type, clientMsgId} = route.params;

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
        }
      });
    });
    return () => {
      dispatch(setIsPlaySound(true));
      dispatch(setNowSessionId(''));
      setSearchMsgCId(null);
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
    setMessages(previousMessages => {
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
    setMessages(prevMsgs => {
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
  const onSend = useCallback(async (messages = []) => {
    setMessages(previousMessages =>
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
  }, []);

  /* 本地消息分页 */
  const [page, setPage] = useState(1);
  const [localMsgList, setLocalMsgList] = useState([]);
  const [localMsgCount, setLocalMsgCount] = useState(0);
  const [flatListRef, setFlatListRef] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(false); // 加载显示
  const [startIndex, setStartIndex] = useState(0); // 开始索引
  const [lastMsg, setLastMsg] = useState(null); // 结束索引的消息
  const [searchMsgCId, setSearchMsgCId] = useState(clientMsgId); // 搜索消息id
  const getNowPageMsg = (list, newpage) => {
    setLoadingMsg(true);
    const endIndex = newpage * 100;
    if (searchMsgCId) {
      for (let i = 0; i < list.length; i++) {
        if (list[i] && list[i].clientMsg_id === searchMsgCId) {
          setStartIndex(i);
          setPage(Math.floor(i / 100) + 1);
          break;
        }
      }
    }
    setLastMsg(list[endIndex - 1]);
    const newList = list.slice(0, endIndex);
    return newList;
  };

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

  /* 加载本地消息 */
  useEffect(() => {
    setMessages([]);
    if (session_id) {
      const localMsg = getLocalMsg(realm, session_id);
      setLocalMsgList(localMsg.list);
      setLocalMsgCount(localMsg.count);
    }
  }, [session_id]);

  /* 滑动加载历史消息 */
  useEffect(() => {
    if (localMsgList.length > 0 && jionUsers.length > 0 && userInfo) {
      // console.log('加载历史消息:', localMsgList);
      addMsg(getNowPageMsg(localMsgList, page), jionUsers, userInfo.id, false);
    }
  }, [page, localMsgList, jionUsers, userInfo]);

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
          top: 4,
        }}
      />
    );
  };

  /* 自定义左侧按钮 */
  const [showMore, setShowMore] = useState(false);
  const renderActions = () => {
    return (
      <Button
        marginB-10
        size={Button.sizes.medium}
        round
        text40
        outlineColor={Colors.Primary}
        outline
        center
        iconSource={() => (
          <FontAwesome
            style={{transform: [{rotate: `${showMore ? '45deg' : '0deg'}`}]}}
            name="plus"
            color={Colors.Primary}
            size={18}
          />
        )}
        onPress={() => {
          if (showMore) {
            setShowMore(false);
          } else {
            if (uploadIds.length > 0) {
              showToast('请先等待当前消息发送完成!', 'warning');
              return;
            }
            if (userInGroupInfo.member_status === 'forbidden') {
              showToast('你已被禁言，无法使用!', 'error');
              return;
            }
            setShowMore(true);
          }
        }}
      />
    );
  };

  /* 自定义输入框容器 */
  const renderInputToolbar = props => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          paddingRight: 6,
          paddingLeft: 10,
          paddingVertical: 8,
        }}
        accessoryStyle={{height: 80, paddingLeft: 26}}></InputToolbar>
    );
  };

  /* 自定义输入框 */
  const renderComposer = props => {
    return (
      <Composer
        {...props}
        textInputStyle={{
          backgroundColor: Colors.$backgroundNeutral,
          borderRadius: 8,
          padding: 8,
          lineHeight: 22,
        }}></Composer>
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
        padding-12
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
  useEffect(() => {
    if (chat_type === 'group' && msgText.endsWith('@')) {
      setShowMebers(true);
    }
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
        textStyle={{color: Colors.grey2030}}
        activityIndicatorColor={Colors.Primary}></LoadEarlier>
    );
  };

  /* 自定义时间 */
  const renderDay = props => {
    return (
      <Day
        {...props}
        containerStyle={{marginTop: 20, marginBottom: 20}}
        textStyle={{color: Colors.grey40, fontWeight: 400}}></Day>
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
        chat_type: chat_type,
        msg_type: message.msg_type || 'text',
        msg_status: 'unread',
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
              color={Colors.white}
              size={11}
            />
            &nbsp;未发送
          </Text>
        </View>
      );
    }
    if (message.msg_type && message.msg_type !== 'text') {
      if (nowSendId === message._id) {
        return (
          <View flexG row center marginT-4>
            <ActivityIndicator color={Colors.Primary} size={14} />
            <Text marginL-4 grey30 text100L>
              发送中...{uploadProgress.toFixed(0)}%
            </Text>
          </View>
        );
      }
      if (uploadIds.includes(message._id)) {
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
                  setMessages(previousMessages => {
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
      <>
        {downloadProgress > 0 ? (
          <View center padding-4>
            <Text text90L grey40>
              {props.currentMessage.text + downloadProgress + '%'}
            </Text>
          </View>
        ) : null}
      </>
    );
  };

  /* 跳转到指定消息 */
  const onMessagePress = message => {
    if (lastMsg && message.clientMsg_id === lastMsg.clientMsg_id) {
      setLoadingMsg(false);
    }
    if (searchMsgCId) {
      if (message.clientMsg_id === searchMsgCId) {
        setTimeout(() => {
          flatListRef?.scrollToIndex({
            index: startIndex,
            animated: true, // 滚动时是否使用动画
            viewOffset: 0, // 相对于指定item顶部的偏移量，默认为0
          });
          setSearchMsgCId(null);
        }, 100);
      }
    }
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
      <View
        onLayout={() => {
          onMessagePress(props.currentMessage);
        }}>
        <MessageText {...props} />
      </View>
    );
  };

  /* 自定义图片消息 */
  const [imageShow, setImageShow] = useState(false);
  const [nowImage, setNowImage] = useState('');
  const renderMessageImage = props => {
    return (
      <TouchableOpacity
        onPress={() => {
          setImageShow(true);
          setNowImage(props.currentMessage?.originalImage);
        }}
        onLongPress={() => {
          Vibration.vibrate(50);
          setIsInCameraRoll(true);
          setSavePath(props.currentMessage?.originalImage);
          setShowActionSheet(true);
        }}>
        {props.currentMessage._id === nowSendId ||
        uploadIds.includes(props.currentMessage._id) ? (
          <AnimatedScanner
            progress={
              props.currentMessage._id === nowSendId ? uploadProgress : 0
            }
            duration={1200}
            backgroundColor={Colors.white}
            opacity={0.7}
          />
        ) : null}
        <Image
          style={styles.image}
          source={{uri: props.currentMessage.image}}
        />
      </TouchableOpacity>
    );
  };

  /* 处理视频状态 */
  const [modalVisible, setModalVisible] = useState(false);
  const [fullscreenUri, setFullscreenUri] = useState(null);
  const [successVideoIds, setSuccessVideoIds] = useState([]);
  const [videoDuration, setVideoDuration] = useState([]);
  const [ErrorVideoIds, setErrorVideoIds] = useState([]);
  const handleVideoLoad = useCallback((videoMsg, duration) => {
    setSuccessVideoIds(prevs => {
      if (prevs.includes(videoMsg.clientMsg_id)) {
        return prevs;
      } else {
        return [...prevs, videoMsg.clientMsg_id];
      }
    });
    setVideoDuration(prevs => {
      if (prevs.find(item => item.cMsgId === videoMsg.clientMsg_id)) {
        return prevs;
      } else {
        return [...prevs, {cMsgId: videoMsg.clientMsg_id, duration}];
      }
    });
  }, []);

  /* 自定义视频消息 */
  const renderMessageVideo = props => {
    const videoMsg = props.currentMessage;
    if (videoMsg.video) {
      return (
        <View padding-4>
          <Video
            style={styles.video}
            source={{uri: videoMsg.video}}
            resizeMode="cover"
            paused={true}
            bufferConfig={{
              minBufferMs: 190,
              maxBufferMs: 200,
              bufferForPlaybackMs: 180,
              bufferForPlaybackAfterRebufferMs: 180,
            }}
            onLoad={e => {
              // console.log('onLoad', e);
              handleVideoLoad(videoMsg, e.duration);
            }}
            onBuffer={e => {
              // console.log('onBuffer', e);
            }}
            onError={error => {
              // console.log('onError', error);
              setErrorVideoIds(prevs => {
                if (prevs.includes(videoMsg.clientMsg_id)) {
                  return prevs;
                } else {
                  return [...prevs, videoMsg.clientMsg_id];
                }
              });
            }}
          />
          {successVideoIds.includes(videoMsg.clientMsg_id) ? (
            <TouchableOpacity
              style={styles.videoControl}
              onLongPress={() => {
                Vibration.vibrate(50);
                setIsInCameraRoll(true);
                setSavePath(videoMsg.video);
                setShowActionSheet(true);
              }}
              onPress={() => {
                setFullscreenUri(videoMsg.video);
                setModalVisible(true);
              }}>
              <AntDesign name="playcircleo" color={Colors.white} size={32} />
              <Text style={styles.videoTime}>
                {formatSeconds(
                  videoDuration.find(
                    item => item.cMsgId === videoMsg.clientMsg_id,
                  ).duration,
                )}
              </Text>
            </TouchableOpacity>
          ) : ErrorVideoIds.includes(videoMsg.clientMsg_id) ? (
            <View style={styles.videoControl}>
              <Text text90L white>
                视频加载失败
              </Text>
            </View>
          ) : (
            <View style={styles.videoControl}>
              <ActivityIndicator color={Colors.white} />
            </View>
          )}
          {videoMsg._id === nowSendId || uploadIds.includes(videoMsg._id) ? (
            <AnimatedScanner
              progress={videoMsg._id === nowSendId ? uploadProgress : 0}
              duration={1200}
              backgroundColor={Colors.white}
              opacity={0.7}
            />
          ) : null}
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
    width.value = withSpring('auto');
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

  const width = useSharedValue('auto');
  const renderMessageAudio = props => {
    const audioMsg = props.currentMessage;
    if (audioMsg.audio) {
      return (
        <Animated.View style={{...styles.audioBut, width}}>
          <TouchableOpacity
            onPress={() => playAudio(audioMsg)}
            onLongPress={() => {
              Vibration.vibrate(50);
              setSavePath(audioMsg.audio);
              setIsInCameraRoll(false);
              setShowActionSheet(true);
            }}
            row
            centerV
            paddingV-6
            paddingH-12>
            {nowReadyAudioId === audioMsg.clientMsg_id ? (
              <>
                {audioIsPlaying ? (
                  <TouchableOpacity
                    onPress={() => {
                      audioRecorderPlayer
                        .pausePlayer()
                        .then(() => setAudioIsPlaying(false));
                    }}>
                    <AntDesign
                      name="pausecircle"
                      color={
                        audioMsg.user._id === 1 ? Colors.Primary : Colors.grey10
                      }
                      size={20}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      audioRecorderPlayer
                        .startPlayer()
                        .then(() => setAudioIsPlaying(true));
                    }}>
                    <AntDesign
                      name="playcircleo"
                      color={
                        audioMsg.user._id === 1 ? Colors.Primary : Colors.grey10
                      }
                      size={20}
                    />
                  </TouchableOpacity>
                )}
                <View row centerV marginL-8>
                  <View style={styles.audioProgress}>
                    <Slider
                      thumbStyle={styles.audioThumb}
                      value={audioPlayprogress?.currentPosition}
                      minimumValue={0}
                      maximumValue={audioPlayprogress?.duration}
                      minimumTrackTintColor={Colors.Primary}
                      onValueChange={value => {
                        audioRecorderPlayer.seekToPlayer(value);
                      }}
                    />
                  </View>
                  <Text marginL-4 grey30 text90L>
                    {Math.round(audioPlayprogress?.duration / 1000)}s
                  </Text>
                </View>
              </>
            ) : (
              <FontAwesome
                name="volume-down"
                color={audioMsg.user._id === 1 ? Colors.Primary : Colors.grey10}
                size={24}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
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

  /* 自定义下方内容 */
  const AnimatedAccessoryStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showMore ? 1 : 0),
    };
  });
  const renderAccessory = props => {
    return (
      <Animated.View style={AnimatedAccessoryStyles}>
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
                  mediaType: 'photo',
                })
                  .then(image => {
                    sendMediaMsg([image], 'camera');
                  })
                  .finally(setShowMore(false));
              }}>
              <View
                flexS
                center
                backgroundColor={Colors.success}
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
                  .finally(setShowMore(false));
              }}>
              <View
                flexS
                center
                backgroundColor={Colors.blue30}
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
                  showToast('请授予应用文件和媒体使用权限', 'warning');
                  dispatch(requestFolderPermission());
                  return;
                }
                DocumentPicker.pick({
                  type: [DocumentPicker.types.allFiles],
                  allowMultiSelection: true,
                })
                  .then(medias => {
                    console.log('文件:', medias);
                    sendMediaMsg(medias, 'folder');
                  })
                  .finally(setShowMore(false));
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
    );
  };

  /* 其他状态 */
  const [showActionSheet, setShowActionSheet] = useState(false); // 显示保存文件系统消息
  const [savePath, setSavePath] = useState(''); // 需要保存的文件源路径
  const [isInCameraRoll, setIsInCameraRoll] = useState(true); // 是否保存到相册
  const [downloadProgress, setDownloadProgress] = useState(0); // 保存文件进度

  /* 保存文件 */
  const saveFile = async url => {
    setShowActionSheet(false);
    addSystemMsg('正在保存... ');
    const res = await DownloadFile(
      url || savePath,
      getFileName(url || savePath),
      progress => {
        const progressPercent = Math.round(
          (progress.bytesWritten / progress.contentLength) * 100,
        );
        setDownloadProgress(progressPercent);
      },
      isInCameraRoll,
    );
    setDownloadProgress(0);
    if (res.statusCode === 200) {
      showToast('保存成功', 'success');
    } else {
      showToast('保存失败', 'error');
    }
  };

  return (
    <>
      <GiftedChat
        messageContainerRef={Ref => setFlatListRef(Ref)}
        placeholder={
          userInGroupInfo.member_status === 'forbidden'
            ? '您已被禁言!'
            : '开始聊天吧~'
        }
        dateFormat={'MM-DD HH:mm:ss'}
        renderDay={renderDay}
        messages={messages}
        text={msgText}
        onInputTextChanged={text => setMsgText(text)}
        minInputToolbarHeight={60}
        alignTop={true}
        showUserAvatar={chat_type === 'group'}
        showAvatarForEveryMessage={chat_type === 'group'}
        renderUsernameOnMessage={chat_type === 'group'}
        loadEarlier={messages.length < localMsgCount}
        renderLoadEarlier={renderLoadEarlier}
        infiniteScroll={true}
        isLoadingEarlier={loadingMsg}
        onLoadEarlier={() => {
          setPage(previousPages => {
            if (previousPages * 100 >= localMsgCount) {
              showToast('没有更多消息了', 'warning', true);
              return previousPages;
            }
            return previousPages + 1;
          });
        }}
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
        renderAccessory={showMore ? renderAccessory : null}
        renderMessageImage={renderMessageImage}
        renderMessageVideo={renderMessageVideo}
        renderMessageAudio={renderMessageAudio}
        renderSystemMessage={renderSystemMessage}
        renderMessageText={renderFileMessage}
        onSend={msgs => onSend(msgs)}
        shouldUpdateMessage={(curProps, nextProps) => {
          const clientMsg_id = curProps.currentMessage.clientMsg_id;
          const message_id = curProps.currentMessage._id;
          return (
            successVideoIds.length ||
            successVideoIds.includes(clientMsg_id) ||
            ErrorVideoIds.includes(clientMsg_id) > 0 ||
            nowSendId === message_id ||
            uploadIds.includes(message_id) ||
            nowReadyAudioId !== null ||
            downloadProgress > 0
          );
        }}
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
      <Modal visible={imageShow} transparent={true}>
        <ImageViewer
          imageUrls={[{url: nowImage}]}
          onClick={() => {
            setImageShow(false);
          }}
          menuContext={{saveToLocal: '保存到本地', cancel: '取消'}}
          onSave={url => {
            saveFile(url);
            setImageShow(false);
          }}
          loadingRender={() => (
            <View flex center>
              <ActivityIndicator color="white" size="large" />
              <Text center grey70 text90 marginT-8>
                图片加载中...
              </Text>
            </View>
          )}
          renderFooter={() => (
            <View flex center row padding-16 style={{width: fullWidth}}>
              <Text center grey70 text90>
                长按保存图片，单击退出预览
              </Text>
            </View>
          )}
        />
      </Modal>
      {/* 视频播放器 */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setFullscreenUri(null);
          setModalVisible(!modalVisible);
        }}>
        <VideoPlayer
          source={{uri: fullscreenUri}}
          toggleResizeModeOnFullscreen={false}
          disableFullscreen={true}
          onBack={() => {
            setFullscreenUri(null);
            setModalVisible(!modalVisible);
          }}
        />
      </Modal>
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
      {loadingMsg && searchMsgCId ? (
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
  image: {
    width: 150,
    height: 100,
    borderRadius: 12,
    margin: 3,
    resizeMode: 'cover',
  },
  video: {
    width: 150,
    height: 270,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  videoControl: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 4,
    left: 4,
    borderRadius: 12,
  },
  videoTime: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: Colors.white,
    fontSize: 12,
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
  audioBut: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    marginVertical: 4,
  },
  audioProgress: {
    width: 50,
  },
  audioThumb: {
    width: 1,
    backgroundColor: Colors.red30,
    borderWidth: 1,
    borderColor: Colors.red30,
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
