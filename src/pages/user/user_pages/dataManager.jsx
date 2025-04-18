import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, Vibration} from 'react-native';
import {
  View,
  Checkbox,
  Button,
  TouchableOpacity,
  Image,
  Colors,
  LoaderScreen,
  Dialog,
  Card,
  Text,
  Badge,
  ProgressBar,
} from 'react-native-ui-lib';
import {useSelector, useDispatch} from 'react-redux';
import {
  getUserUploadFiles,
  getUserMsgList,
  delUserMsgs,
  delUserUploadFiles,
} from '../../../api/dataManager';
import dayjs from 'dayjs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import BaseSheet from '../../../components/commom/BaseSheet';
import {useToast} from '../../../components/commom/Toast';
import {DownloadFile} from '../../../utils/handle/fileHandle';
import {requestFolderPermission} from '../../../stores/store-slice/permissionStore';
import DocumentPicker from 'react-native-document-picker';
import {getDocumentfileFormdata} from '../../../utils/base';
import {
  UploadFile,
  getFileColor,
  getFileExt,
  getFileName,
} from '../../../utils/handle/fileHandle';
import {useRealm} from '@realm/react';
import {
  setLocalMsg,
  getLocalUser,
  formatMsg,
} from '../../../utils/handle/chatHandle';
import BaseDialog from '../../../components/commom/BaseDialog';
import {getStorage} from '../../../utils/Storage';
import Clipboard from '@react-native-clipboard/clipboard';
import BaseTopBar from '../../../components/commom/BaseTopBar';
import VideoModal from '../../../components/commom/VideoModal';
import ImgModal from '../../../components/commom/ImgModal';

