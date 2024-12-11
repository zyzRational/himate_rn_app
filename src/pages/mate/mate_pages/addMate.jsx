import React, {useState} from 'react';
import {Vibration, StyleSheet, Modal} from 'react-native';
import {
  View,
  Card,
  Text,
  Colors,
  Button,
  TextField,
  TouchableOpacity,
  Avatar,
} from 'react-native-ui-lib';
import {useSelector, useDispatch} from 'react-redux';
import {useToast} from '../../../components/commom/Toast';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {getUserdetail} from '../../../api/user';
import {addmate, getmateStatus} from '../../../api/mate';
import BaseDialog from '../../../components/commom/BaseDialog';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {requestCameraPermission} from '../../../stores/store-slice/permissionStore';

const Addmate = ({navigation, route}) => {
  const {showToast} = useToast();
  const userInfo = useSelector(state => state.userStore.userInfo);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  const accessCamera = useSelector(state => state.permissionStore.accessCamera);
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const dispatch = useDispatch();

  /*  搜索用户 */
  const [userDetail, setUserDetail] = useState(null);
  const [account, setAccount] = useState('');
  const searchUser = async userAccount => {
    if (userAccount === '') {
      showToast('请先输入账号！', 'warning');
      return;
    }
    try {
      const userRes = await getUserdetail({self_account: userAccount});
      if (userRes.success) {
        setUserDetail(userRes.data);
      }
      showToast(userRes.message, userRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
    }
  };

  /*  添加好友 */
  const [isVisible, setIsVisible] = useState(false);
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const addFriend = async () => {
    try {
      if (userInfo?.id === userDetail.id) {
        showToast('不能添加自己为好友', 'error');
        return;
      }
      const statusRes = await getmateStatus({
        selfUid: userInfo?.id,
        otherUid: userDetail.id,
      });
      if (statusRes.success) {
        showToast('你们已是好友或已申请', 'error');
        return;
      }
      const addRes = await addmate({
        agree_remark: remark,
        validate_msg: message,
        apply_uid: userInfo?.id,
        agree_uid: userDetail.id,
      });
      if (addRes.success) {
        cancelAddmate();
      }
      showToast(addRes.message, addRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
    }
  };
  const cancelAddmate = () => {
    setIsVisible(false);
    setRemark('');
    setMessage('');
  };

  /* 扫描二维码 */
  const [modalVisible, setModalVisible] = useState(false);
  const device = useCameraDevice('back');
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      // console.log(codes);
      if (codes[0]?.value) {
        Vibration.vibrate(50);
        searchUser(codes[0].value);
        setModalVisible(false);
      } else {
        showToast('未识别到二维码', 'error');
      }
    },
  });

  return (
    <View padding-16>
      <Card padding-12 flexS enableShadow={false} row spread>
        <TextField
          placeholder={'请输入账号进行搜索'}
          text70L
          onChangeText={value => {
            setAccount(value);
          }}
          maxLength={30}
        />
        <View flexS centerV row>
          <TouchableOpacity
            onPress={() => {
              if (!accessCamera) {
                showToast('请授予应用相机使用权限', 'warning');
                dispatch(requestCameraPermission());
                return;
              }
              setModalVisible(true);
            }}>
            <AntDesign name="scan1" size={24} color={Colors.Primary} />
          </TouchableOpacity>
          <Button
            marginL-12
            label={'搜索'}
            borderRadius={8}
            labelStyle={{fontSize: 13}}
            avoidMinWidth={true}
            size={Button.sizes.small}
            backgroundColor={Colors.Primary}
            onPress={() => {
              searchUser(account);
            }}
          />
        </View>
      </Card>
      {userDetail ? (
        <Card marginT-16 padding-16 paddingB-16>
          <View flexS backgroundColor={Colors.white} spread row centerV>
            <TouchableOpacity
              flexS
              row
              centerV
              onPress={() => {
                navigation.navigate('Mateinfo', {
                  uid: userDetail.id,
                });
              }}>
              <Avatar
                source={{
                  uri: STATIC_URL + userDetail.user_avatar,
                }}
              />
              <View marginL-10>
                <Text text80BL>{userDetail.user_name}</Text>
                <Text text90L marginT-5 grey30>
                  {userDetail.self_account}
                </Text>
              </View>
            </TouchableOpacity>
            <View marginL-10 flexS row>
              <Button
                onPress={() => setIsVisible(true)}
                marginL-8
                label={'添加'}
                borderRadius={8}
                labelStyle={{fontSize: 13}}
                avoidMinWidth={true}
                outline
                outlineColor={Colors.Primary}
                size={Button.sizes.xSmall}
              />
            </View>
          </View>
        </Card>
      ) : null}

      <BaseDialog
        IsButton={true}
        Fun={addFriend}
        Visible={isVisible}
        SetVisible={setIsVisible}
        MainText={'添加好友'}
        Body={
          <>
            <TextField
              marginT-8
              placeholder={'请输入好友备注'}
              floatingPlaceholder
              text70L
              onChangeText={value => {
                setRemark(value);
              }}
              maxLength={10}
              showCharCounter={true}
            />
            <TextField
              marginT-8
              placeholder={'请输入验证消息'}
              floatingPlaceholder
              text70L
              onChangeText={value => {
                setMessage(value);
              }}
              maxLength={50}
              showCharCounter={true}
              multiline={true}
            />
          </>
        }
      />
      {/* 扫描二维码弹窗 */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View bg-white>
          {isFullScreen ? null : (
            <View padding-12 row center backgroundColor={Colors.Primary}>
              <TouchableOpacity
                style={styles.BackBut}
                onPress={() => setModalVisible(false)}>
                <AntDesign name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
              <View paddingT-4>
                <Text white>扫一扫</Text>
              </View>
            </View>
          )}
          <Camera
            style={styles.Camera}
            device={device}
            codeScanner={codeScanner}
            isActive={true}
          />
          <Text center white style={styles.tipText}>
            请对准需要识别的二维码
          </Text>
          <View>
            <TouchableOpacity
              padding-16
              center
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('QrCode');
              }}>
              <View style={styles.selfCode}>
                <AntDesign name="qrcode" size={32} color={Colors.black} />
              </View>
              <Text grey30 marginT-4 text80>
                我的二维码
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  Camera: {width: '100%', height: '82%'},
  tipText: {
    position: 'absolute',
    width: '100%',
    bottom: '20%',
  },
  selfCode: {
    padding: 2,
    backgroundColor: Colors.grey60,
    borderRadius: 6,
  },
  BackBut: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
});
export default Addmate;
