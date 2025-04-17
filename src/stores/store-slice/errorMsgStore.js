import {createSlice} from '@reduxjs/toolkit';

const defaultState = {
  errorMsg: null,
  errorMsgList: [],
};

export const errorMsgSlice = createSlice({
  name: 'errorMsgStore',
  initialState: defaultState,
  reducers: {
    setErrorMsg: (state, action) => {
      if (!state.errorMsgList.includes(action.payload)) {
        state.errorMsgList.push(action.payload);
        state.errorMsg = action.payload ?? null;
      }
    },
    clearErrorMsgStore: () => defaultState,
  },
});

export const {setErrorMsg, clearErrorMsgStore} = errorMsgSlice.actions;

export default errorMsgSlice.reducer;
