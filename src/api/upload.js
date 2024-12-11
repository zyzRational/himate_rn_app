import {getStorage} from '../utils/Storage';
import {store} from '../stores/index';
import RNFetchBlob from 'rn-fetch-blob';

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
