import axios from 'axios';
import codeMsg from './errorMsg.js';
import {store} from '../../stores/index.js';
import {clearUserStore} from '../../stores/store-slice/userStore.js';
import {requestBaseConfig} from '../../stores/store-slice/baseConfigStore.js';
import {setErrorMsg} from '../../stores/store-slice/errorMsgStore.js';

const {BASE_URL} = store.getState().baseConfigStore.baseConfig;

// 创建axios实例
console.log('BASE_URL ', BASE_URL);

const instance = axios.create({
  baseURL: BASE_URL || '',
  timeout: 18000,
});

// 添加请求拦截器
instance.interceptors.request.use(
  function (config) {
    const userToken = store.getState().userStore.userToken;
    if (userToken) {
      config.headers.Authorization = 'Bearer ' + userToken; // 让每个请求携带自定义token
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

//添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    if (response.data.code === 200) {
      return response.data;
    } else {
      return Promise.resolve(response.data);
    }
  },

  function (error) {
    console.error(error);
    let {message} = error;
    if (message === 'Network Error') {
      message = '网络连接异常';
    } else if (message.includes('timeout')) {
      message = '网络请求超时';
    } else if (message.includes('Request failed with status code')) {
      const errcode = message.substr(message.length - 3);

      if (errcode === '401') {
        message = codeMsg[errcode];
        store.dispatch(clearUserStore());
      } else if (errcode === '404') {
        message = codeMsg[errcode];
        store.dispatch(requestBaseConfig());
      } else {
        message = error.response.data.message || codeMsg[errcode];
      }
    }
    error.message = message;
    store.dispatch(setErrorMsg(message));
    return Promise.reject(error);
  },
);

export default instance;
