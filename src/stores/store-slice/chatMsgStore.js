import {createSlice} from '@reduxjs/toolkit';
import {addStorage} from '../../utils/Storage';

export const chatMsgSlice = createSlice({
  name: 'chatMsgStore',
  initialState: {
    socketReady: false, // socket连接状态
    msgData: {}, // 从服务器获取到的消息数据
    nowSessionId: '', // 当前聊天会话id
    notRemindSessionIds: [], // 不用提醒的会话id列表
  },
  reducers: {
    setChatMsg: (state, action) => {
      state.msgData = action.payload ?? {};
    },
    setSocketState: (state, action) => {
      state.socketReady = action.payload ?? false;
    },
    setNowSessionId: (state, action) => {
      state.nowSessionId = action.payload ?? '';
    },
    setNotRemindSessionIds: (state, action) => {
      if (state.notRemindSessionIds.includes(action.payload)) {
        return;
      }
      state.notRemindSessionIds.push(action.payload);
      addStorage('chat', 'notRemindSessionIds', state.notRemindSessionIds);
    },
    initNotRemindSessionIds: (state, action) => {
      state.notRemindSessionIds = action.payload ?? [];
      addStorage('chat', 'notRemindSessionIds', state.notRemindSessionIds);
    },
    delNotRemindSessionIds: (state, action) => {
      const index = state.notRemindSessionIds.indexOf(action.payload);
      if (index > -1) {
        state.notRemindSessionIds.splice(index, 1);
      }
      addStorage('chat', 'notRemindSessionIds', state.notRemindSessionIds);
    },
  },
});

export const {
  setChatMsg,
  setSocketState,
  setNowSessionId,
  setNotRemindSessionIds,
  initNotRemindSessionIds,
  delNotRemindSessionIds,
} = chatMsgSlice.actions;

export default chatMsgSlice.reducer;
