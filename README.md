# Himate

### 简介

使用react native开发的一款轻量的聊天软件。

如何使用react native开发：https://reactnative.cn/



### 平台适配

全力适配Android平台，ios暂未做适配，无法正常使用。



### 开始

#### 项目环境

- nodejs v20.11.0
- java JDK17



#### 运行项目

配置服务地址 项目目录/.env

```
1
# BASE_URL=你的服务地址
# STATIC_URL=你的静态资源服务地址
# SOCKET_URL=你的socket服务地址
# FAST_STATIC_URL=你的静态资源服务地址

2
# COULD_URL=获取所有服务接口
# URL_SECRET=获取服务的秘钥
# MSG_SECRET=你的加密消息秘钥
```

如果你的每个服务都是独立的 展开配置 1

如果你使用单独的接口获取你的所有服务，展开配置 2

若使用 配置 2 需要保证 COULD_URL 返回下面格式的数据

```js
{
   BASE_URL:你的服务地址
   STATIC_URL:你的静态资源服务地址
   SOCKET_URL:你的socket服务地址
   FAST_STATIC_URL:你的静态资源服务地址
}
```

安装项目依赖

```
yarn
```

启动

```
yarn android
```

#### 构建安装包

```
cd android
```

debug（测试）版本

```
./gradlew assembleDebug
```

release（正式）版本

1. 使用java生成你自己的签名证书(.keystore)
2. 将.keystore文件放到 项目目录/android/app 文件夹下
3. 配置 项目目录/android/gradle.properties 文件的以下字段

```
RELEASE_STORE_FILE=
RELEASE_KEY_ALIAS=
RELEASE_STORE_PASSWORD=
RELEASE_KEY_PASSWORD=
```

再执行

```
./gradlew assembleRelease
```



### 组件简介

#### 核心组件

[**RNUILib**](https://wix.github.io/react-native-ui-lib/)

一款react native样式组件库，提供了很多必要的基础组件，其中它布局修饰符能让你快速构建出你需要的页面。

**[react-native-gifted-chat](https://github.com/FaridSafi/react-native-gifted-chat)**

聊天应用组件，集成了几乎你能想到的聊天功能。非常好用！



[**Socket.IO**](https://socket.io/zh-CN/)

使用WebSocket双向通信库，使用它的客户端。



##### React Navigation  https://reactnavigation.org/

构建应用的页面导航逻辑。



#### 基础组件

**[react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage )**

缓存数据到本地



