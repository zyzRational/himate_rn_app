import {createSlice} from '@reduxjs/toolkit';

export const errorMsgSlice = createSlice({
  name: 'errorMsgStore',
  initialState: {
    errorMsg: null,
    errorMsgList: [],
  },
  reducers: {
    setErrorMsg: (state, action) => {
      if (!state.errorMsgList.includes(action.payload)) {
        state.errorMsgList.push(action.payload);
        state.errorMsg = action.payload ?? null;
      }
    },
  },
});

export const {setErrorMsg} = errorMsgSlice.actions;

export default errorMsgSlice.reducer;
