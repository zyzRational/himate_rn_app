import instance from '../utils/request/http';

// 添加歌单
export const addFavorities = form => instance.post('api/favorites/add', form);

// 歌单列表
export const getFavoritesList = data =>
  instance.get('/api/favorites/list', {params: data});

// 歌单详情
export const getFavoritesDetail = data =>
  instance.get('api/favorites/detail', {params: data});

// 修改歌单
export const updateFavorites = data => instance.put('api/favorites/edit', data);

// 删除歌单
export const deleteFavorites = data =>
  instance.delete('api/favorites/del', {params: data});

// 我的收藏
export const editDefaultFavorites = data =>
  instance.post('api/favorites/default', data);

// 音乐列表
export const getMusicList = data =>
  instance.get('api/music/list', {params: data});
