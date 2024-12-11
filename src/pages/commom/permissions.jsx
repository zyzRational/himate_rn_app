import React from 'react';
import {View, Card, Colors, Text} from 'react-native-ui-lib';
import ListItem from '../../components/commom/ListItem';
import {useSelector, useDispatch} from 'react-redux';
import {
  checkPermissions,
  requestCameraPermission,
  requestMicrophonePermission,
  requestFolderPermission,
  requestNotifyPermission,
} from '../../stores/store-slice/permissionStore';
import {openSettings} from 'react-native-permissions';
import {useToast} from '../../components/commom/Toast';

const Permissions = ({navigation, route}) => {
  const accessCamera = useSelector(state => state.permissionStore.accessCamera);
  const accessMicrophone = useSelector(
    state => state.permissionStore.accessMicrophone,
  );
  const accessFolder = useSelector(state => state.permissionStore.accessFolder);
  const accessNotify = useSelector(state => state.permissionStore.accessNotify);

  const dispatch = useDispatch();
  dispatch(checkPermissions());

  const {showToast} = useToast();

  return (
    <View flexG paddingH-16 paddingT-18>
      <Card enableShadow={false}>
        <View>
          <ListItem
            ItemName={'相机'}
            IconName={'camera'}
            IconColor={Colors.grey10}
            IconSize={20}
            RightText={accessCamera ? '已授权' : '未授权'}
            Fun={() => {
              if (!accessCamera) {
                showToast('请授予应用相机使用权限', 'warning');
                dispatch(requestCameraPermission());
              }
            }}
          />
          <View paddingH-16 paddingB-16>
            <Text grey30 text90L>
              授权后，应用才能访问相机、使用摄像头拍照/录像
            </Text>
          </View>
        </View>
        <View>
          <ListItem
            ItemName={'通知'}
            IconName={'bell'}
            IconColor={Colors.grey10}
            IconSize={20}
            RightText={accessNotify ? '已授权' : '未授权'}
            Fun={() => {
              if (!accessNotify) {
                showToast('请授予应用通知权限', 'warning');
                dispatch(requestNotifyPermission());
              }
            }}
          />
          <View paddingH-16 paddingB-16>
            <Text grey30 text90L>
              授权后，应用才能推送消息到系统通知
            </Text>
          </View>
        </View>
        <View>
          <ListItem
            ItemName={'麦克风'}
            IconName={'microphone'}
            IconColor={Colors.grey10}
            RightText={accessMicrophone ? '已授权' : '未授权'}
            Fun={() => {
              if (!accessMicrophone) {
                showToast('请授予应用麦克风使用权限', 'warning');
                dispatch(requestMicrophonePermission());
              }
            }}
          />
          <View paddingH-16 paddingB-16>
            <Text grey30 text90L>
              授权后，应用才能访问麦克风、开启语音功能
            </Text>
          </View>
        </View>
        <View>
          <ListItem
            ItemName={'文件媒体'}
            IconName={'folder'}
            IconColor={Colors.grey10}
            IconSize={20}
            RightText={accessFolder ? '已授权' : '未授权'}
            Fun={() => {
              if (!accessFolder) {
                showToast('请授予应用文件和媒体使用权限', 'warning');
                dispatch(requestFolderPermission());
              }
            }}
          />
          <View paddingH-16 paddingB-16>
            <Text grey30 text90L>
              授权后，应用才能保存照片、视频、等文件到本地
            </Text>
          </View>
        </View>
        <View>
          <ListItem
            ItemName={'其它权限'}
            IconName={'gears'}
            IconColor={Colors.grey10}
            IconSize={20}
            RightText={'去设置'}
            Fun={() => {
              openSettings().catch(() =>
                showToast('打开设置失败，请手动开启权限', 'warning'),
              );
            }}
          />
          <View paddingH-16 paddingB-16>
            <Text grey30 text90L>
              如过授权未成功，请在应用权限管理中手动开启
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

export default Permissions;
