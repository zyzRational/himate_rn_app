import instance from '../utils/request/http';

// app详情
export const getAppPackageDetail = data =>
  instance.get('api/appPackage/detail', {params: data});
