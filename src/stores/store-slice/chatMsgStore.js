import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {addStorage, getkeyStorage} from '../../utils/Storage';

const defaultState = {
  socketReady: false, // socket连接状态
  msgData: {}, // 从服务器获取到的消息数据
  nowSessionId: '', // 当前聊天会话id
  remindSessions: [], // 待提醒的会话列表
  notRemindSessionIds: [], // 不用提醒的会话id列表
};

export const chatMsgSlice = createSlice({
  name: 'chatMsgStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initChatMsgStore.fulfilled, (_, action) => {
        const {notRemindSessionIds, remindSessions} = action.payload || {};
        return {
          ...defaultState,
          remindSessions: remindSessions || [],
          notRemindSessionIds: notRemindSessionIds || [],
        };
      })
      .addCase(initChatMsgStore.rejected, () => defaultState);
  },
  reducers: {
    setChatMsg: (state, action) => {
      state.msgData = action.payload || {};
    },
    setSocketState: (state, action) => {
      state.socketReady = action.payload ?? false;
    },
    setNowSessionId: (state, action) => {
      state.nowSessionId = action.payload || '';
    },
    setNotRemindSessionIds: (state, action) => {
      if (state.notRemindSessionIds.includes(action.payload)) {
        return;
      }
      state.notRemindSessionIds.push(action.payload);
      addStorage('chat', 'notRemindSessionIds', state.notRemindSessionIds);
    },
    delNotRemindSessionIds: (state, action) => {
      const index = state.notRemindSessionIds.indexOf(action.payload);
      if (index === -1) {
        return;
      }
      state.notRemindSessionIds.splice(index, 1);
      addStorage('chat', 'notRemindSessionIds', state.notRemindSessionIds);
    },
    setRemindSessions: (state, action) => {
      if (state.remindSessions.includes(action.payload)) {
        return;
      }
      state.remindSessions.push(action.payload);
      addStorage('chat', 'remindSessions', state.remindSessions);
    },
    delRemindSessions: (state, action) => {
      const index = state.remindSessions.indexOf(action.payload);
      if (index === -1) {
        return;
      }
      state.remindSessions.splice(index, 1);
      addStorage('chat', 'remindSessions', state.remindSessions);
    },
  },
});

export const initChatMsgStore = createAsyncThunk(
  'chat/initChatMsgStore',
  async (_, {rejectWithValue}) => {
    try {
      return await getkeyStorage('chat');
    } catch (error) {
      console.error(error);
      return rejectWithValue(null); // 错误处理
    }
  },
);

export const {
  setChatMsg,
  setSocketState,
  setNowSessionId,
  setNotRemindSessionIds,
  delNotRemindSessionIds,
  setRemindSessions,
  delRemindSessions,
} = chatMsgSlice.actions;

export default chatMsgSlice.reducer;
