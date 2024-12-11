import instance from '../utils/request/http';

// 获取用户上传的文件列表
export const getUserUploadFiles = data =>
  instance.get('api/upload/list', {params: data});

// 删除用户上传的文件
export const delUserUploadFiles = data =>
  instance.delete('api/upload/del', {params: data});

// 获取用户所有消息
export const getUserMsgList = data =>
  instance.get('api/chat/list', {params: data});

// 删除用户消息
export const delUserMsgs = data =>
  instance.delete('api/chat/del', {params: data});
