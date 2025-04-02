import instance from '../utils/request/http';

// 获取用户会话列表uid
export const getUserSessionList = data =>
  instance.get('api/session/list', {params: data});

// 获取用户会话详情session_id
export const getSessionDetail = data =>
  instance.get('api/session/detail', {params: data});

// 删除用户会话
export const dleUserSession = id =>
  instance.delete('api/session/del', {params: {id}});
