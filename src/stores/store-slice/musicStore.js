import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {getMusicDetail} from '../../api/music';
import {addStorage, getkeyStorage} from '../../utils/Storage';

const defaultState = {
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
  switchCount: 0,
};

export const musicSlice = createSlice({
  name: 'musicStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initMusicStore.fulfilled, (state, action) => {
        const {yrcVisible, transVisible, romaVisible, switchCount} =
          action.payload || {};
        state.yrcVisible = yrcVisible ?? false;
        state.transVisible = transVisible ?? true;
        state.romaVisible = romaVisible ?? false;
        state.switchCount = switchCount || 0;
        state.playingMusic = {};
        state.playList = [];
      })
      .addCase(initMusicStore.rejected, () => defaultState);

    builder.addCase(setPlayingMusic.fulfilled, (state, action) => {
      state.playingMusic = action.payload || {};
      state.playingMusic.playtime = Date.now();
    });
  },
  reducers: {
    setPlayList: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.playList = action.payload;
      }
    },
    setLrcFlag: (state, action) => {
      const {yrcVisible, transVisible, romaVisible} = action.payload || {};
      state.yrcVisible = yrcVisible ?? false;
      state.transVisible = transVisible ?? true;
      state.romaVisible = romaVisible ?? false;
      addStorage('music', 'yrcVisible', state.yrcVisible);
      addStorage('music', 'transVisible', state.transVisible);
      addStorage('music', 'romaVisible', state.romaVisible);
    },
    setSwitchCount: (state, action) => {
      state.switchCount = action.payload || 1;
      addStorage('music', 'switchCount', state.switchCount);
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
      state.isClosed = action.payload ?? false;
    },
    setIsRandomPlay: (state, action) => {
      state.isRandomPlay = action.payload ?? false;
    },
    setRandomNum: (state, action) => {
      state.randomNum = action.payload || {min: 1, max: 1};
    },
  },
});

export const initMusicStore = createAsyncThunk(
  'music/initMusicStore',
  async (_, {rejectWithValue}) => {
    try {
      return await getkeyStorage('music');
    } catch (error) {
      console.error(error);
      return rejectWithValue(null); // 错误处理
    }
  },
);

export const setPlayingMusic = createAsyncThunk(
  'music/fetchMusicDetail',
  async music => {
    try {
      const {id} = music || {};
      if (!id) {
        return music;
      }
      if (typeof id === 'string') {
        return music;
      }
      const response = await getMusicDetail({id});
      if (response.success) {
        return response.data;
      } else {
        return music;
      }
    } catch (error) {
      console.error(error);
      return music; // 错误处理
    }
  },
);

export const {
  setLrcFlag,
  setSwitchCount,
  setPlayList,
  addPlayList,
  unshiftPlayList,
  removePlayList,
  setShowMusicCtrl,
  setCloseTime,
  setIsClosed,
  setIsRandomPlay,
  setRandomNum,
} = musicSlice.actions;

export default musicSlice.reducer;
