import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import {
  View,
  Text,
  Avatar,
  Colors,
  TouchableOpacity,
  TextField,
} from 'react-native-ui-lib';
import dayjs from 'dayjs';
import { useRealm } from '@realm/react';
import { showMediaType, getLocalUser } from '../../../utils/chatHandle';
import { useSelector } from 'react-redux';
import { fullHeight, fullWidth } from '../../../styles';

const SearchMsg = ({ navigation, route }) => {
  const { session_id } = route.params || {};
  const realm = useRealm();

  // baseConfig
  const { STATIC_URL } = useSelector(state => state.baseConfigStore.baseConfig);

  // 群聊列表
  const [msgList, setMsgList] = React.useState([]);

  /* 查询历史记录 */
  const getMsgList = async (keyword, sessionId) => {
    if (!keyword || keyword.trim() === '') {
      return [];
    }
    const localUses = realm
      .objects('UsersInfo')
      .filtered('remark CONTAINS $0', keyword.trim())
      .toJSON();
    const userMsgs = [];
    localUses.forEach(item => {
      const local_msgs = realm.objects('ChatMsg');
      let user_msg = [];
      if (sessionId) {
        user_msg = local_msgs
          .filtered('send_uid == $0 && session_id == $1', item.uid, sessionId)
          .sorted('createdAt', true)
          .toJSON();
      } else {
        user_msg = local_msgs
          .filtered('send_uid == $0', item.uid)
          .sorted('createdAt', true)
          .toJSON();
      }
      userMsgs.push(...user_msg);
    });

    const localMsgs = realm.objects('ChatMsg');
    let Msgs = [];
    if (sessionId && keyword) {
      Msgs = localMsgs
        .filtered(
          'session_id == $0 && text CONTAINS $1',
          sessionId,
          keyword.trim(),
        )
        .sorted('createdAt', true)
        .toJSON();
    } else {
      Msgs = localMsgs
        .filtered('text CONTAINS $0', keyword.trim())
        .sorted('createdAt', true)
        .toJSON();
    }

    const items = [...userMsgs, ...Msgs];
    return items.reduce((acc, item) => {
      if (!acc.some(accItem => accItem.clientMsg_id === item.clientMsg_id)) {
        acc.push(item);
      }
      return acc;
    }, []);
  };

  /* 获取匹配头像备注信息 */
  const matchInfoList = getLocalUser(realm) || [];

  /* 为消息匹配头像备注信息 */
  const matchAvatarAndRemark = (list, uid, sessionId) => {
    const info = list.find(
      item => item.uid === uid && item.session_id === sessionId,
    );
    if (info) {
      return info;
    } else {
      return {
        remark: null,
        avatar: null,
        session_name: '',
      };
    }
  };

  /* 关键词高亮样式 */
  const [keyword, setKeyword] = React.useState('');
  const setHighlightStyle = (text, highlightText) => {
    const regex = new RegExp(highlightText, 'gi');
    const parts = text?.split(regex) || [];
    const highlights = text?.match(regex) || [];
    return (
      <Text>
        {parts.map((part, index) => (
          // 如果当前部分是搜索词，则应用高亮样式
          <Text key={index}>
            {part}
            <Text style={styles.highlightStyle}>
              {highlights[index] ? highlights[index] : null}
            </Text>
          </Text>
        ))}
      </Text>
    );
  };

  /* 获取聊天备注 */
  const getChatRemark = item => {
    const otherInfo = matchAvatarAndRemark(
      matchInfoList,
      item.send_uid,
      item.session_id,
    );
    if (item.chat_type === 'group') {
      return otherInfo.session_name;
    }
    if (item.chat_type === 'personal') {
      return otherInfo.remark;
    }
  };

  const renderMsgItem = ({ item }) => {
    return (
      <TouchableOpacity
        key={item._id}
        padding-10
        flexS
        backgroundColor={Colors.white}
        spread
        row
        centerV
        onPress={() => {
          navigation.navigate('Chat', {
            session_id: item.session_id,
            chat_type: item.chat_type,
            to_remark: getChatRemark(item),
            clientMsgId: item.clientMsg_id,
          });
        }}>
        <View flexS row centerV>
          <Avatar
            source={{
              uri: matchAvatarAndRemark(
                matchInfoList,
                item.send_uid,
                item.session_id,
              )?.avatar
                ? STATIC_URL +
                matchAvatarAndRemark(
                  matchInfoList,
                  item.send_uid,
                  item.session_id,
                )?.avatar
                : STATIC_URL + 'default_empty.png',
            }}
          />
          <View marginL-10 width={fullWidth * 0.78}>
            <View flexS row spread>
              <Text text80BO grey30>
                {setHighlightStyle(
                  matchAvatarAndRemark(
                    matchInfoList,
                    item.send_uid,
                    item.session_id,
                  ).remark,
                  keyword,
                )}
              </Text>
              <Text grey40 text90L>
                {dayjs(item.createdAt).format('YYYY/MM/DD HH:mm:ss')}
              </Text>
            </View>
            <View>
              <Text text70 numberOfLines={3}>
                {item.msg_type !== 'text'
                  ? showMediaType(item.text, item.msg_type, item?.msg_secret)
                  : setHighlightStyle(item.text, keyword)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View padding-12 flexS width={'100%'}>
        <TextField
          containerStyle={styles.input}
          placeholder={'请输入聊天记录关键字/昵称'}
          onChangeText={value => {
            setKeyword(value);
            setMsgList(getMsgList(value, session_id)._j);
          }}
        />
      </View>
      <View height={fullHeight * 0.9}>
        <FlatList
          data={msgList}
          renderItem={renderMsgItem}
          keyExtractor={(item, index) => item + index}
          ListEmptyComponent={
            <View marginT-16 center>
              <Text text90L grey40>
                没有搜索到相关聊天记录~
              </Text>
            </View>
          }
          ListFooterComponent={
            msgList.length > 10 ? (
              <View marginB-80 padding-12 center>
                <Text text90L grey40>
                  已经到底啦 ~
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    height: 42,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  highlightStyle: {
    color: Colors.blue50,
  },
});
export default SearchMsg;
