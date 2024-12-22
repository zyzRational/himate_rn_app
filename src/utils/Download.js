import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { displayName as appDisplayName } from '../../app.json';
import { Platform } from 'react-native';

/* 下载文件 */
export const DownloadFile = async (
  fileUrl,
  fileName,
  progressCallback = () => { },
  isInCameraRoll = true,
) => {
  let path = RNFS.DownloadDirectoryPath + `/${appDisplayName}`;
  if (Platform.OS === 'ios') {
    path = RNFS.DocumentDirectoryPath;
  }
  const isDirExists = await RNFS.exists(path);
  if (!isDirExists) {
    RNFS.mkdir(path)
      .then(() => {
        // console.log('创建目录成功');
      })
      .catch(error => {
        console.log(error);
      });
  }
  const downloadDest = `${path}/${fileName}`;
  const options = {
    fromUrl: fileUrl,
    toFile: downloadDest,
    background: true,
    progress: progressCallback,
  };

  const ret = RNFS.downloadFile(options);
  if (!isInCameraRoll) {
    return ret.promise;
  }
  if (isInCameraRoll) {
    return new Promise((resolve, reject) => {
      ret.promise
        .then(res => {
          // 如果下载的是  视频或图片 可以保存到相册，方便查看
          CameraRoll.saveAsset('file://' + downloadDest, {
            album: appDisplayName,
          })
            .then(result => {
              // console.log('down res', result);
              resolve(res);
            })
            .catch(error => {
              // console.error('error2', error);
              resolve(res);
            });
        })
        .catch(error => {
          console.log(error);
          reject(error);
        });
    });
  }
};

/* 写入文件 */
export const writeJSONFile = async (jsonData, fileName) => {
  // 将 JSON 数据转换为字符串
  const jsonString = JSON.stringify(jsonData);

  // 定义文件路径
  const path = RNFS.DownloadDirectoryPath + `/${appDisplayName}`;
  const isDirExists = await RNFS.exists(path);
  if (!isDirExists) {
    RNFS.mkdir(path)
      .then(() => {
        // console.log('创建目录成功');
      })
      .catch(error => {
        console.log(error);
      });
  }
  const writeDest = `${path}/${fileName}`;
  try {
    // 写入文件
    await RNFS.writeFile(writeDest, jsonString, 'utf8');
    return true;
    // console.log('文件写入成功:', path);
  } catch (error) {
    console.error('文件写入失败:', error);
    return false;
  }
};

/* 读取文件 */
export const readJSONFile = async path => {
  try {
    const jsonString = await RNFS.readFile(path, 'utf8');
    const jsonData = JSON.parse(jsonString);
    console.log('jsonData', jsonString);

    // console.log('文件读取成功:', jsonData);
    return jsonData;
  } catch (error) {
    console.error('文件读取失败:', error);
    return null;
  }
};
