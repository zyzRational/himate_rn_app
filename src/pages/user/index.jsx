import React, {useState} from 'react';
import {
  View,
  Text,
  Card,
  Colors,
  Image,
  TouchableOpacity,
  LoaderScreen,
  Dialog,
  Button,
  ProgressBar,
} from 'react-native-ui-lib';
import {StyleSheet, Modal, ActivityIndicator} from 'react-native';
import {useSelector} from 'react-redux';
import {useToast} from '../../components/commom/Toast';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ImageViewer from 'react-native-image-zoom-viewer';
import {fullWidth} from '../../styles';
import {DownloadFile} from '../../utils/Download';
import ListItem from '../../components/commom/ListItem';
import {getAppPackageDetail} from '../../api/appPackage';
import {
  name as appName,
  displayName as appDisplayName,
} from '../../../app.json';
import DeviceInfo from 'react-native-device-info';

const User = ({navigation}) => {
  const {showToast} = useToast();
  const userInfo = useSelector(state => state.userStore.userInfo);

  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);

  // 预览头像
  const [avatarShow, setAvatarShow] = useState(false);
  const isShowAvatar = () => {
    if (userInfo.user_avatar) {
      setAvatarShow(true);
    } else {
      showToast('您还没有头像!', 'warning');
    }
  };

  // 保存头像
  const saveAvatar = async (url, name) => {
    setAvatarShow(false);
    const res = await DownloadFile(url, name);
    if (res.statusCode === 200) {
      showToast('保存成功', 'success');
    } else {
      showToast('保存失败', 'error');
    }
  };

  // 检查更新
  const versionName = DeviceInfo.getVersion();
  const [showAppUpate, setShowAppUpate] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newAppInfo, setNewAppInfo] = useState(null);

  const checkUpdate = async () => {
    setUpdateLoading(true);
    try {
      const res = await getAppPackageDetail({app_name: appName});
      // console.log(res);

      if (res.code === 200) {
        setNewAppInfo(res.data);
      } else {
        showToast('检查更新失败', 'error');
        setShowAppUpate(false);
      }
      setUpdateLoading(false);
    } catch (error) {
      console.log(error);
      showToast('检查更新失败', 'error');
      setUpdateLoading(false);
      setShowAppUpate(false);
    }
  };

  // 下载app
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const downloadApp = async () => {
    setShowProgress(true);
    const res = await DownloadFile(
      STATIC_URL + newAppInfo.app_fileName,
      appName + newAppInfo.app_version + '.apk',
      progress => {
        const progressPercent = Math.round(
          (progress.bytesWritten / progress.contentLength) * 100,
        );
        setDownloadProgress(progressPercent);
      },
      false,
    );
    setDownloadProgress(0);
    setShowProgress(false);
    if (res.statusCode === 200) {
      showToast('安装包下载成功', 'success');
    } else {
      showToast('安装包下载失败', 'error');
    }
    setShowAppUpate(false);
  };

  return (
    <>
      {userInfo ? (
        <View flexG top paddingH-16 paddingT-16>
          <Card
            flexS
            left
            row
            centerV
            enableShadow={false}
            padding-16
            onPress={() => {
              navigation.navigate('Edituser', {
                userId: userInfo?.id,
              });
            }}>
            <TouchableOpacity
              onPress={() => {
                isShowAvatar();
              }}>
              <Image
                source={{uri: STATIC_URL + userInfo.user_avatar}}
                style={styles.image}
              />
            </TouchableOpacity>
            <View marginL-16 flexG>
              <Text grey20 text70BO numberOfLines={1}>
                {userInfo?.user_name}
              </Text>
              <View width={166}>
                <Text grey30 text80 numberOfLines={1}>
                  账号：{userInfo?.self_account}
                </Text>
              </View>
              <View flexS row>
                <View flexS row centerV padding-4 marginT-4 style={styles.tag}>
                  {userInfo?.sex === 'woman' ? (
                    <FontAwesome
                      name="venus"
                      color={Colors.magenta}
                      size={12}
                    />
                  ) : userInfo?.sex === 'man' ? (
                    <FontAwesome
                      name="mars"
                      color={Colors.geekblue}
                      size={12}
                    />
                  ) : null}
                  <Text marginL-4 grey30 text90>
                    {userInfo?.age}岁
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              padding-16
              onPress={() => {
                navigation.navigate('QrCode');
              }}>
              <FontAwesome name="qrcode" color={Colors.grey40} size={32} />
            </TouchableOpacity>
            <FontAwesome name="angle-right" color={Colors.grey50} size={26} />
          </Card>
          <Card flexS centerV enableShadow={false} marginT-16>
            <ListItem
              ItemName={'账号安全'}
              IconName={'shield'}
              IconColor={Colors.green30}
              isBottomLine={true}
              Fun={() => {
                navigation.navigate('UserSafe', {
                  userId: userInfo?.id,
                });
              }}
            />
          </Card>
          <Card flexS centerV enableShadow={false} marginT-16>
            <ListItem
              ItemName={'系统设置'}
              IconName={'cog'}
              IconColor={Colors.grey30}
              Fun={() => {
                navigation.navigate('Setting');
              }}
            />
            <ListItem
              ItemName={'聊天记录'}
              IconName={'file-text'}
              IconSize={20}
              IconColor={Colors.blue40}
              Fun={() => {
                navigation.navigate('ChatMsg');
              }}
            />
            <ListItem
              ItemName={'云端数据'}
              IconName={'database'}
              IconSize={20}
              IconColor={Colors.orange40}
              Fun={() => {
                navigation.navigate('DataManager');
              }}
            />
            <ListItem
              ItemName={'版本更新'}
              IconName={'cloud-download'}
              IconSize={20}
              IconColor={Colors.violet40}
              RightText={versionName}
              Fun={() => {
                setShowAppUpate(true);
                checkUpdate();
              }}
            />
            <ListItem
              ItemName={'关于' + appDisplayName}
              IconName={'cube'}
              IconSize={20}
              IconColor={Colors.cyan30}
              Fun={() => {
                navigation.navigate('WebView', {
                  title: '关于' + appDisplayName,
                  url: STATIC_URL + 'index.html',
                });
              }}
            />
          </Card>
          <Dialog
            visible={showAppUpate}
            onDismiss={() => setShowAppUpate(false)}>
            <Card flexS padding-16>
              {updateLoading ? (
                <View flexS paddingH-16>
                  <ActivityIndicator color={Colors.Primary} size={'large'} />
                  <Text marginT-16 text70BO center>
                    正在检查更新...
                  </Text>
                </View>
              ) : (
                <View flexS>
                  <Text text70BO>
                    {newAppInfo?.app_version === versionName
                      ? '当前已是最新版本！'
                      : '发现新版本！'}
                    <Text text80BO green30>
                      {newAppInfo?.app_version}
                    </Text>
                  </Text>
                  {showProgress ? null : (
                    <View flexS marginT-16>
                      <Button
                        size={'medium'}
                        label={
                          newAppInfo?.app_version === versionName
                            ? '下载安装包'
                            : '立即更新'
                        }
                        backgroundColor={Colors.Primary}
                        onPress={downloadApp}
                      />
                    </View>
                  )}
                </View>
              )}
              {showProgress ? (
                <View marginT-16>
                  <Text marginB-16>下载中...</Text>
                  <ProgressBar
                    progress={downloadProgress}
                    progressColor={Colors.Primary}
                  />
                </View>
              ) : null}
            </Card>
          </Dialog>

          <Modal visible={avatarShow} transparent={true} >
            <ImageViewer
              imageUrls={[{url: STATIC_URL + userInfo.user_avatar}]}
              onClick={() => {
                setAvatarShow(false);
              }}
              menuContext={{saveToLocal: '保存到本地', cancel: '取消'}}
              onSave={url => saveAvatar(url, userInfo.user_avatar)}
              renderFooter={() => {
                return (
                  <View flex center row padding-16 style={{width: fullWidth}}>
                    <Text center grey70 text90>
                      长按保存图片，单击退出预览
                    </Text>
                  </View>
                );
              }}
            />
          </Modal>
        </View>
      ) : (
        <LoaderScreen
          message={appDisplayName + ' 加载中...'}
          color={Colors.Primary}
        />
      )}
    </>
  );
};
const styles = StyleSheet.create({
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: Colors.grey70,
    borderWidth: 1,
  },
  tag: {
    backgroundColor: Colors.grey70,
    borderRadius: 6,
  },
});
export default User;
