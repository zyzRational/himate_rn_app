import {createSlice} from '@reduxjs/toolkit';
import {Platform} from 'react-native';
import {
  requestNotifications,
  request,
  checkNotifications,
  checkMultiple,
  PERMISSIONS,
  openSettings,
  requestMultiple,
} from 'react-native-permissions';

const defaultState = {
  accessCamera: false, // 相机权限
  accessMicrophone: false, // 麦克风权限
  accessFolder: false, // 文件夹权限
  accessNotify: false, // 通知权限
};

export const permissionSlice = createSlice({
  name: 'settingStore',
  initialState: defaultState,
  reducers: {
    setAllPermissions: (state, action) => {
      state.accessCamera = action.payload.accessCamera;
      state.accessMicrophone = action.payload.accessMicrophone;
      state.accessFolder = action.payload.accessFolder;
      state.accessNotify = action.payload.accessNotify;
    },
    setAccessCamera: (state, action) => {
      state.accessCamera = action.payload;
    },
    setAccessMicrophone: (state, action) => {
      state.accessMicrophone = action.payload;
    },
    setAccessFolder: (state, action) => {
      state.accessFolder = action.payload;
    },
    setAccessNotify: (state, action) => {
      state.accessNotify = action.payload;
    },
  },
});

export const {
  setAllPermissions,
  setAccessCamera,
  setAccessMicrophone,
  setAccessFolder,
  setAccessNotify,
} = permissionSlice.actions;

/* 检查系统所有所需权限 */
export const checkPermissions = () => dispatch => {
  let permissions = [];
  if (Platform.OS === 'android') {
    permissions = [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
    ];
  }
  if (Platform.OS === 'ios') {
    permissions = [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.MICROPHONE,
      PERMISSIONS.IOS.MEDIA_LIBRARY,
      PERMISSIONS.IOS.PHOTO_LIBRARY,
      PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
    ];
  }

  const permissionObj = {};

  checkMultiple(permissions).then(statuses => {
    // console.log('Permissions', statuses);
    if (Platform.OS === 'android') {
      permissionObj.accessCamera =
        statuses[PERMISSIONS.ANDROID.CAMERA] === 'granted';
      permissionObj.accessFolder =
        statuses[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === 'granted' ||
        (statuses[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === 'granted' &&
          statuses[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO] === 'granted' &&
          statuses[PERMISSIONS.ANDROID.READ_MEDIA_AUDIO] === 'granted');
      permissionObj.accessMicrophone =
        statuses[PERMISSIONS.ANDROID.RECORD_AUDIO] === 'granted';
    }
    if (Platform.OS === 'ios') {
      permissionObj.accessCamera =
        statuses[PERMISSIONS.IOS.CAMERA] === 'granted';
      permissionObj.accessFolder =
        statuses[PERMISSIONS.IOS.MEDIA_LIBRARY] === 'granted';
      permissionObj.accessMicrophone =
        statuses[PERMISSIONS.IOS.MICROPHONE] === 'granted';
    }
    checkNotifications().then(({status}) => {
      permissionObj.accessNotify = status === 'granted';
      dispatch(setAllPermissions(permissionObj));
    });
  });
};

/* 请求相机权限 */
export const requestCameraPermission = () => dispatch => {
  if (Platform.OS === 'android') {
    request(PERMISSIONS.ANDROID.CAMERA).then(status => {
      dispatch(setAccessCamera(status === 'granted'));
      if (status !== 'granted') {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
    });
  }
  if (Platform.OS === 'ios') {
    request(PERMISSIONS.IOS.CAMERA).then(status => {
      dispatch(setAccessCamera(status === 'granted'));
      if (status !== 'granted') {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
    });
  }
};

/* 请求录音权限 */
export const requestMicrophonePermission = () => dispatch => {
  if (Platform.OS === 'android') {
    request(PERMISSIONS.ANDROID.RECORD_AUDIO).then(status => {
      dispatch(setAccessMicrophone(status === 'granted'));
      if (status !== 'granted') {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
    });
  }
  if (Platform.OS === 'ios') {
    request(PERMISSIONS.IOS.MICROPHONE).then(status => {
      dispatch(setAccessMicrophone(status === 'granted'));
      if (status !== 'granted') {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
    });
  }
};

/* 请求文件夹权限 */
export const requestFolderPermission = () => dispatch => {
  if (Platform.OS === 'android') {
    requestMultiple([
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ]).then(statuses => {
      const isGranted =
        statuses[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === 'granted' ||
        (statuses[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === 'granted' &&
          statuses[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO] === 'granted' &&
          statuses[PERMISSIONS.ANDROID.READ_MEDIA_AUDIO] === 'granted');
      dispatch(setAccessFolder(isGranted));
      if (!isGranted) {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
    });
  }
  if (Platform.OS === 'ios') {
    request(PERMISSIONS.IOS.MEDIA_LIBRARY).then(status => {
      dispatch(setAccessFolder(status === 'granted'));
      if (status !== 'granted') {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
    });
  }
};

/* 请求通知权限 */
export const requestNotifyPermission = () => dispatch => {
  if (Platform.OS === 'ios') {
    openSettings().catch(() => console.warn('打开设置失败'));
  }
  if (Platform.OS === 'android') {
    requestNotifications().then(({status}) => {
      if (status !== 'granted') {
        openSettings().catch(() => console.warn('打开设置失败'));
      }
      dispatch(setAccessNotify(status === 'granted'));
    });
  }
};

export default permissionSlice.reducer;
