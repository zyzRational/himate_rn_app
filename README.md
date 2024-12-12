![输入图片说明](android/app/src/main/res/mipmap-hdpi/ic_launcher.png)
# Himate

### 简介

使用react native 0.75.4 开发的一款轻量的聊天和音乐播放器软件。

如何使用react native：https://reactnative.dev/



### 平台适配

全力适配Android平台，ios暂未做适配，无法正常使用。



### 开始

#### 项目环境

- nodejs > 18
- java JDK17



#### 运行项目

如果使用Android14运行先进行如下修改

```java
./node_modules/react-native-musicontrol/android/java/com/tanguyantoine/react/MusicControlModule.java:204: 
原代码：context.registerReceiver(receiver, filter);
修改为：context.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
```

配置项目环境：项目目录.env文件

```
1
BASE_URL=你的服务地址
STATIC_URL=你的静态资源服务地址
SOCKET_URL=你的socket服务地址
FAST_STATIC_URL=你的静态资源服务地址
MSG_SECRET=你的加密消息秘钥

2
COULD_URL=获取所有服务接口
```

选择一种方式作为你的环境配置：

- 如果你的每个服务都是独立的 ，使用配置 1
- 如果你使用一个的接口统一的获取你的所有服务，使用配置 2


若使用 配置 2 需要保证 COULD_URL 接口返回配置1的json数据

```json
{
   BASE_URL:你的服务地址
   STATIC_URL:你的静态资源服务地址
   SOCKET_URL:你的socket服务地址
   FAST_STATIC_URL:你的静态资源服务地址
}
```

**注意**

.env文件主要用于作为配置示例，不建议直接配置.env文件作为您的项目环境，建议新建如.env.dev或.env.prod这样的多个.env文件进行多环境配置，若配置不生效可尝试使用其它命名，同时注意添加到.gitignore，以免造成隐私泄露。

然后使用例如以下命令启动Metro

```
yarn start:dev 或 yarn start:prod
```

安装项目依赖

```
yarn
```

启动安卓模拟器后或连接真机后使用以下命令启动项目

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
RELEASE_STORE_FILE=您的keystore
RELEASE_KEY_ALIAS=
RELEASE_STORE_PASSWORD=
RELEASE_KEY_PASSWORD=
```

再执行

```
./gradlew assembleRelease
```
构建完成的安装包位于：项目目录\android\app\build\outputs\apk\release

### 其它

后端服务详见https://gitee.com/zyz1720/himate_nest_sever

后台管理详见https://gitee.com/zyz1720/himate_vue_backend