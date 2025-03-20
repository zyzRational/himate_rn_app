import {displayName as appDisplayName} from '../../../app.json';
import {Platform} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import {getStorage} from '../../utils/Storage';
import {store} from '../../stores/index';
import {
  textExtNames,
  docTypes,
  excelTypes,
  pptTypes,
  pdfTypes,
} from '../../constants/baseConst.js';
import {Colors} from 'react-native-ui-lib';

/* 下载文件 */
export const DownloadFile = async (
  fileUrl,
  fileName,
  Callback = () => {},
  isInCameraRoll = false,
  isSystemDownload = true,
) => {
  // 处理下载路径
  const dirs = RNFetchBlob.fs.dirs;
  let path = dirs.DownloadDir;

  if (isInCameraRoll) {
    path = dirs.DCIMDir;
  }
  if (Platform.OS === 'ios') {
    path = dirs.DocumentDir;
  }
  const downloadDest = `${path}/${appDisplayName}/${fileName}`;

  // 处理下载配置
  let config = {path: downloadDest, fileCache: false};
  if (Platform.OS === 'ios') {
    config.IOSBackgroundTask = true;
    config.indicator = true;
  } else if (Platform.OS === 'android' && isSystemDownload) {
    delete config.path;
    config.addAndroidDownloads = {
      useDownloadManager: true,
      notification: true,
      mime: 'application/octet-stream',
      path: downloadDest,
      title: fileName,
      description: appDisplayName + '文件下载',
    };
  }

  // 开始下载
  return new Promise(resolve => {
    RNFetchBlob.config(config)
      .fetch('GET', fileUrl)
      .progress((received, total) => {
        Callback((received / total).toFixed(2) * 100);
      })
      .then(resp => {
        resolve(resp.path());
        // console.log('下载成功:', resp.path());
      })
      .catch(error => {
        resolve(null);
        console.log(error);
      });
  });
};

/* 写入文件 */
export const writeJSONFile = async (jsonData, fileName) => {
  // 将 JSON 数据转换为字符串
  const jsonString = JSON.stringify(jsonData);

  // 定义文件路径
  const path = RNFetchBlob.fs.dirs.DownloadDir + `/${appDisplayName}`;
  const isDirExists = await RNFetchBlob.fs.exists(path);
  if (!isDirExists) {
    const flag = await RNFetchBlob.fs.mkdir(path);
    if (!flag) {
      console.error('创建文件夹失败:', path);
      return false;
    }
  }
  const writeDest = `${path}/${fileName}`;
  return new Promise(resolve => {
    RNFetchBlob.fs
      .writeFile(writeDest, jsonString, 'utf8')
      .then(() => {
        resolve(true);
        // console.log('文件写入成功:', path);
      })
      .catch(error => {
        console.error('文件写入失败:', error);
        resolve(false);
      });
  });
};

/* 读取文件 */
export const readJSONFile = async path => {
  try {
    const jsonString = await RNFetchBlob.fs.readFile(path, 'utf8');
    const jsonData = JSON.parse(jsonString);
    console.log('jsonData', jsonString);

    // console.log('文件读取成功:', jsonData);
    return jsonData;
  } catch (error) {
    console.error('文件读取失败:', error);
    return null;
  }
};

/* 上传文件 */
export const UploadFile = async (
  fileData,
  callback = () => {},
  params = {},
) => {
  const {BASE_URL} = store.getState().baseConfigStore.baseConfig;
  const userToken = await getStorage('user', 'userToken');
  const {uid, fileType, useType} = params;

  return RNFetchBlob.fetch(
    'POST',
    BASE_URL +
      'api/upload/file' +
      `?uid=${uid}&file_type=${fileType}&use_type=${useType}`,
    {
      Authorization: 'Bearer ' + userToken,
      'Content-Type': 'multipart/form-data',
    },
    [fileData],
  ).uploadProgress((written, total) => {
    callback((written / total).toFixed(2) * 100);
  });
};

/* 获取文件名 */
export const getFileName = url => {
  // 使用最后一个'/'作为分隔符来分割字符串
  try {
    const parts = url?.split('/');
    // parts数组的最后一个元素是文件名
    const fileName = parts[parts.length - 1];
    return fileName;
  } catch (error) {
    console.log(error);
    return '';
  }
};

/* 获取文件扩展名 */
export const getFileExt = url => {
  const lastIndex = url?.lastIndexOf('.');
  let ext = '';
  if (lastIndex > -1 && lastIndex < url.length - 1) {
    ext = url?.slice(lastIndex + 1);
  }
  return ext;
};

/* 获取文件图标颜色 */
export const getFileColor = ext => {
  let color = Colors.yellow40;
  if (textExtNames.includes(ext)) {
    color = Colors.grey40;
  }
  if (docTypes.includes(ext)) {
    color = Colors.blue40;
  }
  if (excelTypes.includes(ext)) {
    color = Colors.green40;
  }
  if (pptTypes.includes(ext)) {
    color = Colors.orange40;
  }
  if (pdfTypes.includes(ext)) {
    color = Colors.red40;
  }
  return color;
};
