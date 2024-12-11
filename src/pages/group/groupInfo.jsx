import React, {Component, useEffect, useState} from 'react';
import {StyleSheet, ScrollView, Vibration, RefreshControl} from 'react-native';
import {
  View,
  Text,
  Card,
  Image,
  Colors,
  TextField,
  Button,
  ExpandableSection,
  GridList,
  TouchableOpacity,
  LoaderScreen,
  Avatar,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useToast} from '../../components/commom/Toast';
import {getGroupDetail, editGroup, deleteGroup} from '../../api/group';
import {editGroupMember, deleteGroupMember} from '../../api/groupMember';
import {UploadFile} from '../../api/upload';
import {useSelector, useDispatch} from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import BaseDialog from '../../components/commom/BaseDialog';
import ListItem from '../../components/commom/ListItem';
import {useRealm} from '@realm/react';
import {fullWidth} from '../../styles';
import BaseSheet from '../../components/commom/BaseSheet';
import {getfileFormdata} from '../../utils/base';
import {
  requestCameraPermission,
  requestFolderPermission,
} from '../../stores/store-slice/permissionStore';

const GroupInfo = ({navigation, route}) => {
  const {session_id} = route.params || {};
  const userInfo = useSelector(state => state.userStore.userInfo);
  const accessCamera = useSelector(state => state.permissionStore.accessCamera);
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);

  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const dispatch = useDispatch();

  const {showToast} = useToast();
  const [groupInfo, setGroupInfo] = useState({});
  const [groupname, setGroupname] = useState(null);
  const [groupIntroduce, setGroupIntroduce] = useState(null);
  const realm = useRealm();

  // 初始化数据
  const dataInit = async groupId => {
    setRefreshing(true);
    try {
      const res = await getGroupDetail(groupId);
      // console.log(res);
      if (res.success) {
        const {group_name, group_avatar, group_introduce} = res.data;
        setGroupInfo({...res.data});
        setAvatarUri(STATIC_URL + group_avatar);
        setGroupname(group_name);
        setGroupIntroduce(group_introduce);
        setRefreshing(false);
      }
    } catch (error) {
      console.log(error);
      setRefreshing(false);
    }
  };

  // 保存修改
  const [avatarshow, setAvatarshow] = useState(false);
  const [nameshow, setNameshow] = useState(false);
  const [introduceshow, setIntroduceshow] = useState(false);

  // 是否需要保存
  const isNeedSave = value => {
    if (Object.values(groupInfo).includes(value)) {
      return true;
    }
    return false;
  };

  // 提交修改
  const [uploading, setUploading] = useState(false);
  const submitData = async value => {
    const truekey = Object.keys(value)[0];
    const truevalue = Object.values(value)[0];
    if (truevalue === null || truevalue === '') {
      showToast('请输入要修改的内容！', 'error');
      return;
    }
    value.id = groupInfo.id;
    try {
      setUploading(true);
      // 修改头像
      if (truekey === 'group_avatar') {
        const res = await UploadFile(fileData, () => {}, {
          uid: userInfo?.id,
          fileType: 'image',
          useType: 'group',
        });
        // console.log(res.text());
        const upRes = JSON.parse(res.text());
        if (upRes.success) {
          value.group_avatar = upRes.data.file_name;
        }
        ImagePicker.clean()
          .then(() => {
            console.log('清除缓存的头像tmp');
          })
          .catch(error => {
            console.log(error);
          });
      }

      // 修改其它
      const res = await editGroup(value);
      if (res.success) {
        setUploading(false);
        dataInit(session_id);
        if (truekey === 'group_introduce') {
          setIntroduceshow(false);
        }
        if (truekey === 'group_name') {
          setNameshow(false);
        }
        if (truekey === 'group_avatar') {
          setAvatarshow(false);
        }
      }
      showToast(res.message, res.success ? 'success' : 'error');
    } catch (error) {
      setUploading(false);
      console.log(error);
    }
  };

  /* 清空聊天记录 */
  const clearChatHistory = sessionId => {
    function deleteMsg(SID) {
      const toDelete = realm
        .objects('ChatMsg')
        .filtered('session_id == $0', SID);
      realm.write(() => {
        realm.delete(toDelete);
      });
    }
    deleteMsg(sessionId);
    showToast('清除成功', 'success');
  };

  const [clearVisible, setClearVisible] = useState(false);

  /* 删除群群聊 */
  const [deleteisVisible, setDeleteIsVisible] = useState(false);

  const DeleteGroup = async () => {
    try {
      const addRes = await deleteGroup(groupInfo.id);
      if (addRes.success) {
        setDeleteIsVisible(false);
        navigation.navigate('Grouplist');
      }
      showToast(addRes.message, addRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
    }
  };

  // 刷新页面
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // 提交头像 setAvatarfile
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarfile, setAvatarfile] = useState(null);
  const [fileData, setFileData] = useState(null);

  const [isVisible, setIsVisible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [groupRole, setGroupRole] = useState('member');
  const [memberId, setMemberId] = useState(null);
  const [allMemberIds, setAllMemberIds] = useState([]);
  /* 修改群成员信息 */
  const editGroupMemberInfo = async memberInfo => {
    setShowActionSheet(false);
    const data = memberInfo || {
      id: memberId,
      member_remark: nickname,
    };
    try {
      setUploading(true);
      const addRes = await editGroupMember(data);
      if (addRes.success) {
        dataInit(session_id);
      }
      showToast(addRes.message, addRes.success ? 'success' : 'error');
      setUploading(false);
    } catch (error) {
      console.log(error);
      setUploading(false);
    }
  };

  /* 删除群成员 */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteGroupMemberInfo = async mId => {
    try {
      const addRes = await deleteGroupMember(mId);
      if (addRes.success) {
        dataInit(session_id);
      }
      showToast(addRes.message, addRes.success ? 'success' : 'error');
      setShowActionSheet(false);
    } catch (error) {
      console.log(error);
      setShowActionSheet(false);
    }
  };

  /* 我的权限 */
  useEffect(() => {
    if (groupInfo?.members?.length > 0 && userInfo) {
      setAllMemberIds(groupInfo.members.map(item => item.member_uid));
      const member = groupInfo.members.find(
        item => item.member_uid === userInfo.id,
      );
      if (member) {
        setGroupRole(member.member_role);
        setNickname(member.member_remark);
        setMemberId(member.id);
      }
    }
  }, [groupInfo?.members, userInfo]);

  /* 长按群成员头像操作 */
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [editMemberInfo, setEditMemberInfo] = useState(null);

  useEffect(() => {
    if (avatarfile) {
      const fileRes = getfileFormdata('group', avatarfile);
      setAvatarUri(fileRes.uri);
      setFileData(fileRes.file);
      setAvatarshow(!isNeedSave(fileRes.uri));
    }
  }, [avatarfile]);

  useEffect(() => {
    if (session_id) {
      dataInit(session_id);
    }
  }, [session_id]);

  const [isExpand, setIsExpand] = useState(false);
  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            colors={[Colors.Primary]}
            refreshing={refreshing}
            onRefresh={() => {
              dataInit(session_id);
            }}
          />
        }>
        <View flexG paddingH-16 paddingT-16 paddingB-16>
          <Card
            enableShadow={false}
            flexS
            left
            row
            center
            padding-16
            onPress={() => {
              if (groupRole !== 'member') {
                setShowDialog(true);
              }
            }}>
            <View flex>
              <Text grey20 text65>
                群头像
              </Text>
            </View>
            <View marginH-20 style={{display: avatarshow ? 'flex' : 'none'}}>
              <Button
                label={'保存'}
                outline={true}
                outlineColor={Colors.Primary}
                size={Button.sizes.small}
                borderRadius={8}
                backgroundColor={Colors.Primary}
                onPress={() => submitData({group_avatar: true})}
              />
            </View>
            <Image source={{uri: avatarUri}} style={styles.image} />
            <FontAwesome name="angle-right" color={Colors.grey50} size={26} />
          </Card>
          <Card enableShadow={false} flexS marginT-16 padding-16>
            <View flexG row spread centerV style={styles.inputLine}>
              <TextField
                label={'群名称'}
                text70
                readonly={groupRole === 'member'}
                enableErrors={nameshow}
                style={styles.input}
                placeholder={'请输入群名称'}
                placeholderTextColor={Colors.grey50}
                validate={[value => value.length !== 0]}
                validationMessage={['群名称不能为空！']}
                maxLength={16}
                value={groupname}
                validateOnChange={true}
                onChangeText={value => {
                  setGroupname(value);
                  setNameshow(!isNeedSave(value));
                }}
                onBlur={() => {
                  setNameshow(!isNeedSave(groupname));
                }}
              />
              <View marginB-20 style={{display: nameshow ? 'flex' : 'none'}}>
                <Button
                  label={'保存'}
                  size={Button.sizes.xSmall}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => submitData({group_name: groupname})}
                />
              </View>
            </View>
            <View flexG row spread centerV marginT-16>
              <TextField
                label={'群简介'}
                text80
                grey30
                multiline
                numberOfLines={3}
                readonly={groupRole === 'member'}
                helperText={'最多100字'}
                enableErrors={introduceshow}
                style={styles.input}
                placeholder={'请输入群简介'}
                placeholderTextColor={Colors.grey50}
                validate={[value => value.length !== 0]}
                validationMessage={['请输入群简介内容！']}
                maxLength={100}
                validateOnChange={true}
                value={groupIntroduce}
                onChangeText={value => {
                  setGroupIntroduce(value);
                  setIntroduceshow(!isNeedSave(value));
                }}
                onBlur={() => {
                  setIntroduceshow(!isNeedSave(groupIntroduce));
                }}
              />
              <View
                marginB-20
                style={{display: introduceshow ? 'flex' : 'none'}}>
                <Button
                  label={'保存'}
                  size={Button.sizes.xSmall}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => submitData({group_introduce: groupIntroduce})}
                />
              </View>
            </View>
          </Card>

          <Card enableShadow={false} marginT-16>
            <ListItem
              ItemName={'我的群聊昵称'}
              IconName={'user-secret'}
              IconSize={20}
              IconColor={Colors.violet40}
              RightText={nickname}
              Fun={() => {
                setIsVisible(true);
              }}
            />
            <ListItem
              ItemName={'查找历史消息'}
              IconName={'search'}
              IconSize={20}
              IconColor={Colors.grey40}
              Fun={() => {
                navigation.navigate('SearchMsg', {
                  session_id: session_id,
                });
              }}
            />
            <ListItem
              ItemName={'导出聊天记录'}
              IconName={'download'}
              IconColor={Colors.cyan30}
              IconSize={20}
              Fun={() => {
                navigation.navigate('ChatMsg', {
                  session_id: session_id,
                });
              }}
            />
            <ListItem
              ItemName={'清空历史消息'}
              IconName={'remove'}
              IconColor={Colors.error}
              Fun={() => {
                setClearVisible(true);
              }}
            />
          </Card>

          <Card enableShadow={false} marginT-16>
            <ExpandableSection
              expanded={isExpand}
              backgroundColor={Colors.white}
              sectionHeader={
                <ListItem
                  ItemName={'查看' + groupInfo?.members?.length + '个成员'}
                  IconName={'group'}
                  IconSize={20}
                  IconColor={Colors.Primary}
                  IsBottomLine={true}
                  Fun={() => {
                    setIsExpand(prev => !prev);
                  }}
                />
              }
              children={
                <>
                  {groupRole !== 'member' ? (
                    <View marginB-6 flexS>
                      <Text text90L grey30 center>
                        <FontAwesome
                          name="info-circle"
                          color={Colors.success}
                          size={14}
                        />
                        &nbsp;长按群成员头像进行操作~
                      </Text>
                    </View>
                  ) : null}
                  <GridList
                    data={groupInfo?.members}
                    containerWidth={fullWidth * 0.9}
                    contentContainerStyle={{paddingBottom: 12}}
                    maxItemWidth={80}
                    numColumns={4}
                    itemSpacing={12}
                    listPadding={12}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        key={item.id}
                        flexS
                        center
                        onLongPress={() => {
                          if (groupRole !== 'member') {
                            Vibration.vibrate(50);
                            setShowActionSheet(true);
                            setEditMemberInfo(item);
                          }
                        }}
                        onPress={() => {
                          navigation.navigate('Mateinfo', {
                            uid: item.member_uid,
                          });
                        }}>
                        <Avatar
                          source={{
                            uri: STATIC_URL + item.member_avatar,
                          }}
                          imageStyle={{
                            opacity:
                              item.member_status === 'forbidden' ? 0.2 : 1,
                          }}
                          ribbonLabel={
                            item.member_role === 'owner'
                              ? '群主'
                              : item.member_role === 'admin'
                              ? '管理员'
                              : null
                          }
                          ribbonStyle={{
                            backgroundColor:
                              item.member_role === 'owner'
                                ? Colors.Primary
                                : item.member_role === 'admin'
                                ? Colors.yellow30
                                : null,
                          }}
                        />
                        <Text text90L numberOfLines={1} style={{maxWidth: 60}}>
                          {item.member_remark}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              }
              onPress={() => {}}
            />
          </Card>

          <Card enableShadow={false} marginT-16>
            <ListItem
              ItemName={'邀请新的成员'}
              IconName={'plus-circle'}
              IconColor={Colors.blue40}
              Fun={() => {
                navigation.navigate('CreateGroup', {
                  group_id: session_id,
                  gId: groupInfo.id,
                  existMemberIds: allMemberIds,
                });
              }}
            />
          </Card>

          {groupRole === 'owner' ? (
            <Card
              enableShadow={false}
              marginT-16
              center
              padding-12
              onPress={() => {
                setDeleteIsVisible(true);
              }}>
              <Text text70 color={Colors.error}>
                解散群聊
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
      {uploading ? (
        <LoaderScreen
          message={'修改中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
      <BaseSheet
        Title={'选择群头像'}
        Visible={showDialog}
        SetVisible={setShowDialog}
        Actions={[
          {
            label: '相机',
            color: Colors.Primary,
            onPress: () => {
              if (!accessCamera) {
                showToast('请授予应用相机使用权限', 'warning');
                dispatch(requestCameraPermission());
                return;
              }
              ImagePicker.openCamera({
                width: 300,
                height: 300,
                cropping: true,
                mediaType: 'photo',
                cropperCircleOverlay: true,
                cropperActiveWidgetColor: Colors.Primary,
              })
                .then(image => {
                  setAvatarfile(image);
                })
                .finally(setShowDialog(false));
            },
          },
          {
            label: '图片',
            color: Colors.Primary,
            onPress: () => {
              if (!accessFolder) {
                showToast('请授予应用文件和媒体使用权限', 'warning');
                dispatch(requestFolderPermission());
                return;
              }
              ImagePicker.openPicker({
                width: 300,
                height: 300,
                cropping: true,
                mediaType: 'photo',
                cropperCircleOverlay: true,
                cropperActiveWidgetColor: Colors.Primary,
              })
                .then(image => {
                  setAvatarfile(image);
                })
                .finally(setShowDialog(false));
            },
          },
        ]}
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={DeleteGroup}
        Visible={deleteisVisible}
        SetVisible={setDeleteIsVisible}
        MainText={'您确定要解散这个群聊吗？'}
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          clearChatHistory(session_id);
        }}
        Visible={clearVisible}
        SetVisible={setClearVisible}
        MainText={'您确定要清除历史消息吗？'}
      />
      <BaseDialog
        IsButton={true}
        Fun={editGroupMemberInfo}
        Visible={isVisible}
        SetVisible={setIsVisible}
        MainText={'我的在群里的昵称'}
        Body={
          <>
            <TextField
              marginT-8
              placeholder={'请输入新的昵称'}
              floatingPlaceholder
              text70L
              onChangeText={value => {
                setNickname(value);
              }}
              maxLength={10}
              showCharCounter={true}
            />
          </>
        }
      />
      <BaseSheet
        Title={editMemberInfo?.member_remark}
        Visible={showActionSheet}
        SetVisible={setShowActionSheet}
        HasDel={true}
        Actions={[
          {
            label:
              editMemberInfo?.member_role === 'admin'
                ? '取消管理员'
                : '设为管理员',
            color: Colors.Primary,
            onPress: () => {
              if (groupRole === 'owner') {
                setEditMemberInfo(prev => {
                  if (prev.member_role === 'owner') {
                    showToast('这是群主！', 'warning', true);
                    return prev;
                  }
                  prev.member_role === 'admin'
                    ? (prev.member_role = 'member')
                    : (prev.member_role = 'admin');
                  editGroupMemberInfo(prev);
                  return prev;
                });
              } else {
                showToast('你不是群主，不能指定管理员！', 'warning', true);
              }
            },
          },
          {
            label:
              editMemberInfo?.member_status === 'normal'
                ? '禁止发言'
                : '恢复发言',
            color: Colors.Primary,
            onPress: () => {
              setEditMemberInfo(prev => {
                if (prev.member_role === 'owner') {
                  showToast('这是群主！', 'warning', true);
                  return prev;
                }
                if (prev.member_role !== 'member' && groupRole === 'admin') {
                  showToast('你不能将群主或管理员禁言！', 'warning', true);
                  setShowActionSheet(false);
                  return prev;
                } else {
                  prev.member_status === 'normal'
                    ? (prev.member_status = 'forbidden')
                    : (prev.member_status = 'normal');
                  editGroupMemberInfo(prev);
                  return prev;
                }
              });
            },
          },
          {
            label: '移出群聊',
            color: Colors.error,
            onPress: () => {
              setShowDeleteDialog(true);
            },
          },
        ]}
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          setEditMemberInfo(prev => {
            if (prev.member_role === 'owner') {
              showToast('这是群主！', 'warning', true);
              return prev;
            }
            if (prev.member_role !== 'member' && groupRole === 'admin') {
              showToast('你不能将群主或管理员移除！', 'warning', true);
              setShowActionSheet(false);
              return prev;
            } else {
              deleteGroupMemberInfo(prev.id);
              return prev;
            }
          });
        }}
        Visible={showDeleteDialog}
        SetVisible={setShowDeleteDialog}
        MainText={'您确定要移除该成员吗？'}
      />
    </>
  );
};
const styles = StyleSheet.create({
  image: {width: 60, height: 60, borderRadius: 8, marginRight: 12},
  input: {
    maxWidth: 260,
  },
  inputLine: {
    borderBottomColor: Colors.grey60,
    borderBottomWidth: 1,
  },
});
export default GroupInfo;