const DataManager = ({navigation, route}) => {
  const userId = useSelector(state => state.userStore.userId);
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);

  // baseConfig
  const {STATIC_URL, THUMBNAIL_URL} = useSelector(
    state => state.baseConfigStore.baseConfig,
  );

  const dispatch = useDispatch();
  const realm = useRealm();

  const {showToast} = useToast();

  const [loading, setLoading] = useState(false);
  const getFilesList = async (uid, type) => {
    setLoading(true);
    let filePageNum = 1;
    if (type === 'chat') {
      filePageNum = chatPageNum;
    }
    if (type === 'user' || type === 'group') {
      filePageNum = avatarPageNum;
    }
    if (type === 'upload') {
      filePageNum = uploadPageNum;
    }
    try {
      const res = await getUserUploadFiles({
        upload_uid: uid,
        use_type: type,
        pageSize: filePageNum * 20,
      });
      if (res.success) {
        // console.log(res.data);
        if (type === 'chat') {
          setChatFilesList(res.data.list);
        }
        if (type === 'user') {
          setUserAvaterFilesList(res.data.list);
        }
        if (type === 'group') {
          setGroupAvaterFilesList(res.data.list);
        }
        if (type === 'upload') {
          setUploadFilesList(res.data.list);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 渲染文件图标
  const renderFileIcon = (type, name) => {
    return (
      <View
        center
        style={styles.fileIcon}
        backgroundColor={getFileColor(getFileExt(name))}>
        {type === 'video' ? (
          <FontAwesome name="file-video-o" color={Colors.white} size={32} />
        ) : type === 'audio' ? (
          <FontAwesome name="file-audio-o" color={Colors.white} size={32} />
        ) : type === 'other' ? (
          <Text white text70BO>
            {getFileExt(name).toUpperCase()}
          </Text>
        ) : null}
      </View>
    );
  };

  // 多选
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isAllSelect, setIsAllSelect] = useState(false);

  const [selectedFileItem, setSelectedFileItem] = useState([]);
  const [selectedMsgItem, setSelectedMsgItem] = useState([]);

  /* 点击操作 */
  const [modalVisible, setModalVisible] = useState(false);
  const [fullscreenUri, setFullscreenUri] = useState(null);
  const [imageShow, setImageShow] = useState(false);

  const clickFile = file => {
    const url = STATIC_URL + file.file_name;
    setFullscreenUri(url);
    if (file.file_type === 'image') {
      setImageShow(true);
    } else if (file.file_type === 'video' || file.file_type === 'audio') {
      setModalVisible(true);
    } else if (file.file_type === 'other' && file.file_name.endsWith('.pdf')) {
      navigation.navigate('PdfView', {url});
    } else {
      showToast('暂不支持预览，请下载后查看', 'warning');
    }
  };

  /* 长按操作 */
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedCloudMsg, setSelectedCloudMsg] = useState(null);
  const handleFile = (item, type) => {
    if (isMultiSelect) {
      return;
    }
    Vibration.vibrate(50);
    setShowActionSheet(true);

    setSelectedFileId(item.id);
    if (type === 'file') {
      setSavePath(STATIC_URL + item.file_name);
      if (item.file_type === 'image' || item.file_type === 'video') {
        setIsInCameraRoll(true);
      } else {
        setIsInCameraRoll(false);
      }
    }
    if (type === 'msg') {
      setSelectedCloudMsg(formatMsg(item));
    }
  };

  // 加载列表子组件
  const renderItem = (item, index) => {
    return (
      <TouchableOpacity
        padding-12
        row
        centerV
        bg-white
        backgroundColor={
          selectedFileId === item.id ? Colors.grey60 : Colors.white
        }
        onPress={() => {
          clickFile(item);
        }}
        onLongPress={() => {
          handleFile(item, 'file');
        }}>
        {isMultiSelect ? (
          <Checkbox
            marginR-12
            color={Colors.Primary}
            size={20}
            borderRadius={10}
            value={selectedFileItem.includes(item.id)}
            onValueChange={value => {
              if (value) {
                setSelectedFileItem(prevItem => {
                  const newItem = [...prevItem, item.id];
                  return newItem;
                });
              } else {
                setSelectedFileItem(prevItem => {
                  const newItem = prevItem.filter(id => id !== item.id);
                  return newItem;
                });
              }
            }}
          />
        ) : null}

        {item.file_type === 'image' ? (
          <Image
            style={styles.image}
            source={{
              uri: THUMBNAIL_URL + item.file_name,
            }}
          />
        ) : (
          renderFileIcon(item.file_type, item.file_name)
        )}
        <View width={isMultiSelect ? '72%' : '82%'}>
          <Text text70L numberOfLines={1} ellipsizeMode={'middle'}>
            {item.file_name}
          </Text>
          <View row marginT-4>
            <Text grey30>{(item.file_size / 1000000).toFixed(2)}M</Text>
            <Text marginL-8 grey30>
              {dayjs(item.create_time).format('MM月DD日 HH:mm')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 加载聊天记录列表子组件
  const matchInfoList = getLocalUser(realm) || [];
  const matchMsgInfo = (list, msgInfo) => {
    let originName = '';
    if (list.length === 0) {
      return '未知';
    }
    list.forEach(item => {
      if (item.session_id === msgInfo.session_id) {
        if (msgInfo.chat_type === 'group') {
          originName = item.session_name;
        }
        if (msgInfo.chat_type === 'personal') {
          if (item.uid !== msgInfo.send_uid) {
            originName = item.remark;
          }
        }
      }
    });
    return originName;
  };

  const renderMsgItem = (item, index) => {
    return (
      <TouchableOpacity
        padding-12
        row
        centerV
        style={styles.msgItem}
        backgroundColor={
          selectedFileId === item.id ? Colors.grey60 : Colors.white
        }
        onLongPress={() => {
          handleFile(item, 'msg');
        }}>
        {isMultiSelect ? (
          <Checkbox
            marginR-12
            color={Colors.Primary}
            size={20}
            borderRadius={10}
            value={selectedMsgItem.includes(item.id)}
            onValueChange={value => {
              if (value) {
                setSelectedMsgItem(prevItem => {
                  const newItem = [...prevItem, item.id];
                  return newItem;
                });
              } else {
                setSelectedMsgItem(prevItem => {
                  const newItem = prevItem.filter(id => id !== item.id);
                  return newItem;
                });
              }
            }}
          />
        ) : null}
        <View width={isMultiSelect ? '92%' : '100%'}>
          <Text numberOfLines={1} ellipsizeMode={'middle'}>
            {item.text}
          </Text>
          <View row spread>
            <Text text90L grey30>
              发送给 {matchMsgInfo(matchInfoList, item)}
            </Text>
          </View>
          <View row marginT-6 spread>
            <View row>
              <Badge
                backgroundColor={Colors.blue50}
                label={
                  item.chat_type === 'group'
                    ? '群聊'
                    : item.chat_type === 'personal'
                    ? '私聊'
                    : '未知'
                }
              />
              <View marginL-6>
                <Badge
                  backgroundColor={Colors.green50}
                  label={
                    item.msg_type === 'text'
                      ? '文字'
                      : item.msg_type === 'image'
                      ? '图片'
                      : item.msg_type === 'audio'
                      ? '语音'
                      : item.msg_type === 'video'
                      ? '视频'
                      : '未知'
                  }
                />
              </View>
              <View marginL-6>
                <Badge
                  backgroundColor={Colors.red50}
                  label={
                    item.msg_status === 'unread'
                      ? '未读'
                      : item.msg_status === 'read'
                      ? '已读'
                      : '未知'
                  }
                />
              </View>
              {item.msg_secret ? (
                <View marginL-6>
                  <Badge backgroundColor={Colors.orange50} label={'加密'} />
                </View>
              ) : null}
            </View>
            <Text marginL-8 text90 grey40>
              {dayjs(item.create_time).format('YYYY/MM/DD HH:mm:ss')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 聊天文件列表
  const [chatFilesList, setChatFilesList] = useState([]);
  const [chatPageNum, setChatPageNum] = useState(1);
  const ChatFilesScreen = (
    <FlatList
      data={chatFilesList}
      keyExtractor={(item, index) => item + index}
      onEndReached={() => {
        setChatPageNum(prev => prev + 1);
      }} // 加载更多
      ListEmptyComponent={
        <View marginT-16 center>
          <Text text90L grey40>
            还没有聊天文件~
          </Text>
        </View>
      }
      renderItem={({item, index}) => renderItem(item, index)}
      ListFooterComponent={<View marginB-140 />}
    />
  );

  // 头像文件列表
  const [userAvaterFilesList, setUserAvaterFilesList] = useState([]);
  const [groupAvaterFilesList, setGroupAvaterFilesList] = useState([]);
  const [avatarPageNum, setAvatarPageNum] = useState(1);
  const AvaterFilesScreen = (
    <View>
      {userAvaterFilesList.length > 0 ? (
        <View padding-6>
          <Text grey40>用户头像文件</Text>
        </View>
      ) : null}
      <FlatList
        data={userAvaterFilesList}
        keyExtractor={(item, index) => item + index}
        onEndReached={() => {
          setAvatarPageNum(prev => prev + 1);
        }}
        ListEmptyComponent={
          <View marginT-16 center>
            <Text text90L grey40>
              还没有头像文件~
            </Text>
          </View>
        }
        renderItem={({item, index}) => renderItem(item, index)}
      />
      {groupAvaterFilesList.length > 0 ? (
        <View padding-6>
          <Text grey40>群聊头像文件</Text>
        </View>
      ) : null}
      <FlatList
        data={groupAvaterFilesList}
        onEndReached={() => {
          setAvatarPageNum(prev => prev + 1);
        }}
        keyExtractor={(item, index) => item + index}
        renderItem={({item, index}) => renderItem(item, index)}
      />
    </View>
  );

  // 消息记录列表
  const [msgPageNum, setMsgPageNum] = useState(1);
  const [msgFilesList, setMsgFilesList] = useState([]);
  const getMsgList = async uid => {
    setLoading(true);
    try {
      const res = await getUserMsgList({
        send_uid: uid,
        pageSize: msgPageNum * 20,
      });
      if (res.success) {
        const newList = res.data.list;
        setMsgFilesList(newList.map(item => formatMsg(item)));
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };
  const MsgFilesScreen = (
    <FlatList
      data={msgFilesList}
      keyExtractor={(item, index) => item + index}
      onEndReached={() => {
        setMsgPageNum(prev => prev + 1);
      }} // 加载更多
      ListEmptyComponent={
        <View marginT-16 center>
          <Text text90L grey40>
            还没有消息记录~
          </Text>
        </View>
      }
      renderItem={({item, index}) => renderMsgItem(item, index)}
      ListFooterComponent={<View marginB-140 />}
    />
  );

  // 上传的文件列表
  const [uploadFilesList, setUploadFilesList] = useState([]);
  const [uploadPageNum, setUploadPageNum] = useState(1);
  const UploadFilesScreen = (
    <FlatList
      data={uploadFilesList}
      keyExtractor={(item, index) => item + index}
      onEndReached={() => {
        setUploadPageNum(prev => prev + 1);
      }}
      ListEmptyComponent={
        <View marginT-16 center>
          <Text text90L grey40>
            还没有上传过文件~
          </Text>
        </View>
      }
      renderItem={({item, index}) => renderItem(item, index)}
      ListFooterComponent={<View marginB-140 />}
    />
  );

  /* 上传文件 */
  const [showUploadType, setShowUploadType] = useState(false);
  const uploadFiles = async (files, useType) => {
    setIsDownload(false);
    setShowDialog(true);
    setFileNum(files.length);
    for (let i = 0; i < files.length; i++) {
      const media = files[i];
      const mediaRes = getDocumentfileFormdata(useType, media, true);
      setNowFileIndex(i + 1);
      const res = await UploadFile(
        mediaRes.file,
        value => {
          setProgress(value);
        },
        {
          uid: userId,
          fileType: mediaRes.type,
          useType: useType,
        },
      );
      const upRes = JSON.parse(res.text());
      setProgress(0);
      if (upRes.success) {
        showToast(`第${i + 1}个文件上传成功`, 'success');
      } else {
        showToast(`第${i + 1}个文件上传失败`, 'error');
        continue;
      }
    }
    setShowDialog(false);
    setFileNum(1);
    dataInit();
  };

  /*  保存单个文件 */
  const saveFile = async () => {
    setIsDownload(true);
    setShowDialog(true);
    setShowActionSheet(false);
    const savepath = await DownloadFile(
      savePath,
      getFileName(savePath),
      progress => {
        if (progress) {
          setProgress(progress);
        }
      },
      isInCameraRoll,
    );
    setProgress(0);
    if (savepath) {
      showToast('文件已保存到' + savepath, 'success');
    } else {
      showToast('保存失败', 'error');
    }
    setShowDialog(false);
  };

  /*  保存多个文件 */
  const saveFiles = async () => {
    if (selectedFileItem.length === 0) {
      showToast('请选择文件', 'warning');
      return;
    }
    setIsDownload(true);
    setShowDialog(true);
    const selectedFiles = [];
    if (focusedIndex === 0) {
      chatFilesList.forEach(item => {
        if (selectedFileItem.includes(item.id)) {
          selectedFiles.push(item);
        }
      });
    }
    if (focusedIndex === 1) {
      userAvaterFilesList.forEach(item => {
        if (selectedFileItem.includes(item.id)) {
          selectedFiles.push(item);
        }
      });
      groupAvaterFilesList.forEach(item => {
        if (selectedFileItem.includes(item.id)) {
          selectedFiles.push(item);
        }
      });
    }
    if (focusedIndex === 2) {
      uploadFilesList.forEach(item => {
        if (selectedFileItem.includes(item.id)) {
          selectedFiles.push(item);
        }
      });
    }
    setFileNum(selectedFiles.length);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setNowFileIndex(i + 1);
      const savePath = await DownloadFile(
        STATIC_URL + file.file_name,
        file.file_name,
        progress => {
          if (progress) {
            setProgress(progress);
          }
        },
        file.file_type === 'image' || file.file_type === 'video',
      );
      setProgress(0);
      if (savePath) {
        // showToast('保存成功', 'success');
      } else {
        showToast(`第${i + 1}个文件下载失败`, 'error');
      }
    }
    showToast('文件下载完成', 'success');
    setShowDialog(false);
    setFileNum(1);
    setSelectedFileItem([]);
    setNowFileIndex(1);
    setIsAllSelect(false);
    setIsMultiSelect(false);
  };

  /* 同步消息到本地 */
  const asyncMsgToLocal = async () => {
    const notSaveMsg = await getStorage('setting', 'notSaveMsg');
    if (notSaveMsg) {
      showToast('请先关闭不保留消息功能！', 'success');
      return;
    }
    setShowActionSheet(false);
    setLocalMsg(realm, [selectedCloudMsg]).then(() => {
      showToast('同步消息成功', 'success');
    });
  };

  /* 同步多条消息到本地 */
  const asyncMsgsToLocal = async () => {
    const notSaveMsg = await getStorage('setting', 'notSaveMsg');
    if (notSaveMsg) {
      showToast('请先关闭不保留消息功能！', 'success');
      return;
    }
    if (selectedMsgItem.length === 0) {
      showToast('请先选择需要同步的消息', 'warning');
      return;
    }
    let selecetedMsg = [];
    if (focusedIndex === 3) {
      for (let i = 0; i < msgFilesList.length; i++) {
        const msg = msgFilesList[i];
        if (selectedMsgItem.includes(msg.id)) {
          selecetedMsg.push(formatMsg(msg));
        }
      }
      setLocalMsg(realm, selecetedMsg).then(() => {
        showToast(selecetedMsg.length + '条消息同步成功', 'success');
      });
    }
    setSelectedMsgItem([]);
    setIsAllSelect(false);
    setIsMultiSelect(false);
  };

  /* 删除文件 */
  const deleteFiles = async () => {
    if (
      isMultiSelect &&
      selectedFileItem.length === 0 &&
      selectedMsgItem.length === 0
    ) {
      showToast('请先选择!', 'warning');
      return;
    }
    if (focusedIndex === 3) {
      const msgDelRes = await delUserMsgs({
        ids: isMultiSelect ? selectedMsgItem : [selectedFileId],
      });
      if (msgDelRes.success) {
        showToast(
          `成功删除${selectedMsgItem.length || 1}条云端消息`,
          'success',
        );
      } else {
        showToast(msgDelRes.message, 'error');
      }
    } else {
      const fileDelRes = await delUserUploadFiles({
        ids: isMultiSelect ? selectedFileItem : [selectedFileId],
      });
      if (fileDelRes.success) {
        showToast(
          `成功删除${selectedFileItem.length || 1}个云端文件`,
          'success',
        );
      } else {
        showToast(fileDelRes.message, 'error');
      }
    }
    setIsAllSelect(false);
    setSelectedFileItem([]);
    setSelectedMsgItem([]);
    setIsMultiSelect(false);
    setShowActionSheet(false);
    dataInit();
  };

  const [focusedIndex, setFocusedIndex] = useState(0);
  const dataInit = _userId => {
    if (focusedIndex === 0) {
      getFilesList(_userId, 'chat');
    }
    if (focusedIndex === 1) {
      getFilesList(_userId, 'user');
      getFilesList(_userId, 'group');
    }
    if (focusedIndex === 2) {
      getFilesList(_userId, 'upload');
    }
    if (focusedIndex === 3) {
      getMsgList(_userId);
    }
  };
  useEffect(() => {
    if (userId) {
      dataInit(userId);
    }
  }, [
    userId,
    focusedIndex,
    chatPageNum,
    avatarPageNum,
    msgPageNum,
    uploadPageNum,
  ]);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [savePath, setSavePath] = useState(''); // 需要保存的文件源路径
  const [progress, setProgress] = useState(0); // 保存文件进度
  const [isInCameraRoll, setIsInCameraRoll] = useState(false); // 是否保存到相册
  const [showDialog, setShowDialog] = useState(false); // 下载进度条
  const [isDownload, setIsDownload] = useState(false); // 是否正在下载
  const [fileNum, setFileNum] = useState(1); // 总文件数
  const [nowFileIndex, setNowFileIndex] = useState(1); // 当前文件索引

  const [delVisible, setDelVisible] = useState(false); // 删除文件弹窗

  useEffect(() => {
    if (!showActionSheet) {
      setSelectedFileId(null);
    }
  }, [showActionSheet]);

  /* 顶部导航栏 */
  const routes = [
    {key: 'chat', title: '聊天文件', screen: ChatFilesScreen},
    {key: 'avatar', title: '头像文件', screen: AvaterFilesScreen},
    {key: 'upload', title: '文件存储', screen: UploadFilesScreen},
    {key: 'msg', title: '聊天消息', screen: MsgFilesScreen},
  ];

  return (
    <>
      <View row spread padding-8 paddingR-16>
        <Button
          size={'small'}
          borderRadius={8}
          label={'上传文件'}
          backgroundColor={Colors.Primary}
          onPress={() => {
            if (!accessFolder) {
              showToast('请授予应用文件和媒体使用权限', 'warning');
              dispatch(requestFolderPermission());
              return;
            }
            setShowUploadType(true);
          }}
        />
        <View row width={'50%'} spread>
          {isMultiSelect ? (
            <>
              <Button
                size={'xSmall'}
                label={isAllSelect ? '全不选' : '全选'}
                link
                color={Colors.cyan30}
                onPress={() => {
                  setIsAllSelect(prev => {
                    if (!prev) {
                      if (focusedIndex === 0) {
                        setSelectedFileItem(chatFilesList.map(item => item.id));
                      }
                      if (focusedIndex === 1) {
                        setSelectedFileItem(
                          userAvaterFilesList
                            .map(item => item.id)
                            .concat(groupAvaterFilesList.map(item => item.id)),
                        );
                      }
                      if (focusedIndex === 2) {
                        setSelectedFileItem(
                          uploadFilesList.map(item => item.id),
                        );
                      }
                      if (focusedIndex === 3) {
                        setSelectedMsgItem(msgFilesList.map(item => item.id));
                      }
                    } else {
                      if (focusedIndex === 3) {
                        setSelectedMsgItem([]);
                      } else {
                        setSelectedFileItem([]);
                      }
                    }
                    return !prev;
                  });
                }}
              />
              <Button
                size={'xSmall'}
                label={focusedIndex === 3 ? '同步' : '下载'}
                link
                color={Colors.blue30}
                onPress={() => {
                  if (focusedIndex === 3) {
                    asyncMsgsToLocal();
                  } else {
                    saveFiles();
                  }
                }}
              />
              <Button
                size={'xSmall'}
                label={'删除'}
                link
                color={Colors.error}
                onPress={() => {
                  setDelVisible(true);
                }}
              />
            </>
          ) : (
            <View />
          )}
          <Button
            size={'xSmall'}
            label={isMultiSelect ? '取消' : '多选'}
            link
            color={Colors.Primary}
            onPress={() => {
              setIsMultiSelect(prev => !prev);
            }}
          />
        </View>
      </View>
      <BaseTopBar
        Routes={routes}
        FocusIndex={focusedIndex}
        OnChangeIndex={index => {
          setFocusedIndex(index);
          setIsAllSelect(false);
          setSelectedFileItem([]);
          setSelectedMsgItem([]);
        }}
      />

      {loading ? (
        <LoaderScreen
          message={'加载中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}

      <BaseSheet
        Title={'请选择上传的用途'}
        Visible={showUploadType}
        SetVisible={setShowUploadType}
        Actions={[
          {
            label: '文件存储',
            color: Colors.Primary,
            onPress: async () => {
              DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],
                allowMultiSelection: true,
              })
                .then(files => {
                  uploadFiles(files, 'upload');
                })
                .finally(() => {
                  setShowUploadType(false);
                });
            },
          },
          {
            label: '作为音乐',
            color: Colors.Primary,
            onPress: async () => {
              DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
                allowMultiSelection: true,
              })
                .then(files => {
                  uploadFiles(files, 'music');
                })
                .finally(() => {
                  setShowUploadType(false);
                });
            },
          },
        ]}
      />
      <BaseSheet
        Title={'文件操作'}
        Visible={showActionSheet}
        SetVisible={setShowActionSheet}
        Actions={[
          {
            label: focusedIndex === 3 ? '复制消息内容' : '复制下载链接',
            color: Colors.Primary,
            onPress: async () => {
              if (focusedIndex === 3) {
                Clipboard.setString(selectedCloudMsg.text);
              } else {
                Clipboard.setString(savePath);
              }
              showToast('已复制到剪贴板', 'success');
              setShowActionSheet(false);
            },
          },
          {
            label: focusedIndex === 3 ? '同步到本地' : '保存到本地',
            color: Colors.Primary,
            onPress: async () => {
              if (focusedIndex === 3) {
                asyncMsgToLocal();
              } else {
                saveFile();
              }
            },
          },
          {
            label: '从云端删除',
            color: Colors.error,
            onPress: async () => {
              deleteFiles();
            },
          },
        ]}
      />
      <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
        <Card padding-16>
          <Text text70BL marginB-8>
            文件{isDownload ? '保存' : '上传'}
          </Text>
          <View>
            <Text marginB-16>
              共
              <Text text70 blue30 marginB-16>
                {fileNum}
              </Text>
              个文件，正在{isDownload ? '保存' : '上传'}第{nowFileIndex}
              个文件...
            </Text>
            {progress ? (
              <ProgressBar progress={progress} progressColor={Colors.Primary} />
            ) : null}
          </View>
        </Card>
      </Dialog>

      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          deleteFiles();
          setDelVisible(false);
        }}
        Visible={delVisible}
        SetVisible={setDelVisible}
        MainText={'您确定要删除吗？'}
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
      {/* 图片预览 */}
      <ImgModal
        Uri={fullscreenUri}
        Visible={imageShow}
        OnClose={() => setImageShow(false)}
        OnSave={() => setImageShow(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  image: {width: 50, height: 50, borderRadius: 4, marginRight: 12},
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  msgItem: {
    borderBottomWidth: 1,
    borderColor: Colors.grey60,
  },
});
export default DataManager;
