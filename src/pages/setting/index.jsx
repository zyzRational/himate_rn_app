import React, {useState, useEffect} from 'react';
import {
  View,
  Card,
  Text,
  Colors,
  Dialog,
  ColorPicker,
  Switch,
} from 'react-native-ui-lib';
import {useToast} from '../../components/commom/Toast';
import ListItem from '../../components/commom/ListItem';
import {useSelector, useDispatch} from 'react-redux';
import {
  setIsFullScreen,
  setPrimaryColor,
  setToastType,
  setIsPlaySound,
  setNotSaveMsg,
  setIsFastStatic,
  setIsEncryptMsg,
  setIsMusicApp,
} from '../../stores/store-slice/settingStore';
import BaseColorPicker from '../../components/setting/BaseColoerPciker';
import BaseSheet from '../../components/commom/BaseSheet';
import {addStorage} from '../../utils/Storage';
import {playSystemSound} from '../../utils/MsgNotification';
import {displayName as appDisplayName} from '../../../app.json';
import {setBaseConfig} from '../../stores/store-slice/baseConfigStore';
import {getBaseConfig} from '../../api/baseConfig';
import {deepClone} from '../../utils/base';

const Setting = ({navigation}) => {
  const {showToast} = useToast();
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  const isPlaySound = useSelector(state => state.settingStore.isPlaySound);
  const notSaveMsg = useSelector(state => state.settingStore.notSaveMsg);
  const isFastStatic = useSelector(state => state.settingStore.isFastStatic);
  const isEncryptMsg = useSelector(state => state.settingStore.isEncryptMsg);
  const userInfo = useSelector(state => state.userStore.userInfo);

  // baseConfig
  const baseConfig = useSelector(state => state.baseConfigStore.baseConfig);

  const dispatch = useDispatch();

  const soundNames = [
    {id: 1, name: '应用默认', value: 'default_1.mp3'},
    {id: 2, name: '自定义1', value: 'default_2.mp3'},
    {id: 3, name: '自定义2', value: 'default_3.mp3'},
    {id: 3, name: '真由理(dudulu~)', value: 'default_4.mp3'},
  ];

  // 获取颜色
  const [showDialog, setShowDialog] = useState(false);

  /* 消息提示类型 */
  const [showToastType, setShowToastType] = useState(false);

  // 音效选择
  const [showAudio, setShowAudio] = useState(false);

  // 查看文件位置
  const [showFileLocation, setShowFileLocation] = useState(false);

  // 默认应用
  const [showDefaultApp, setShowDefaultApp] = useState(false);

  // 设置静态资源地址
  const [staticUrl, setStaticUrl] = useState('');
  const getBaseUrlInfo = async () => {
    try {
      const {STATIC_URL} = await getBaseConfig();
      setStaticUrl(STATIC_URL);
    } catch (error) {
      console.log(error);
    }
  };

  // 设置静态资源地址
  const settingStaticUrl = value => {
    const newUrlInfo = deepClone(baseConfig);
    if (value) {
      const {FAST_STATIC_URL} = baseConfig;
      newUrlInfo.STATIC_URL = FAST_STATIC_URL;
    } else {
      newUrlInfo.STATIC_URL = staticUrl;
    }
    dispatch(setBaseConfig(newUrlInfo));
  };

  useEffect(() => {
    getBaseUrlInfo();
  }, []);

  return (
    <>
      <View flexG paddingH-16 paddingT-16>
        <Card enableShadow={false}>
          <ListItem
            ItemName={'主题颜色'}
            IconName={'dropbox'}
            IconColor={themeColor}
            Fun={() => {
              setShowDialog(true);
            }}
          />
          <ListItem
            ItemName={'提示类型'}
            IconName={'question-circle'}
            IconColor={Colors.blue30}
            Fun={() => {
              setShowToastType(true);
            }}
          />
          <ListItem
            ItemName={'全屏模式'}
            IconName={'square-o'}
            IconColor={Colors.grey30}
            RightView={
              <Switch
                onColor={Colors.Primary}
                offColor={Colors.grey50}
                value={isFullScreen}
                onValueChange={value => dispatch(setIsFullScreen(value))}
              />
            }
          />
          <ListItem
            ItemName={'默认应用'}
            IconName={'tablet'}
            IconColor={Colors.blue50}
            Fun={() => {
              setShowDefaultApp(true);
            }}
          />
        </Card>
        <Card marginT-16 enableShadow={false}>
          <ListItem
            ItemName={'消息铃声'}
            IconName={'volume-up'}
            IconColor={Colors.cyan30}
            Fun={() => {
              setShowAudio(true);
            }}
          />
          <ListItem
            ItemName={'消息提醒'}
            IconName={'bell'}
            IconColor={Colors.yellow30}
            RightView={
              <Switch
                onColor={Colors.Primary}
                offColor={Colors.grey50}
                value={isPlaySound}
                onValueChange={value => dispatch(setIsPlaySound(value))}
              />
            }
          />
          <ListItem
            ItemName={'消息加密'}
            IconName={'lock'}
            IconColor={Colors.grey30}
            RightView={
              <Switch
                onColor={Colors.Primary}
                offColor={Colors.grey50}
                value={isEncryptMsg}
                onValueChange={value => dispatch(setIsEncryptMsg(value))}
              />
            }
          />
          <ListItem
            ItemName={'不保留消息'}
            IconName={'times-circle'}
            IconColor={Colors.red30}
            RightView={
              <Switch
                onColor={Colors.Primary}
                offColor={Colors.grey50}
                value={notSaveMsg}
                onValueChange={value => dispatch(setNotSaveMsg(value))}
              />
            }
          />
        </Card>

        <Card marginT-16 enableShadow={false}>
          <ListItem
            ItemName={'权限管理'}
            IconName={'lock'}
            IconColor={Colors.red40}
            Fun={() => {
              navigation.navigate('Permissions');
            }}
          />
          <ListItem
            ItemName={'存储位置'}
            IconName={'folder'}
            IconColor={Colors.blue40}
            Fun={() => {
              setShowFileLocation(true);
            }}
          />
          {userInfo?.user_role !== 'default' ? (
            <ListItem
              ItemName={'静态资源加速'}
              IconName={'rocket'}
              IconColor={Colors.red20}
              RightView={
                <Switch
                  onColor={Colors.Primary}
                  offColor={Colors.grey50}
                  value={isFastStatic}
                  onValueChange={value => {
                    dispatch(setIsFastStatic(value));
                    settingStaticUrl(value);
                  }}
                />
              }
            />
          ) : null}
        </Card>
      </View>

      <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
        <Card padding-16 row left style={{flexWrap: 'wrap'}}>
          <BaseColorPicker
            SlectColor={themeColor}
            Fun={item => {
              dispatch(setPrimaryColor(item.color));
              showToast('设置成功！', 'success');
              setShowDialog(false);
            }}
          />
          <View flexS row centerV paddingH-24>
            <Text>自定义主题色</Text>
            <ColorPicker
              colors={[Colors.Primary]}
              initialColor={Colors.Primary}
              value={Colors.Primary}
              onDismiss={() => console.log('取消')}
              onSubmit={(color, textColor) => {
                dispatch(setPrimaryColor(color));
                showToast('设置成功！', 'success');
                setShowDialog(false);
              }}
            />
          </View>
        </Card>
      </Dialog>
      <BaseSheet
        Title={'选择提示类型'}
        Visible={showToastType}
        SetVisible={setShowToastType}
        Actions={[
          {
            label: '系统默认',
            color: Colors.Primary,
            onPress: () => {
              dispatch(setToastType('System'));
              showToast('设置成功！', 'success', true);
              setShowToastType(false);
            },
          },
          {
            label: '顶部弹出',
            color: Colors.Primary,
            onPress: () => {
              dispatch(setToastType('top'));
              showToast('设置成功！', 'success', true);
              setShowToastType(false);
            },
          },
          {
            label: '底部弹出',
            color: Colors.Primary,
            onPress: () => {
              dispatch(setToastType('bottom'));
              showToast('设置成功！', 'success', true);
              setShowToastType(false);
            },
          },
        ]}
      />
      <BaseSheet
        Title={'选择默认启动的应用类型'}
        Visible={showDefaultApp}
        SetVisible={setShowDefaultApp}
        Actions={[
          {
            label: '聊天应用',
            color: Colors.Primary,
            onPress: () => {
              dispatch(setIsMusicApp(false));
              showToast('下次启动为聊天应用！', 'success', true);
              setShowDefaultApp(false);
            },
          },
          {
            label: '音乐应用',
            color: Colors.Primary,
            onPress: () => {
              dispatch(setIsMusicApp(true));
              showToast('下次启动为音乐应用！', 'success', true);
              setShowDefaultApp(false);
            },
          },
        ]}
      />
      <BaseSheet
        Title={'消息铃声'}
        Visible={showAudio}
        SetVisible={setShowAudio}
        Actions={soundNames.map(item => {
          return {
            label: item.name,
            color: Colors.Primary,
            onPress: () => {
              playSystemSound(item.value);
              addStorage('setting', 'soundName', item.value);
              showToast('设置成功！', 'success', true);
              setShowAudio(false);
            },
          };
        })}
      />
      <Dialog
        visible={showFileLocation}
        onDismiss={() => setShowFileLocation(false)}>
        <Card flexS padding-16>
          <View flexS paddingH-16>
            <Text text70BO>图片/视频存储位置</Text>
            <Text color={Colors.Primary}>系统相册/{appDisplayName}</Text>
          </View>
          <View marginT-16 flexS paddingH-16>
            <Text text70BO>其它文件存储位置</Text>
            <Text color={Colors.Primary}>
              内部存储/Download/{appDisplayName}
            </Text>
          </View>
        </Card>
      </Dialog>
    </>
  );
};

export default Setting;
