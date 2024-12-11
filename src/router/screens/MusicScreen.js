import * as React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {Colors, TouchableOpacity} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Music from '../../pages/music';
import FindFavorites from '../../pages/music/music_pages/findFavorites';
import LatelyMusic from '../../pages/music/music_pages/latelyMusic';
import LocalMusic from '../../pages/music/music_pages/localMusic';
import MyFavorites from '../../pages/music/music_pages/myFavorites';
import SearchMusic from '../../pages/music/music_pages/searchMusic';
import FavoritesDetail from '../../pages/music/music_pages/favoritesDetail';
import EditFavorites from '../../pages/music/music_pages/editFavorites';

const Stack = createStackNavigator();

function MusicScreen() {
  const themeColor = useSelector(state => state.settingStore.themeColor);
  const isFullScreen = useSelector(state => state.settingStore.isFullScreen);
  return (
    <Stack.Navigator initialRouteName="MusicHome">
      <Stack.Group
        screenOptions={{
          headerShown: !isFullScreen,
          headerStyle: {backgroundColor: themeColor, height: 46},
          headerTitleAlign: 'center',
          headerTitleStyle: {fontSize: 16, color: Colors.white},
        }}>
        <Stack.Screen
          name="MusicHome"
          component={Music}
          options={{
            title: '音乐',
          }}
        />
      </Stack.Group>
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
        <Stack.Screen
          name="FindFavorites"
          component={FindFavorites}
          options={{
            title: '发现歌单',
          }}
        />
        <Stack.Screen
          name="LatelyMusic"
          component={LatelyMusic}
          options={{
            title: '最近播放',
          }}
        />
        <Stack.Screen
          name="LocalMusic"
          component={LocalMusic}
          options={{
            title: '本地音乐',
          }}
        />
        <Stack.Screen
          name="MyFavorites"
          component={MyFavorites}
          options={{
            title: '我的收藏',
          }}
        />
        <Stack.Screen
          name="SearchMusic"
          component={SearchMusic}
          options={{
            title: '搜索音乐',
          }}
        />
        <Stack.Screen
          name="FavoritesDetail"
          component={FavoritesDetail}
          options={{
            title: '歌单详情',
          }}
        />
        <Stack.Screen
          name="EditFavorites"
          component={EditFavorites}
          options={{
            title: '编辑歌单',
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}

export default MusicScreen;
