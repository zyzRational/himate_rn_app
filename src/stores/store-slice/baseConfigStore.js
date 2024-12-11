import {createSlice} from '@reduxjs/toolkit';
import {getBaseConfig} from '../../api/baseConfig';
import {generateSecretKey} from '../../utils/cryptoHandle';

export const baseConfigSlice = createSlice({
  name: 'baseConfigStore',
  initialState: {
    baseConfig: {},
    secretStr: '123456', // 加密密钥串
  },
  reducers: {
    setBaseConfig: (state, action) => {
      state.baseConfig = action.payload ?? {};
      const {MSG_SECRET} = state.baseConfig;
      state.secretStr = generateSecretKey(MSG_SECRET);
    },
  },
});

export const {setBaseConfig} = baseConfigSlice.actions;

/* 请求baseUrl */
export const requestBaseConfig = () => dispatch => {
  getBaseConfig().then(data => {
    if (data) {
      dispatch(setBaseConfig(data));
    }
  });
};

export default baseConfigSlice.reducer;
