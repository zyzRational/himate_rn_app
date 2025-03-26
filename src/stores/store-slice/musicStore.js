import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {getMusicDetail} from '../../api/music';
import {addStorage} from '../../utils/Storage';

export const musicSlice = createSlice({
  name: 'musicStore',
  initialState: {
    playingMusic: {},
    playList: [],
    showMusicCtrl: false,
    closeTime: 0,
    isClosed: false,
    randomNum: {min: 1, max: 1},
    isRandomPlay: false,
    yrcVisible: false,
    transVisible: true,
    romaVisible: false,
  },
  extraReducers: builder => {
    builder
      .addCase(setPlayingMusic.fulfilled, (state, action) => {
        state.playingMusic = action.payload || {};
        state.playingMusic.playtime = Date.now();
      })
      .addCase(setPlayingMusic.rejected, (state, action) => {
        state.playingMusic = action.payload || {};
        state.playingMusic.playtime = Date.now();
      });
  },
  reducers: {
    setPlayList: (state, action) => {
      if (action.payload?.length > 0) {
        state.playList = action.payload;
      }
    },
    setLrcFlag: (state, action) => {
      const {yrcVisible, transVisible, romaVisible} = action.payload;
      if (yrcVisible === null) {
        return;
      }
      state.yrcVisible = yrcVisible;
      state.transVisible = transVisible;
      state.romaVisible = romaVisible;
      addStorage('music', 'yrcVisible', state.yrcVisible);
      addStorage('music', 'transVisible', state.transVisible);
      addStorage('music', 'romaVisible', state.romaVisible);
    },
    addPlayList: (state, action) => {
      if (action.payload?.length > 0) {
        action.payload.forEach(item => {
          if (!state.playList.some(e => e?.id === item?.id)) {
            state.playList.push(item);
          }
        });
      }
    },
    unshiftPlayList: (state, action) => {
      if (action.payload?.length > 0) {
        action.payload.forEach(item => {
          if (!state.playList.some(e => e?.id === item?.id)) {
            state.playList.unshift(item);
          }
        });
      }
    },
    removePlayList: (state, action) => {
      if (action.payload?.length > 0) {
        action.payload.forEach(item => {
          const index = state.playList.findIndex(e => e?.id === item?.id);
          if (index > -1) {
            state.playList.splice(index, 1);
          }
        });
      }
    },
    setShowMusicCtrl: (state, action) => {
      if (
        action.payload.includes('Music') ||
        action.payload.includes('Favorites')
      ) {
        state.showMusicCtrl = true;
      } else {
        state.showMusicCtrl = false;
      }
    },
    setCloseTime: (state, action) => {
      state.closeTime = action.payload || 0;
    },
    setIsClosed: (state, action) => {
      state.isClosed = action.payload || false;
    },
    setIsRandomPlay: (state, action) => {
      state.isRandomPlay = action.payload || false;
    },
    setRandomNum: (state, action) => {
      state.randomNum = action.payload || {min: 1, max: 1};
    },
  },
});

export const setPlayingMusic = createAsyncThunk(
  'music/fetchMusicDetail',
  async (music, {rejectWithValue}) => {
    try {
      const {id} = music;
      if (typeof id === 'string') {
        return music;
      }
      const response = await getMusicDetail({id});
      if (response.code === 200) {
        return response.data;
      } else {
        return music;
      }
    } catch (error) {
      console.log(error);
      return rejectWithValue(music); // 错误处理
    }
  },
);

export const {
  setPlayList,
  addPlayList,
  unshiftPlayList,
  removePlayList,
  setShowMusicCtrl,
  setCloseTime,
  setIsClosed,
  setIsRandomPlay,
  setRandomNum,
  setLrcFlag,
} = musicSlice.actions;

export default musicSlice.reducer;
