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

// 默认配置对象
const defaultConfig = {
  BASE_URL,
  STATIC_URL,
  SOCKET_URL,
  FAST_STATIC_URL,
  MSG_SECRET,
  THUMBNAIL_URL: `${BASE_URL}Thumbnail/`,
};

/**
 * 获取基础配置
 * @returns {Promise<Object|null>} 配置对象或null
 */
export const getBaseConfig = async () => {
  if (!COULD_URL) {
    return defaultConfig;
  }
  try {
    const response = await axios.get(COULD_URL, {
      headers: {Authorization: COULD_SECRET},
    });
    const {data} = response;
    return {
      ...data,
      THUMBNAIL_URL: `${data.BASE_URL}Thumbnail/`,
    };
  } catch (error) {
    console.error('获取云端配置失败:', error);
    return null;
  }
};
