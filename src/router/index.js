import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import RootScreen from './RootScreen';
import {Colors, LoaderScreen} from 'react-native-ui-lib';
import {getStorage} from '../utils/Storage';
import {useSelector, useDispatch} from 'react-redux';
import {
  setUserInfo,
  setUserToken,
  clearUserStore,
} from '../stores/store-slice/userStore';
import {
  setPrimaryColor,
  setToastType,
  setIsFullScreen,
  setIsPlaySound,
  setNotSaveMsg,
  setIsEncryptMsg,
  setIsMusicApp,
  setIsFastStatic,
} from '../stores/store-slice/settingStore';
import {setLrcFlag} from '../stores/store-slice/musicStore';
import {checkPermissions} from '../stores/store-slice/permissionStore';
import {initNotRemindSessionIds} from '../stores/store-slice/chatMsgStore';
import {getUserdetail} from '../api/user';
import {useToast} from '../components/commom/Toast';
import {displayName as appDisplayName} from '../../app.json';
import {setBaseConfig} from '../stores/store-slice/baseConfigStore';
import {setErrorMsg} from '../stores/store-slice/errorMsgStore';
import {getBaseConfig} from '../api/baseConfig';
import {isEmptyObject} from '../utils/base';
import 'react-native-get-random-values';

const RootView = () => {
  const {showToast} = useToast();
  const dispatch = useDispatch();

  const userToken = useSelector(state => state.userStore.userToken);
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  // getUrl
  const baseConfig = useSelector(state => state.baseConfigStore.baseConfig);

  /*  初始化应用设置 */
  const settingInit = async () => {
    const PrimaryColor = await getStorage('setting', 'PrimaryColor');
    const ToastType = await getStorage('setting', 'toastType');
    const isfullScreen = await getStorage('setting', 'isfullScreen');
    const notRemindSessionIds = await getStorage('chat', 'notRemindSessionIds');
    const isPlaySound = await getStorage('setting', 'isPlaySound');
    const notSaveMsg = await getStorage('setting', 'notSaveMsg');
    const isEncryptMsg = await getStorage('setting', 'isEncryptMsg');
    const isMusicApp = await getStorage('setting', 'isMusicApp');
    const isFastStatic = await getStorage('setting', 'isFastStatic');
    const yrcVisible = await getStorage('music', 'yrcVisible');
    const transVisible = await getStorage('music', 'transVisible');
    const romaVisible = await getStorage('music', 'romaVisible');

    dispatch(setPrimaryColor(PrimaryColor));
    dispatch(setToastType(ToastType));
    dispatch(initNotRemindSessionIds(notRemindSessionIds));
    dispatch(setIsFullScreen(isfullScreen));
    dispatch(setIsPlaySound(isPlaySound));
    dispatch(setNotSaveMsg(notSaveMsg));
    dispatch(setIsEncryptMsg(isEncryptMsg));
    dispatch(setIsMusicApp(isMusicApp));
    dispatch(setIsFastStatic(isFastStatic));
    dispatch(setLrcFlag({yrcVisible, transVisible, romaVisible}));
    dispatch(checkPermissions());
  };

  /* 是否登录 */
  const checkIsLogin = async newToken => {
    if (newToken) {
      return true;
    }
    try {
      const Token = await getStorage('user', 'userToken');
      const userId = await getStorage('user', 'userId');
      if (Token) {
        dispatch(setUserToken(Token));
        // 获取用户信息
        const userInfoRes = await getUserdetail({id: userId});
        if (userInfoRes.success) {
          dispatch(setUserInfo(userInfoRes.data));
          return true;
        } else {
          dispatch(clearUserStore());
          showToast(userInfoRes.message, 'error');
          return false;
        }
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // 显示加载动画
  const [loading, setLoading] = useState(false);
  // 应用初始化
  useEffect(() => {
    setLoading(true);
    settingInit().finally(() => {
      if (isEmptyObject(baseConfig)) {
        getBaseConfig()
          .then(async config => {
            if (config) {
              const isFastStatic = await getStorage('setting', 'isFastStatic');
              if (isFastStatic) {
                config.STATIC_URL = config.FAST_STATIC_URL;
              }
              dispatch(setBaseConfig(config));
              checkIsLogin(userToken).finally(() => setLoading(false));
            } else {
              setLoading(false);
              showToast('未获取到服务配置信息！', 'error');
            }
          })
          .catch(error => {
            console.log(error);
            setLoading(false);
            showToast('获取服务异常，请稍后再试', 'error');
          });
      } else {
        checkIsLogin(userToken).finally(() => setLoading(false));
      }
    });
  }, [userToken, baseConfig]);

  // http请求错误提示
  const errorMsg = useSelector(state => state.errorMsgStore.errorMsg);
  useEffect(() => {
    if (errorMsg) {
      showToast(errorMsg, 'error');
      dispatch(setErrorMsg(null));
    }
  }, [errorMsg]);

  return (
    <>
      <StatusBar
        backgroundColor={
          userToken
            ? isFullScreen
              ? Colors.$backgroundNeutral
              : themeColor
            : Colors.white
        }
        barStyle={
          userToken
            ? isFullScreen
              ? 'dark-content'
              : 'light-content'
            : 'dark-content'
        } // 字体颜色
        translucent={false} // 将状态栏填充的高度隐藏
        hidden={false}
      />
      {loading ? (
        <LoaderScreen
          message={appDisplayName + ' 初始化中...'}
          color={themeColor}
        />
      ) : (
        <RootScreen />
      )}
    </>
  );
};

export default RootView;
