import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Card, Text, Colors, TextField, Avatar, TouchableOpacity } from 'react-native-ui-lib';
import { useToast } from '../../../components/commom/Toast';
import { useSelector } from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ListItem from '../../../components/commom/ListItem';
import { getUserdetail } from '../../../api/user';
import { addmate, editmate, deletemate, getmateStatus } from '../../../api/mate';
import { DownloadFile } from '../../../utils/handle/fileHandle';
import BaseDialog from '../../../components/commom/BaseDialog';
import ImgModal from '../../../components/commom/ImgModal';

const Mateinfo = ({ navigation, route }) => {
  const { showToast } = useToast();
  const userInfo = useSelector(state => state.userStore.userInfo);
  // baseConfig
  const { STATIC_URL } = useSelector(state => state.baseConfigStore.baseConfig);
  const { uid } = route.params || {};

  const [ismate, setIsMate] = useState(false);
  /* 获取用户信息 */
  const [otherUserInfo, setOtherUserInfo] = useState({});
  const getOtherUserInfo = async userId => {
    try {
      const res = await getUserdetail({ id: userId });
      if (res.success) {
        setOtherUserInfo(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*  判断是否为好友 */
  const [mateInfo, setMateInfo] = useState({});
  const getMateStatus = async (selfUid, otherUid, status = null) => {
    try {
      const mateRes = await getmateStatus({
        selfUid,
        otherUid,
        mate_status: status,
      });
      if (mateRes.success) {
        if (status === 'agreed') {
          // console.log(mateRes.data);
          setIsMate(true);
          setMateInfo(mateRes.data);
        }
        return mateRes.success;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*  添加好友 */
  const [addisVisible, setAddIsVisible] = useState(false);
  const [addremark, setAddRemark] = useState('');
  const [valmessage, setValMessage] = useState('');
  const addFriend = async () => {
    try {
      if (userInfo?.id === uid) {
        showToast('不能添加自己为好友', 'error');
        return;
      }
      const statusRes = await getMateStatus(userInfo?.id, uid);
      if (statusRes) {
        showToast('你们已是好友或已申请', 'error');
        return;
      }
      const addRes = await addmate({
        agree_remark: addremark,
        validate_msg: valmessage,
        apply_uid: userInfo?.id,
        agree_uid: uid,
      });
      if (addRes.success) {
        cancelAddmate();
      }
      showToast(addRes.message, addRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
      cancelAddmate();
    }
  };
  const cancelAddmate = () => {
    setAddRemark('');
    setValMessage('');
  };

  /*  修改备注 */
  const [remarkisVisible, setRemarkIsVisible] = useState(false);
  const [newremark, setNewRemark] = useState(mateInfo.remark || '');
  const editFriendRemark = async () => {
    try {
      const editRes = await editmate({
        id: mateInfo.id,
        uid: userInfo?.id,
        remark: newremark,
      });
      showToast(editRes.message, editRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
    }
  };

  /* 删除好友 */
  const [deleteisVisible, setDeleteIsVisible] = useState(false);
  const deleteFriend = async () => {
    try {
      const delRes = await deletemate(mateInfo.id);
      if (delRes.success) {
        setDeleteIsVisible(false);
        navigation.navigate('Mate');
      }
      showToast(delRes.message, delRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
    }
  };

  /*   保存头像 */
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarVisible, setAvatarVisible] = useState(false);
  const saveAvatar = async (url, name) => {
    setAvatarVisible(false);
    showToast('已开始保存头像...', 'success');
    const pathRes = await DownloadFile(url, name, () => { }, true);
    if (pathRes) {
      showToast('图片已保存到' + pathRes, 'success');
    } else {
      showToast('保存失败', 'error');
    }
  };

  useEffect(() => {
    if (uid) {
      getOtherUserInfo(uid);
    }
    if (uid && userInfo) {
      getMateStatus(userInfo.id, uid, 'agreed');
    }
  }, [uid, userInfo]);

  return (
    <View padding-16>
      <Card padding-16 enableShadow={false} flexS>
        <View flexS row>
          <TouchableOpacity
            onPress={() => {
              setAvatarUri(STATIC_URL + otherUserInfo.user_avatar);
              setAvatarVisible(true);
            }}>
            <Avatar
              size={80}
              source={{
                uri: otherUserInfo.user_avatar
                  ? STATIC_URL + otherUserInfo.user_avatar
                  : null,
              }}
            />
          </TouchableOpacity>
          <View paddingH-16>
            {ismate ? (
              <Text text60 marginB-4>
                {mateInfo.remark}
              </Text>
            ) : null}
            <Text text80 marginB-4 grey30>
              昵称：{otherUserInfo.user_name}
            </Text>
            <Text text80 marginB-4 grey30>
              账号：{otherUserInfo.self_account}
            </Text>
            <View flexS row>
              <View>{ }</View>
              <View flexS row centerV padding-4 style={styles.tag}>
                {otherUserInfo?.sex === 'woman' ? (
                  <FontAwesome name="venus" color={Colors.magenta} size={12} />
                ) : otherUserInfo?.sex === 'man' ? (
                  <FontAwesome name="mars" color={Colors.geekblue} size={12} />
                ) : null}
                <Text marginL-4 grey30 text90>
                  {otherUserInfo?.age}岁
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
      {ismate ? (
        <Card enableShadow={false} marginT-16>
          <ListItem
            ItemName={'修改备注'}
            IconName={'edit'}
            IconColor={Colors.Primary}
            Fun={() => {
              setRemarkIsVisible(true);
            }}
          />
        </Card>
      ) : null}

      {ismate ? (
        <Card
          enableShadow={false}
          marginT-16
          center
          padding-12
          onPress={() => {
            navigation.navigate('Chat', {
              session_id: mateInfo.mate_id,
              chat_type: 'personal',
              to_remark: mateInfo.remark,
              to_uid: uid,
            });
          }}>
          <Text text70 color={Colors.Primary}>
            发消息
          </Text>
        </Card>
      ) : null}

      {ismate ? (
        <Card
          enableShadow={false}
          marginT-16
          center
          padding-12
          onPress={() => {
            setDeleteIsVisible(true);
          }}>
          <Text text70 color={Colors.error}>
            删除好友
          </Text>
        </Card>
      ) : null}

      {ismate ? null : (
        <Card enableShadow={false} marginT-16>
          <ListItem
            ItemName={'添加好友'}
            IconName={'user-plus'}
            IconColor={Colors.Primary}
            Fun={() => {
              setAddIsVisible(true);
            }}
          />
        </Card>
      )}

      <BaseDialog
        IsButton={true}
        Fun={addFriend}
        CancelFun={cancelAddmate}
        Visible={addisVisible}
        SetVisible={setAddIsVisible}
        MainText={'添加好友'}
        Body={
          <>
            <TextField
              marginT-8
              placeholder={'请输入好友备注'}
              floatingPlaceholder
              text70L
              onChangeText={value => {
                setAddRemark(value);
              }}
              maxLength={10}
              showCharCounter={true}
            />
            <TextField
              marginT-8
              placeholder={'请输入验证消息'}
              text70L
              floatingPlaceholder
              onChangeText={value => {
                setValMessage(value);
              }}
              maxLength={50}
              showCharCounter={true}
              multiline={true}
            />
          </>
        }
      />

      <BaseDialog
        IsButton={true}
        Fun={editFriendRemark}
        Visible={remarkisVisible}
        SetVisible={setRemarkIsVisible}
        MainText={'修改备注'}
        Body={
          <TextField
            marginT-8
            placeholder={'请输入好友备注'}
            text70L
            floatingPlaceholder
            onChangeText={value => {
              setNewRemark(value);
            }}
            maxLength={10}
            showCharCounter={true}
          />
        }
      />

      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={deleteFriend}
        Visible={deleteisVisible}
        SetVisible={setDeleteIsVisible}
        MainText={'您确定要删除这个好友吗？'}
      />

      {/* 图片预览弹窗 */}
      <ImgModal
        Uri={avatarUri}
        Visible={avatarVisible}
        OnClose={() => {
          setAvatarVisible(false);
        }}
        IsSave={true}
        OnSave={url => saveAvatar(url, otherUserInfo.user_avatar)}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  tag: {
    backgroundColor: Colors.grey70,
    borderRadius: 6,
  },
});
export default Mateinfo;
