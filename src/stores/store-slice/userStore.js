import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {addStorage, delStorage, getkeyStorage} from '../../utils/Storage';
import {getUserdetail} from '../../api/user';

const defaultState = {
  userInfo: {},
  userToken: null,
  userId: null,
};

export const userSlice = createSlice({
  name: 'userStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initUserStore.fulfilled, (state, action) => {
        const {userToken, userId} = action.payload || {};
        state.userToken = userToken || null;
        state.userId = userId || null;
      })
      .addCase(initUserStore.rejected, () => defaultState);

    builder
      .addCase(setUserInfo.fulfilled, (state, action) => {
        state.userInfo = action.payload || {};
      })
      .addCase(setUserInfo.rejected, () => defaultState);
  },
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload || null;
      addStorage('user', 'userId', state.userId);
    },
    setUserToken: (state, action) => {
      state.userToken = action.payload || null;
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
      console.log(error);
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
      console.log(error);
      return rejectWithValue(null); // 错误处理
    }
  },
);

export const {setUserToken, setUserId, clearUserStore} = userSlice.actions;

export default userSlice.reducer;
