import React, {useState, useEffect} from 'react';
import {View, Card, Colors} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import {useToast} from '../../../components/commom/Toast';
import {useRealm} from '@realm/react';
import ListItem from '../../../components/commom/ListItem';
import BaseDialog from '../../../components/commom/BaseDialog';

const ChatHistory = ({navigation, route}) => {
  const userInfo = useSelector(state => state.userStore.userInfo);
  const {showToast} = useToast();
  const realm = useRealm();
  const {session_id, to_uid} = route.params || {};

  /* 清空历史消息 */
  const clearChatHistory = session_id => {
    const toDelete = realm
      .objects('ChatMsg')
      .filtered('session_id == $0', session_id);
    realm.write(() => {
      realm.delete(toDelete);
      showToast('清除成功', 'success');
    });
  };

  const [clearVisible, setClearVisible] = useState(false);

  useEffect(() => {}, []);

  return (
    <View flexG paddingH-16 paddingT-16>
      <Card enableShadow={false}>
        <ListItem
          ItemName={'创建群聊'}
          IconName={'group'}
          IconSize={20}
          IconColor={Colors.Primary}
          Fun={() => {
            navigation.navigate('CreateGroup', {
              uid: to_uid,
              is_create: true,
            });
          }}
        />
      </Card>
      <Card marginT-16 enableShadow={false}>
        <ListItem
          ItemName={'查找历史消息'}
          IconName={'search'}
          IconSize={20}
          IconColor={Colors.grey40}
          Fun={() => {
            navigation.navigate('SearchMsg', {
              session_id: session_id,
            });
          }}
        />
        <ListItem
          ItemName={'导出聊天记录'}
          IconName={'download'}
          IconColor={Colors.cyan30}
          IconSize={20}
          Fun={() => {
            navigation.navigate('ChatMsg', {
              session_id: session_id,
            });
          }}
        />
        <ListItem
          ItemName={'清空历史消息'}
          IconName={'remove'}
          IconColor={Colors.error}
          Fun={() => {
            setClearVisible(true);
          }}
        />
      </Card>
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          clearChatHistory(session_id);
        }}
        Visible={clearVisible}
        SetVisible={setClearVisible}
        MainText={'您确定要清除历史消息吗？'}
      />
    </View>
  );
};

export default ChatHistory;
