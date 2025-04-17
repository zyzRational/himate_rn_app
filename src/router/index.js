import React, {useEffect, useState} from 'react';
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
import {isEmptyObject} from '../utils/base';
import 'react-native-get-random-values';

const RootView = () => {
  const {showToast} = useToast();
  const dispatch = useDispatch();

  const userToken = useSelector(state => state.userStore.userToken);
  const userId = useSelector(state => state.userStore.userId);
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  const isFastStatic = useSelector(state => state.settingStore.isFastStatic);
  // getUrl
  const baseConfig = useSelector(state => state.baseConfigStore.baseConfig);

  /*  初始化应用设置 */
  const settingInit = async () => {
    dispatch(initBaseConfigStore());
    dispatch(initChatMsgStore());
    dispatch(initSettingStore());
    dispatch(initMusicStore());
    dispatch(checkPermissions());
  };

  // 登陆验证
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isEmptyObject(baseConfig)) {
      dispatch(initUserStore());
    }
  }, [baseConfig]);

  useEffect(() => {
    if (userToken && userId) {
      dispatch(setUserInfo(userId));
    }
  }, [userToken, userId]);

  // 是否启用高速静态资源
  useEffect(() => {
    if (isFastStatic && !isEmptyObject(baseConfig)) {
      const config = {...baseConfig, STATIC_URL: baseConfig.FAST_STATIC_URL};
      dispatch(setBaseConfig(config));
    }
  }, [isFastStatic, baseConfig]);

  // http请求错误提示
  const errorMsg = useSelector(state => state.errorMsgStore.errorMsg);
  useEffect(() => {
    if (errorMsg) {
      showToast(errorMsg, 'error');
      dispatch(setErrorMsg(null));
    }
    return () => {
      dispatch(clearErrorMsgStore());
    };
  }, [errorMsg]);

  // 应用初始化
  useEffect(() => {
    settingInit();
  }, []);

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
