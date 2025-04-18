import AsyncStorage from '@react-native-async-storage/async-storage';
import Storage from 'react-native-storage';

export const storage = new Storage({
  // 最大容量，默认值1000条数据循环存储
  size: 1000,

  // 存储引擎：对于RN使用AsyncStorage，对于web使用window.localStorage
  // 如果不指定则数据只会保存在内存中，重启后即丢失
  storageBackend: AsyncStorage,

  // 数据过期时间，默认一整天（1000 * 3600 * 24 毫秒），设为null则永不过期
  defaultExpires: 1000 * 3600 * 24,

  // 读写时在内存中缓存数据。默认启用。
  enableCache: true,

  // 如果storage中没有相应数据，或数据已过期，则会调用相应的sync方法，无缝返回最新数据。
  // sync方法的具体说明会在后文提到，可以在构造函数这里就写好sync的方法，或是写到另一个文件里，这里require引入。
  // 或是在任何时候，直接对storage.sync进行赋值修改
  sync: {},
});

// 增加
export const addStorage = (newKey, newId = null, newValue, time = null) => {
  // 使用key保存数据
  // console.log(newKey, newValue);
  storage.save({
    key: newKey,
    id: newId,
    data: newValue,

    // 设为null,则不过期,这里会覆盖初始化的时效
    expires: time,
  });
};

// 查询
export const getStorage = async (oldKey, oldId = null) => {
  let value = null;
  try {
    value = await storage.load({
      key: oldKey,
      id: oldId,
    });
  } catch (error) {
    console.error('key-id查询失败', error);
  }
  return value;
};

// 查询key下所有数据
export const getkeyStorage = async oldKey => {
  let value = {};
  try {
    const [keys, values] = await Promise.all([
      storage.getIdsForKey(oldKey),
      storage.getAllDataForKey(oldKey),
    ]);
    keys.forEach((key, index) => {
      value[key] = values[index];
    });
  } catch (error) {
    console.error('key查询失败', error);
  }
  return value;
};

// 删除单个key-id数据
export const delStorage = (oldKey, oldId = null) => {
  storage
    .remove({
      key: oldKey,
      id: oldId,
    })
    .then(() => {
      console.log('清除单个key-id成功');
    })
    .catch(error => {
      console.log('清除单个key-id失败', error);
    });
};

// 删除key下所有数据
export const delkeyStorage = oldKey => {
  // console.log('清除', oldKey);
  storage
    .clearMapForKey(oldKey)
    .then(() => {
      console.log('清除key-storage成功');
    })
    .catch(error => {
      console.log('清除key-storage失败', error);
    });
};

// 清空
export const clearStorage = () => {
  storage
    .clearMap()
    .then(() => {
      console.log('清除storage成功');
    })
    .catch(error => {
      console.log('清除storage失败', error);
    });
};
