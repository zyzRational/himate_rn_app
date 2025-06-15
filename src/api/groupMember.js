import instance from '../utils/request/http';

// 创建群成员
export const addGroupMember = form =>
  instance.post('api/groupMember/add', form);

// 修改群群成员信息
export const editGroupMember = form =>
  instance.put('api/groupMember/edit', form);

// 加入的群列表
export const getAllJoinGroupList = data =>
  instance.get('api/groupMember/joinGroup', {params: data});

// 删除群成员
export const deleteGroupMember = data =>
  instance.delete('api/groupMember/del', {params: data});
