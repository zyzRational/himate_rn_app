import instance from '../utils/request/http';

// 获取会话房间名称
export const getBaseConst = () => instance.get('api/BaseConst');
