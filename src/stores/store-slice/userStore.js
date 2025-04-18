import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {addStorage, delStorage, getkeyStorage} from '../../utils/Storage';
import {getUserdetail} from '../../api/user';

const defaultState = {
  userInfo: {}, // 用户信息
  userToken: null, // 用户token
  userId: null, // 用户id
  isLogin: false, // 是否登录
  userLoading: false, // 用户信息加载状态
};

export const userSlice = createSlice({
  name: 'userStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initUserStore.pending, state => {
        state.userLoading = true;
      })
      .addCase(initUserStore.fulfilled, (state, action) => {
        const {userToken, userId} = action.payload || {};
        state.userToken = userToken || null;
        state.userId = userId || null;
        state.isLogin = state.userToken && state.userId;
        state.userLoading = false;
      })
      .addCase(initUserStore.rejected, () => defaultState);

    builder
      .addCase(setUserInfo.fulfilled, (state, action) => {
        state.userInfo = action.payload || {};
      })
      .addCase(setUserInfo.rejected, () => defaultState);
  },
  reducers: {
    setIsLogin: (state, action) => {
      const {userToken, userId} = action.payload || {};
      state.userToken = userToken || null;
      state.userId = userId || null;
      state.isLogin = state.userToken && state.userId;
      addStorage('user', 'userId', state.userId);
      addStorage('user', 'userToken', state.userToken);
    },
    clearUserStore: () => {
      delStorage('user', 'userId');
      delStorage('user', 'userToken');
      return defaultState;
    },
  },
});

export const initUserStore = createAsyncThunk(
  'user/initUserStore',
  async (_, {rejectWithValue}) => {
    try {
      return await getkeyStorage('user');
    } catch (error) {
      console.error(error);
      return rejectWithValue(null); // 错误处理
    }
  },
);

export const setUserInfo = createAsyncThunk(
  'user/setUserInfo',
  async (user_id, {rejectWithValue}) => {
    try {
      const userRes = await getUserdetail({id: user_id});
      if (userRes.success) {
        return userRes.data;
      } else {
        return rejectWithValue(null);
      }
    } catch (error) {
      console.error(error);
      return rejectWithValue(null); // 错误处理
    }
  },
);

export const {setIsLogin, clearUserStore} = userSlice.actions;

export default userSlice.reducer;
