import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {getBaseConfig} from '../../api/baseConfig';
import {generateSecretKey} from '../../utils/handle/cryptoHandle';

const defaultState = {
  baseConfig: {}, // 基础配置
  secretStr: '123456', // 加密密钥串
  configLoading: false, // 加载状态
};

export const baseConfigSlice = createSlice({
  name: 'baseConfigStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initBaseConfigStore.pending, state => {
        state.configLoading = true;
      })
      .addCase(initBaseConfigStore.fulfilled, (state, action) => {
        state.baseConfig = action.payload || {};
        const {MSG_SECRET} = state.baseConfig;
        state.secretStr = generateSecretKey(MSG_SECRET);
        state.configLoading = false;
      })
      .addCase(initBaseConfigStore.rejected, () => defaultState);
  },
  reducers: {
    setBaseConfig: (state, action) => {
      state.baseConfig = action.payload || {};
      const {MSG_SECRET} = state.baseConfig;
      state.secretStr = generateSecretKey(MSG_SECRET);
      return state;
    },
  },
});

export const initBaseConfigStore = createAsyncThunk(
  'config/initBaseConfigStore',
  async (_, {rejectWithValue}) => {
    try {
      const response = await getBaseConfig();
      if (response) {
        return response;
      }
      return rejectWithValue(null);
    } catch (error) {
      console.error(error);
      return rejectWithValue(null); // 错误处理
    }
  },
);

export const {setBaseConfig} = baseConfigSlice.actions;

export default baseConfigSlice.reducer;
