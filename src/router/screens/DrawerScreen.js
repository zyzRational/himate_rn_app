import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Setting from '../../pages/setting/index';
import StackScreen from '../screens/StackScreen';
import { Colors, TouchableOpacity } from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import Addmate from '../../pages/mate/mate_pages/addMate';
import SearchMsg from '../../pages/message/msg_pages/searchMsg';
import MusicScreen from './MusicScreen';
import BaseWebView from '../../pages/commom/baseWebView';
import Permissions from '../../pages/commom/permissions';
import { fullWidth } from '../../styles';

const Drawer = createDrawerNavigator();

const DrawerScreen = () => {
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  const isMusicApp = useSelector(state => state.settingStore.isMusicApp);

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: themeColor,
        swipeEdgeWidth: fullWidth * 0.16,
      }}
      initialRouteName={isMusicApp ? 'Music' : 'Stack'}>
      <Drawer.Screen
        name="Stack"
        options={{
          title: '主界面',
          headerShown: false,
        }}
        component={StackScreen}
      />
      <Drawer.Screen
        name="Music"
        options={{
          title: '音乐',
          headerShown: false,
        }}
        component={MusicScreen}
      />
      <Drawer.Group
        screenOptions={({ navigation }) => ({
          headerShown: !isFullScreen,
          headerStyle: { backgroundColor: themeColor, height: 46 },
          headerTitleAlign: 'center',
          headerTitleStyle: { fontSize: 16, color: Colors.white },
          headerLeft: () => (
            <TouchableOpacity paddingH-26 onPress={() => navigation.goBack()}>
              <FontAwesome name="angle-left" color={Colors.white} size={26} />
            </TouchableOpacity>
          ),
        })}>
        {isFullScreen ? (
          <>
            <Drawer.Screen
              name="Addmate"
              options={{
                title: '添加好友',
              }}
              component={Addmate}
            />
            <Drawer.Screen
              name="SearchMsg"
              options={{
                title: '搜索消息',
              }}
              component={SearchMsg}
            />
          </>
        ) : null}
        <Drawer.Screen
          name="Setting"
          options={{
            title: '系统设置',
          }}
          component={Setting}
        />
        <Drawer.Screen
          name="Permissions"
          component={Permissions}
          options={{
            title: '权限管理',
          }}
        />
        <Drawer.Screen
          name="WebView"
          component={BaseWebView}
          options={({ route }) => ({
            title: route.params?.title ?? '关于应用',
          })}
        />
      </Drawer.Group>
    </Drawer.Navigator>
  );
};
export default DrawerScreen;
