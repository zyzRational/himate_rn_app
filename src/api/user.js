import instance from '../utils/request/http';

// 用户注册
export const userRegMail = form => instance.post('api/user/reg', form);

// 获取验证码
export const getCodeBymail = account =>
  instance.get('api/mail/code', {params: {account}});

// 验证验证码
export const mailValidate = form => instance.post('api/user/validate', form);

// 账号登录
export const AccountuserLogin = form => instance.post('api/user/login', form);

// 验证码登录
export const CodeuserLogin = form => instance.post('api/user/codelogin', form);

// 获取用户详情
export const getUserdetail = params =>
  instance.get('api/user/detail', {params});

// 修改用户信息
export const EditUserInfo = form => instance.put('api/user/edit', form);

// 用户注销
export const userLogOff = data => instance.delete('api/user/del', data);
