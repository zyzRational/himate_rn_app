import {pinyin} from 'pinyin-pro';
import RNFetchBlob from 'rn-fetch-blob';
import {Platform} from 'react-native';
import {getFileExt} from './handle/fileHandle';
import {
  audioExtNames,
  imageExtNames,
  videoExtNames,
  textExtNames,
  docTypes,
  excelTypes,
  pptTypes,
} from '../constants/baseConst';

// 判断是否为空字符串
export const isEmptyString = str => {
  return str === null || str === undefined || str === '' || str.trim() === '';
};

/* 判断是否为空对象 */
export const isEmptyObject = obj => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

// 验证邮箱
export const ValidateMail = mail => {
  const pattern = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  return pattern.test(mail);
};

// 获取首字母
export const getFirstLetter = word => {
  if (word.length === 0) {
    return false;
  }
  const Aword = word[0];

  // 为中文字符返回拼音首字母
  const pattern_Ch = new RegExp('[\u4E00-\u9FA5]');
  if (pattern_Ch.test(Aword)) {
    const firstLetter = pinyin(Aword, {
      pattern: 'first',
      toneType: 'none',
    });
    return firstLetter.toUpperCase();
  }

  // 为英文字符返回大写字母
  const pattern_En = new RegExp('[A-Za-z]');
  if (pattern_En.test(Aword)) {
    return Aword.toUpperCase();
  }

  // 其他字符返回#
  return '#';
};

/* 深拷贝对象 */
export const deepClone = (obj, hash = new WeakMap()) => {
  // 基本类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 日期对象
  if (obj instanceof Date) {
    return new Date(obj);
  }

  // RegExp 对象
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }

  // 数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item, hash));
  }

  // 对象
  if (obj.constructor === Object) {
    // 检查循环引用
    if (hash.has(obj)) {
      return hash.get(obj);
    }

    let cloneObj = {};
    hash.set(obj, cloneObj);

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneObj[key] = deepClone(obj[key], hash);
      }
    }

    return cloneObj;
  }

  // 对于其他对象，如函数、Map、Set等，这里简单处理为null或抛出错误
  // 实际应用中可以根据需求进行扩展
  throw new Error('Unable to copy obj! Its type is not supported.');
};

/* 反转字符串 */
export const reverseString = str => {
  return [...str].reverse().join('');
};

/*  获取文件来自react-native-image-crop-picker */
export const getfileFormdata = (doName, fileInfo) => {
  // console.log('fileInfo', fileInfo);
  // fileInfo.mime 文件类型
  const baseType = fileInfo.mime;

  let type = 'image';
  if (baseType.startsWith('image/')) {
    type = 'image';
  } else if (baseType.startsWith('video/')) {
    type = 'video';
  } else if (baseType.startsWith('audio/')) {
    type = 'audio';
  }

  const uri = fileInfo.path;
  const ext = getFileExt(uri);

  const file = {
    name: 'file',
    filename: `${doName}_${type}_${Math.random()
      .toString(16)
      .substring(2)}.${ext}`,
    data: RNFetchBlob.wrap(fileInfo.path),
  };

  return {
    file,
    type,
    uri,
    ext,
  };
};

/*  获取文件来自react-native-document-picker */
export const getDocumentfileFormdata = (
  doName,
  fileInfo,
  useOriginalName = false,
) => {
  // console.log('fileInfo', fileInfo);
  // fileInfo.mime 文件类型
  const baseType = fileInfo.type;
  const oringalName = fileInfo.name;
  const ext = getFileExt(oringalName);

  let type = 'other';
  if (baseType.startsWith('image/') || imageExtNames.includes(ext)) {
    type = 'image';
  } else if (baseType.startsWith('video/') || videoExtNames.includes(ext)) {
    type = 'video';
  } else if (baseType.startsWith('audio/') || audioExtNames.includes(ext)) {
    type = 'audio';
  } else if (
    textExtNames.includes(ext) ||
    docTypes.includes(ext) ||
    excelTypes.includes(ext) ||
    pptTypes.includes(ext) ||
    pptTypes.includes(ext)
  ) {
    type = 'text';
  }

  const file = {
    name: 'file',
    filename: useOriginalName
      ? oringalName
      : `${doName}_${type}_${Math.random().toString(16).substring(2)}.${ext}`,
    data: RNFetchBlob.wrap(fileInfo.uri),
  };
  return {
    file,
    type,
    uri: fileInfo.uri,
    ext,
  };
};

/*  获取录音文件来自react-native-audio-recorder-player */
export const getRecordfileFormdata = (doName, filePath) => {
  // console.log('fileInfo', filePath);
  const type = 'audio';

  const ext = getFileExt(filePath);

  const file = {
    name: 'file',
    filename: `${doName}_${type}_${Math.random()
      .toString(16)
      .substring(2)}.${ext}`,
    data: Platform.OS === 'ios' ? filePath : RNFetchBlob.wrap(filePath),
  };

  return {
    file,
    type,
    uri: filePath,
    ext,
  };
};

/* 生成随机6位数字 */
export const createRandomNumber = () => {
  const code = (parseInt(String(Math.random() * 1000000), 10) + 1000000)
    .toString()
    .slice(0, 6);
  return Number(code);
};

/* 生成随机字符 */
export const createRandomLetters = count => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < count; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// 生成随机整数
export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/* 格式化秒数 */
export const formatSeconds = num => {
  const seconds = Math.floor(num);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatMilliseconds = ms => {
  // 将毫秒转换为总秒数
  const totalSeconds = Math.floor(ms / 1000);

  // 计算分钟和秒数
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 使用字符串格式化确保两位数
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // 返回格式化的时间字符串
  return `${formattedMinutes}:${formattedSeconds}`;
};
