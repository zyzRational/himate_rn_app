import {createSlice} from '@reduxjs/toolkit';
import {addStorage, delStorage} from '../../utils/Storage';

export const userSlice = createSlice({
  name: 'userStore',
  initialState: {
    userInfo: null,
    userToken: null,
  },
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload || null;
      addStorage('user', 'userId', state.userInfo.id);
    },
    setUserToken: (state, action) => {
      state.userToken = action.payload || null;
      addStorage('user', 'userToken', state.userToken);
    },
    clearUserStore: state => {
      state.userInfo = null;
      state.userToken = null;
      delStorage('user', 'userId');
      delStorage('user', 'userToken');
    },
  },
});

export const {setUserInfo, setUserToken, clearUserStore} = userSlice.actions;

export default userSlice.reducer;
