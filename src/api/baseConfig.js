import axios from 'axios';
import {
  COULD_URL,
  COULD_SECRET,
  BASE_URL,
  STATIC_URL,
  SOCKET_URL,
  FAST_STATIC_URL,
  MSG_SECRET,
} from '@env';

/* 获取baseUrl */
export const getBaseConfig = async () => {
  if (COULD_URL) {
    try {
      const response = await axios.get(COULD_URL, {
        headers: {
          Authorization: COULD_SECRET,
        },
      });
      const {data} = response;
      return {
        ...data,
        THUMBNAIL_URL: data?.BASE_URL + 'Thumbnail/',
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
