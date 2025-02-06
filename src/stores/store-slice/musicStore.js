import {createSlice} from '@reduxjs/toolkit';

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
  },
  reducers: {
    setPlayingMusic: (state, action) => {
      state.playingMusic = action.payload || {};
      state.playingMusic.playtime = Date.now();
    },
    setPlayList: (state, action) => {
      if (action.payload?.length > 0) {
        state.playList = action.payload;
      }
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
    resetMusicStore: state => {
      state.playingMusic = {};
      state.playList = [];
      state.showMusicCtrl = false;
      state.closeTime = 0;
      state.isClosed = false;
      state.randomNum = {min: 1, max: 1};
      state.isRandomPlay = false;
    },
  },
});

export const {
  setPlayingMusic,
  setPlayList,
  addPlayList,
  unshiftPlayList,
  removePlayList,
  setShowMusicCtrl,
  setCloseTime,
  setIsClosed,
  setIsRandomPlay,
  setRandomNum,
  resetMusicStore,
} = musicSlice.actions;

export default musicSlice.reducer;
