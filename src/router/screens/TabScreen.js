import * as React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Msg from '../../pages/message/index';
import Mate from '../../pages/mate/index';
import User from '../../pages/user/index';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {Colors, TouchableOpacity} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';

const Tab = createBottomTabNavigator();

const renderTabinfo = (name, type, focused = false) => {
  let IconName = '';
  let tablabel = '';
  if (name === 'Msg') {
    IconName = 'comments-o';
    tablabel = '消息';
    if (focused) {
      IconName = 'comments';
    }
  }
  if (name === 'Mate') {
    IconName = 'address-book-o';
    tablabel = '好友';
    if (focused) {
      IconName = 'address-book';
    }
  }
  if (name === 'User') {
    IconName = 'user-o';
    tablabel = '我的';
    if (focused) {
      IconName = 'user';
    }
  }
  if (type === 'icon') {
    return IconName;
  }
  if (type === 'label') {
    return tablabel;
  }
};

const TabScreen = () => {
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarLabel: renderTabinfo(route.name, 'label'),
        tabBarActiveTintColor: themeColor,
        tabBarIcon: ({focused}) => (
          <FontAwesome
            name={renderTabinfo(route.name, 'icon', focused)}
            color={focused ? themeColor : Colors.black}
            size={20}
          />
        ),
        headerShown: !isFullScreen,
        headerStyle: {backgroundColor: themeColor, height: 46},
        headerTitleAlign: 'center',
        headerTitleStyle: {fontSize: 16, color: Colors.white},
      })}>
      <Tab.Screen
        name="Msg"
        options={({navigation}) => ({
          title: '消息',
          headerRight: () => (
            <TouchableOpacity
              paddingR-16
              onPress={() => navigation.navigate('SearchMsg')}>
              <AntDesign name="search1" color={Colors.white} size={20} />
            </TouchableOpacity>
          ),
        })}
        component={Msg}
      />
      <Tab.Screen
        name="Mate"
        options={({navigation}) => ({
          title: 'Mate',
          headerTitleAlign: 'left',
          headerRight: () => (
            <TouchableOpacity
              paddingR-12
              onPress={() => navigation.navigate('Addmate')}>
              <FontAwesome name="user-plus" color={Colors.white} size={20} />
            </TouchableOpacity>
          ),
        })}
        component={Mate}
      />
      <Tab.Screen
        name="User"
        options={{
          title: '个人中心',
        }}
        component={User}
      />
    </Tab.Navigator>
  );
};
export default TabScreen;
