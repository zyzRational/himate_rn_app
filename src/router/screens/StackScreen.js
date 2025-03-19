import * as React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {Colors, TouchableOpacity} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import TabScreen from './TabScreen';
import EditUser from '../../pages/user/user_pages/editUser';
import AccountSafe from '../../pages/user/user_pages/accountSafe';
import BaseQRCode from '../../pages/user/user_pages/qrCode';
import Addmate from '../../pages/mate/mate_pages/addMate';
import Mateinfo from '../../pages/mate/mate_pages/mateInfo';
import Newmate from '../../pages/mate/mate_pages/newMate';
import Chat from '../../pages/message/msg_pages/chat';
import ChatHistory from '../../pages/message/msg_pages/chatHistory';
import CreateGroup from '../../pages/group/createGroup';
import GroupInfo from '../../pages/group/groupInfo';
import Grouplist from '../../pages/group/groupList';
import SearchMsg from '../../pages/message/msg_pages/searchMsg';
import ChatMsg from '../../pages/user/user_pages/chatMsg';
import DataManager from '../../pages/user/user_pages/dataManager';
import BasePdfView from '../../pages/commom/basePdfView';

const Stack = createStackNavigator();

function StackScreen() {
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  return (
    <Stack.Navigator initialRouteName="TabBar">
      <Stack.Screen
        name="TabBar"
        component={TabScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Group
        screenOptions={({navigation}) => ({
          headerShown: !isFullScreen,
          headerStyle: {backgroundColor: themeColor, height: 46},
          headerTitleAlign: 'center',
          headerTitleStyle: {fontSize: 16, color: Colors.white},
          headerLeft: () => (
            <TouchableOpacity paddingH-26 onPress={() => navigation.goBack()}>
              <FontAwesome name="angle-left" color={Colors.white} size={26} />
            </TouchableOpacity>
          ),
        })}>
        {/* 用户 */}
        <Stack.Group>
          <Stack.Screen
            name="Edituser"
            component={EditUser}
            options={{
              title: '个人信息',
            }}
          />
          <Stack.Screen
            name="UserSafe"
            component={AccountSafe}
            options={{
              title: '账号安全',
            }}
          />
          <Stack.Screen
            name="QrCode"
            component={BaseQRCode}
            options={{
              title: '二维码名片',
            }}
          />
          <Stack.Screen
            name="ChatMsg"
            component={ChatMsg}
            options={{
              title: '聊天记录',
            }}
          />
          <Stack.Screen
            name="DataManager"
            component={DataManager}
            options={{
              title: '云端数据',
            }}
          />
        </Stack.Group>

        {/* 好友 */}
        <Stack.Group>
          <Stack.Screen
            name="Addmate"
            component={Addmate}
            options={{
              title: '添加好友',
            }}
          />
          <Stack.Screen
            name="Mateinfo"
            component={Mateinfo}
            options={{
              title: '个人资料',
            }}
          />
          <Stack.Screen
            name="Newmate"
            component={Newmate}
            options={{
              title: '新的朋友',
            }}
          />
        </Stack.Group>

        {/* 消息 */}
        <Stack.Group>
          <Stack.Screen
            name="Chat"
            component={Chat}
            options={({route, navigation}) => ({
              title: route.params.to_remark,
              headerRight: () => (
                <TouchableOpacity
                  paddingR-16
                  onPress={() => {
                    if (route.params.chat_type === 'personal') {
                      navigation.navigate('ChatHistory', route.params);
                    }
                    if (route.params.chat_type === 'group') {
                      navigation.navigate('GroupInfo', route.params);
                    }
                  }}>
                  <FontAwesome name="reorder" color={Colors.white} size={20} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="ChatHistory"
            component={ChatHistory}
            options={{
              title: '聊天信息',
            }}
          />
          <Stack.Screen
            name="SearchMsg"
            component={SearchMsg}
            options={{
              title: '查找聊天记录',
            }}
          />
        </Stack.Group>

        {/* 群组 */}
        <Stack.Group>
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroup}
            options={({route}) => ({
              title: route.params.is_create ? '创建群聊' : '邀请新成员',
            })}
          />
          <Stack.Screen
            name="GroupInfo"
            component={GroupInfo}
            options={{
              title: '群聊详情',
            }}
          />
          <Stack.Screen
            name="Grouplist"
            component={Grouplist}
            options={{
              title: '我的群聊',
            }}
          />
        </Stack.Group>

        <Stack.Screen
          name="PdfView"
          component={BasePdfView}
          options={({route}) => ({
            title: 'PDF预览',
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}

export default StackScreen;
