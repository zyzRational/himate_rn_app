import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import RootScreen from './RootScreen';
import {Colors, LoaderScreen} from 'react-native-ui-lib';
import {useSelector, useDispatch} from 'react-redux';
import {initUserStore, setUserInfo} from '../stores/store-slice/userStore';
import {initSettingStore} from '../stores/store-slice/settingStore';
import {initMusicStore} from '../stores/store-slice/musicStore';
import {checkPermissions} from '../stores/store-slice/permissionStore';
import {initChatMsgStore} from '../stores/store-slice/chatMsgStore';
import {useToast} from '../components/commom/Toast';
import {displayName as appDisplayName} from '../../app.json';
import {
  setBaseConfig,
  initBaseConfigStore,
} from '../stores/store-slice/baseConfigStore';
import {
  setErrorMsg,
  clearErrorMsgStore,
} from '../stores/store-slice/errorMsgStore';
import 'react-native-get-random-values';

const RootView = () => {
  const {showToast} = useToast();
  const dispatch = useDispatch();

  const isLogin = useSelector(state => state.userStore.isLogin);
  const userId = useSelector(state => state.userStore.userId);
  const userLoading = useSelector(state => state.userStore.userLoading);

  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  const isFastStatic = useSelector(state => state.settingStore.isFastStatic);
  // getUrl
  const baseConfig = useSelector(state => state.baseConfigStore.baseConfig);
  const configLoading = useSelector(
    state => state.baseConfigStore.configLoading,
  );

  /*  初始化应用设置 */
  const settingInit = async () => {
    dispatch(initBaseConfigStore());
    dispatch(initChatMsgStore());
    dispatch(initSettingStore());
    dispatch(initMusicStore());
    dispatch(checkPermissions());
  };

  /**
   * 监听baseConfig变化，当基本配置信息加载完成后初始化用户存储
   * @effect
   * @dependencies baseConfig
   */
  useEffect(() => {
    if (baseConfig?.BASE_URL) {
      dispatch(initUserStore());
    }
  }, [baseConfig?.BASE_URL]);

  /**
   * 监听isLogin变化，当用户登录状态变化时，更新用户信息
   * @effect
   * @dependencies isLogin, userId
   */
  useEffect(() => {
    if (isLogin && userId) {
      dispatch(setUserInfo(userId));
    }
  }, [isLogin, userId]);

  // 是否启用高速静态资源
  useEffect(() => {
    if (isFastStatic && baseConfig?.FAST_STATIC_URL) {
      const config = {...baseConfig, STATIC_URL: baseConfig.FAST_STATIC_URL};
      dispatch(setBaseConfig(config));
    }
  }, [isFastStatic, baseConfig?.FAST_STATIC_URL]);

  // http请求错误提示
  const errorMsg = useSelector(state => state.errorMsgStore.errorMsg);
  useEffect(() => {
    if (errorMsg) {
      showToast(errorMsg, 'error');
      dispatch(setErrorMsg(null));
    }
    return () => dispatch(clearErrorMsgStore());
  }, [errorMsg]);

  // 应用初始化
  useEffect(() => {
    settingInit();
  }, []);

  return (
    <>
      <StatusBar
        backgroundColor={
          isLogin
            ? isFullScreen
              ? Colors.$backgroundNeutral
              : themeColor
            : Colors.white
        }
        barStyle={
          isLogin
            ? isFullScreen
              ? 'dark-content'
              : 'light-content'
            : 'dark-content'
        } // 字体颜色
        translucent={false} // 将状态栏填充的高度隐藏
        hidden={false}
      />
      {configLoading || userLoading ? (
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
