import instance from '../utils/request/http';

// 添加好友
export const addmate = form => instance.post('api/mate/add', form);

// 修改好友信息
export const editmate = form => instance.put('api/mate/edit', form);

// 删除好友
export const deletemate = id => instance.delete('api/mate/del', {params: {id}});

// 好友列表
export const getmateDetailBymId = data =>
  instance.get('api/mate/detailBymId', {params: data});

// 好友列表
export const getmatelist = data =>
  instance.get('api/mate/list', {params: data});

// 申请好友列表
export const getapplylist = uid =>
  instance.get('api/mate/applylist', {params: {uid}});

// 好友关系
export const getmateStatus = data =>
  instance.get('api/mate/ismate', {params: data});
