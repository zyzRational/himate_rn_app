import instance from '../utils/request/http';

// 创建群组
export const addGroup = form => instance.post('api/group/add', form);

// 修改群组信息
export const editGroup = form => instance.put('api/group/edit', form);

// 群组详情
export const getGroupDetail = group_id =>
  instance.get('api/group/detailBygId', {params: {group_id}});

// 删除群组
export const deleteGroup = id =>
  instance.delete('api/group/del', {params: {id}});

// 群组列表
export const getGrouplist = data =>
  instance.get('api/group/list', {params: data});
