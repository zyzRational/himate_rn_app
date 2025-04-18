import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {addStorage, getkeyStorage} from '../../utils/Storage';

const defaultState = {
  socketReady: false, // socket连接状态
  msgData: {}, // 从服务器获取到的消息数据
  nowSessionId: '', // 当前聊天会话id
  notRemindSessionIds: [], // 不用提醒的会话id列表
};

export const chatMsgSlice = createSlice({
  name: 'chatMsgStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initChatMsgStore.fulfilled, (state, action) => {
        const {notRemindSessionIds} = action.payload || {};
        state.notRemindSessionIds = notRemindSessionIds || [];
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
} = chatMsgSlice.actions;

export default chatMsgSlice.reducer;
