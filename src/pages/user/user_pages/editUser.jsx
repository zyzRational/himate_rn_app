import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  View,
  Text,
  Card,
  Image,
  Colors,
  TextField,
  Button,
  RadioGroup,
  DateTimePicker,
  RadioButton,
  LoaderScreen,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useToast } from '../../../components/commom/Toast';
import { getUserdetail, EditUserInfo } from '../../../api/user';
import { UploadFile } from '../../../api/upload';
import { useDispatch, useSelector } from 'react-redux';
import { setUserInfo as setUserData } from '../../../stores/store-slice/userStore';
import ImagePicker from 'react-native-image-crop-picker';
import BaseSheet from '../../../components/commom/BaseSheet';
import { getfileFormdata } from '../../../utils/base';
import {
  requestCameraPermission,
  requestFolderPermission,
} from '../../../stores/store-slice/permissionStore';

const Edituser = ({ navigation, route }) => {
  const { userId } = route.params || {};

  const { showToast } = useToast();
  const [userInfo, setUserInfo] = useState({});
  const [username, setUsername] = useState(null);
  const [selfaccount, setSelfaccount] = useState(null);
  const [userBirthday, setUserBirthday] = useState(null);
  const [usersex, seUsersex] = useState(null);

  const accessCamera = useSelector(state => state.permissionStore.accessCamera);
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);

  // baseConfig
  const { STATIC_URL } = useSelector(state => state.baseConfigStore.baseConfig);

  const dispatch = useDispatch();

  // 初始化数据
  const dataInit = async () => {
    setRefreshing(true);
    try {
      const res = await getUserdetail({ id: userId });
      // console.log(res);
      if (res.success) {
        const { user_avatar, user_name, sex, self_account, birthday } = res.data;
        dispatch(setUserData(res.data));
        setUserInfo({ user_avatar, user_name, sex, self_account, birthday });
        setAvatarUri(STATIC_URL + user_avatar);
        setUsername(user_name);
        setSelfaccount(self_account);
        setUserBirthday(birthday);
        seUsersex(sex);
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
  const [accountshow, setAccountshow] = useState(false);
  const [birthdayshow, setBirthdayshow] = useState(false);
  const [sexshow, setSexshow] = useState(false);

  // 是否需要保存
  const isNeedSave = value => {
    if (Object.values(userInfo).includes(value)) {
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
    if (truekey === 'self_account' && truevalue.length < 6) {
      showToast('请至少输入6位账号', 'error');
      return;
    }
    value.id = userId;
    try {
      setUploading(true);
      // 修改头像
      if (truekey === 'user_avatar') {
        const res = await UploadFile(fileData, () => { }, {
          uid: userId,
          fileType: 'image',
          useType: 'user',
        });
        const upRes = JSON.parse(res.text());
        if (upRes.success) {
          value.user_avatar = upRes.data.file_name;
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
      const res = await EditUserInfo(value);
      if (res.success) {
        dataInit();
        if (truekey === 'birthday') {
          setBirthdayshow(false);
        }
        if (truekey === 'self_account') {
          setAccountshow(false);
        }
        if (truekey === 'user_name') {
          setNameshow(false);
        }
        if (truekey === 'sex') {
          setSexshow(false);
        }
        if (truekey === 'user_avatar') {
          setAvatarshow(false);
        }
      }
      showToast(res.message, res.success ? 'success' : 'error');
      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.log(error);
    }
  };

  // 刷新页面
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // 提交头像 setAvatarfile
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarfile, setAvatarfile] = useState(null);
  const [fileData, setFileData] = useState(null);

  useEffect(() => {
    if (avatarfile) {
      const fileRes = getfileFormdata('user', avatarfile);
      setAvatarUri(fileRes.uri);
      setFileData(fileRes.file);
      setAvatarshow(!isNeedSave(fileRes.uri));
    }
  }, [avatarfile]);

  useEffect(() => {
    dataInit();
  }, []);

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            colors={[Colors.Primary]}
            refreshing={refreshing}
            onRefresh={dataInit}
          />
        }>
        <View flexG paddingH-16 paddingT-16>
          <Card
            flexS
            left
            row
            center
            enableShadow={false}
            padding-16
            onPress={() => setShowDialog(true)}>
            <View flex>
              <Text grey40 text65>
                头像
              </Text>
            </View>
            <View marginH-20 style={{ display: avatarshow ? 'flex' : 'none' }}>
              <Button
                label={'保存'}
                outline={true}
                outlineColor={Colors.Primary}
                size={Button.sizes.small}
                borderRadius={8}
                backgroundColor={Colors.Primary}
                onPress={() => submitData({ user_avatar: true })}
              />
            </View>
            <Image source={{ uri: avatarUri }} style={styles.image} />
            <FontAwesome name="angle-right" color={Colors.grey50} size={26} />
          </Card>
          <Card flexS enableShadow={false} marginT-16 padding-16>
            <View flexG row spread centerV style={styles.inputLine}>
              <TextField
                label={'昵称'}
                labelColor={Colors.grey40}
                text70
                enableErrors={nameshow}
                style={styles.input}
                placeholder={'请输入昵称'}
                placeholderTextColor={Colors.grey50}
                validate={[value => value.length !== 0]}
                validationMessage={['昵称不能为空！']}
                maxLength={10}
                value={username}
                validateOnChange={true}
                onChangeText={value => {
                  setUsername(value);
                  setNameshow(!isNeedSave(value));
                }}
                onBlur={() => {
                  setNameshow(!isNeedSave(username));
                }}
              />
              <View marginB-20 style={{ display: nameshow ? 'flex' : 'none' }}>
                <Button
                  label={'保存'}
                  size={Button.sizes.small}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => submitData({ user_name: username })}
                />
              </View>
            </View>
            <View flexG row spread centerV marginT-16 style={styles.inputLine}>
              <TextField
                label={'账号'}
                labelColor={Colors.grey40}
                text70
                enableErrors={accountshow}
                style={styles.input}
                placeholder={'请输入账号'}
                placeholderTextColor={Colors.grey50}
                validate={[value => value.length > 5]}
                validationMessage={['请至少输入六位账号！']}
                maxLength={16}
                validateOnChange={true}
                value={selfaccount}
                onChangeText={value => {
                  setSelfaccount(value);
                  setAccountshow(!isNeedSave(value));
                }}
                onBlur={() => {
                  setAccountshow(!isNeedSave(selfaccount));
                }}
              />
              <View marginB-20 style={{ display: accountshow ? 'flex' : 'none' }}>
                <Button
                  label={'保存'}
                  size={Button.sizes.small}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => submitData({ self_account: selfaccount })}
                />
              </View>
            </View>
            <View flexG row spread centerV marginT-16 style={styles.inputLine}>
              <DateTimePicker
                label="生日"
                labelColor={Colors.grey40}
                title={'选择出生日期'}
                placeholder={'请选择出生日期'}
                mode={'date'}
                value={new Date(userBirthday)}
                onChange={value => {
                  setUserBirthday(value);
                  setBirthdayshow(!isNeedSave(value));
                }}
              />
              <View
                marginB-20
                style={{ display: birthdayshow ? 'flex' : 'none' }}>
                <Button
                  label={'保存'}
                  size={Button.sizes.small}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => submitData({ birthday: userBirthday })}
                />
              </View>
            </View>
            <View flexG row spread centerV marginT-16>
              <Text grey40>性别</Text>
              <RadioGroup
                initialValue={usersex}
                onValueChange={value => {
                  seUsersex(value);
                  setSexshow(!isNeedSave(value));
                }}
                flexS
                row>
                <RadioButton
                  value={'man'}
                  size={18}
                  label={'男'}
                  color={Colors.geekblue}
                  labelStyle={{ color: Colors.geekblue }}
                />
                <RadioButton
                  value={'woman'}
                  size={18}
                  label={'女'}
                  color={Colors.magenta}
                  labelStyle={{ color: Colors.magenta }}
                  marginL-16
                />
                <RadioButton
                  value={'unknown'}
                  size={18}
                  label={'保密'}
                  color={Colors.orange30}
                  labelStyle={{ color: Colors.orange30 }}
                  marginL-16
                />
              </RadioGroup>
              <View style={{ display: sexshow ? 'flex' : 'none' }}>
                <Button
                  label={'保存'}
                  size={Button.sizes.small}
                  borderRadius={8}
                  backgroundColor={Colors.Primary}
                  onPress={() => submitData({ sex: usersex })}
                />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
      <BaseSheet
        Title={'选择头像'}
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
                .finally(() => {
                  setShowDialog(false)
                });
            },
          },
          {
            label: '图库',
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
                .finally(() => {
                  setShowDialog(false);
                });
            },
          },
        ]}
      />
      {uploading ? (
        <LoaderScreen
          message={'修改中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
    </>
  );
};
const styles = StyleSheet.create({
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  input: {
    width: 200,
  },
  inputLine: {
    borderBottomColor: Colors.grey80,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
});
export default Edituser;
