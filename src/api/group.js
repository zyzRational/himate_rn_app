import instance from '../utils/request/http';

// 创建群组
export const addGroup = form => instance.post('api/group/add', form);

// 修改群组信息
export const editGroup = form => instance.put('api/group/edit', form);

// 群组详情
export const getGroupDetail = data =>
  instance.get('api/group/detail', {params: data});

// 删除群组
export const deleteGroup = data => instance.delete('api/group/del', data);
