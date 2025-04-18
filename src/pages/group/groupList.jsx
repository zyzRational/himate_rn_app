import React, {useEffect} from 'react';
import {FlatList} from 'react-native';
import {
  View,
  Text,
  Avatar,
  Colors,
  TouchableOpacity,
  LoaderScreen,
} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import {useToast} from '../../components/commom/Toast';
import dayjs from 'dayjs';
import {getAllJoinGroupList} from '../../api/groupMember';

const Grouplist = ({navigation}) => {
  const userId = useSelector(state => state.userStore.userId);
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const {showToast} = useToast();

  // 群聊列表
  const [loading, setLoading] = React.useState(false);
  const [selfGroupList, setSelfGroupList] = React.useState([]);
  const [joinGroupList, setJoinGroupList] = React.useState([]);
  /* 获取群聊列表 */
  const getUserGroups = async uid => {
    try {
      setLoading(true);
      const res = await getAllJoinGroupList({uid});
      if (res.success) {
        const allGroupList = res.data.list;
        setSelfGroupList(allGroupList.filter(item => item.creator_uid === uid));
        setJoinGroupList(allGroupList.filter(item => item.creator_uid !== uid));
        setLoading(false);
      } else {
        showToast(res.message, 'error');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        getUserGroups(userId);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const renderGroupItem = ({item}) => (
    <TouchableOpacity
      key={item.id}
      padding-10
      flexS
      backgroundColor={Colors.white}
      spread
      row
      centerV
      onPress={() => {
        navigation.navigate('Chat', {
          chat_type: 'group',
          session_id: item.group_id,
          to_remark: item.group_name,
          group_id: item.group_id,
        });
      }}>
      <View flexS row centerV>
        <Avatar source={{uri: STATIC_URL + item.group_avatar}} />
        <View marginL-10>
          <Text text70>{item.group_name}</Text>
        </View>
      </View>
      <View>
        <Text grey40 text100L>
          {dayjs(item.create_time).format('YYYY/MM/DD')}
          {item.creator_uid === userId ? ' 创建' : ' 加入'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {loading ? (
        <LoaderScreen message={'正在加载...'} color={Colors.Primary} />
      ) : (
        <View>
          {selfGroupList.length > 0 ? (
            <View padding-6 paddingL-12>
              <Text text80 grey30>
                我创建的群聊
              </Text>
            </View>
          ) : null}
          <FlatList
            data={selfGroupList}
            renderItem={renderGroupItem}
            keyExtractor={(item, index) => item + index}
          />
          {joinGroupList.length > 0 ? (
            <View padding-6 paddingL-12>
              <Text text70>我加入的群聊</Text>
            </View>
          ) : null}
          <FlatList
            data={joinGroupList}
            renderItem={renderGroupItem}
            keyExtractor={(item, index) => item + index}
          />
          {!selfGroupList.length && !joinGroupList.length ? (
            <View marginT-16 center>
              <Text text90L grey40>
                没有发现任何群聊{' T_T'}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </>
  );
};

export default Grouplist;
