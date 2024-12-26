import {createSlice} from '@reduxjs/toolkit';
import {addStorage} from '../../utils/Storage';
import {SystemThemeInit} from '../../styles';

export const settingSlice = createSlice({
  name: 'settingStore',
  initialState: {
    themeColor: '#5A48F4', // 主题色
    toastType: 'System', // 通知类型
    isPlaySound: true, // 是否播放铃声
    isFullScreen: false, // 是否全屏
    notSaveMsg: false, // 是否保存消息
    isEncryptMsg: true, // 是否加密消息
    isFastStatic: false, // 是否快速静态
    isMusicApp: false, // 是否为音乐应用
  },
  reducers: {
    setPrimaryColor: (state, action) => {
      state.themeColor = action.payload ?? '#5A48F4';
      addStorage('setting', 'PrimaryColor', state.themeColor);
      SystemThemeInit(state.themeColor);
    },
    setToastType: (state, action) => {
      state.toastType = action.payload ?? 'System';
      addStorage('setting', 'toastType', state.toastType);
    },
    setIsFullScreen: (state, action) => {
      state.isFullScreen = action.payload ?? false;
      addStorage('setting', 'isfullScreen', state.isFullScreen);
    },
    setIsPlaySound: (state, action) => {
      state.isPlaySound = action.payload ?? true;
      addStorage('setting', 'isPlaySound', state.isPlaySound);
    },
    setNotSaveMsg: (state, action) => {
      state.notSaveMsg = action.payload ?? false;
      addStorage('setting', 'notSaveMsg', state.notSaveMsg);
    },
    setIsEncryptMsg: (state, action) => {
      state.isEncryptMsg = action.payload ?? true;
      addStorage('setting', 'isEncryptMsg', state.isEncryptMsg);
    },
    setIsFastStatic: (state, action) => {
      state.isFastStatic = action.payload ?? false;
      addStorage('setting', 'isFastStatic', state.isFastStatic);
    },
    setIsMusicApp: (state, action) => {
      state.isMusicApp = action.payload ?? false;
      addStorage('setting', 'isMusicApp', state.isMusicApp);
    },
  },
});

export const {
  setPrimaryColor,
  setToastType,
  setIsPlaySound,
  setIsFullScreen,
  setNotSaveMsg,
  setIsEncryptMsg,
  setIsFastStatic,
  setIsMusicApp,
} = settingSlice.actions;

export default settingSlice.reducer;
