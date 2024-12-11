import {configureStore} from '@reduxjs/toolkit';
import userSlice from './store-slice/userStore';
import settingSlice from './store-slice/settingStore';
import chatMsgSlice from './store-slice/chatMsgStore';
import permissionSlice from './store-slice/permissionStore';
import baseConfigSlice from './store-slice/baseConfigStore';
import errorMsgSlice from './store-slice/errorMsgStore';
import musicSlice from './store-slice/musicStore';

export const store = configureStore({
  reducer: {
    userStore: userSlice,
    settingStore: settingSlice,
    chatMsgStore: chatMsgSlice,
    permissionStore: permissionSlice,
    baseConfigStore: baseConfigSlice,
    musicStore: musicSlice,
    errorMsgStore: errorMsgSlice,
  },
});
