import axios from 'axios';
import {
  COULD_URL,
  BASE_URL,
  STATIC_URL,
  SOCKET_URL,
  FAST_STATIC_URL,
  MSG_SECRET,
} from '@env';

const reqSecret =
  '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e';

/* 获取baseUrl */
export const getBaseConfig = async () => {
  if (COULD_URL) {
    try {
      const response = await axios.get(COULD_URL, {
        headers: {
          Authorization: reqSecret,
        },
      });
      // console.log(response.data);
      return {
        ...response.data,
        THUMBNAIL_URL: response.data?.BASE_URL + 'Thumbnail/',
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  } else {
    return {
      BASE_URL,
      STATIC_URL,
      SOCKET_URL,
      FAST_STATIC_URL,
      MSG_SECRET,
      THUMBNAIL_URL: BASE_URL + 'Thumbnail/',
    };
  }
};
