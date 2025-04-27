import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {getMusicDetail} from '../../api/music';
import {addStorage, getkeyStorage} from '../../utils/Storage';
import {isEmptyObject} from '../../utils/base';

const defaultState = {
  playingMusic: {},
  playList: [],
  showMusicCtrl: false,
  closeTime: 0,
  isClosed: false,
  randomNum: {min: 1, max: 1},
  isRandomPlay: false,
  switchCount: 0,
};

export const musicSlice = createSlice({
  name: 'musicStore',
  initialState: defaultState,
  extraReducers: builder => {
    builder
      .addCase(initMusicStore.fulfilled, (state, action) => {
        const {switchCount} = action.payload || {};
        state.switchCount = switchCount || 0;
        return state;
      })
      .addCase(initMusicStore.rejected, () => defaultState);

    builder.addCase(setPlayingMusic.fulfilled, (state, action) => {
      state.playingMusic = action.payload || {};
      if (isEmptyObject(state.playingMusic)) {
        return state;
      }
      state.playingMusic.playtime = Date.now();
    });
  },
  reducers: {
    setPlayList: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.playList = action.payload;
      }
    },
    setSwitchCount: (state, action) => {
      state.switchCount = action.payload || 0;
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
      if (!id || typeof id !== 'number') {
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
