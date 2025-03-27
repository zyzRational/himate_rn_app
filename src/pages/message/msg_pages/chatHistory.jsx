import React, {useState} from 'react';
import {View, Card, LoaderScreen, Colors} from 'react-native-ui-lib';
import {useToast} from '../../../components/commom/Toast';
import {useRealm} from '@realm/react';
import {getChatList} from '../../../api/session';
import {formatMsg, setLocalMsg} from '../../../utils/handle/chatHandle';
import ListItem from '../../../components/commom/ListItem';
import BaseDialog from '../../../components/commom/BaseDialog';

const ChatHistory = ({navigation, route}) => {
  const {showToast} = useToast();
  const realm = useRealm();
  const {session_id, to_uid} = route.params || {};

  /* 清空历史消息 */
  const clearChatHistory = se_id => {
    const toDelete = realm
      .objects('ChatMsg')
      .filtered('session_id == $0', se_id);
    realm.write(() => {
      realm.delete(toDelete);
      showToast('清除成功', 'success');
      navigation.navigate('Msg');
    });
  };

  /* 获取历史消息 */
  const [loading, setLoading] = useState(false);
  const getCouldChatHistory = async () => {
    try {
      setLoading(true);
      const res = await getChatList({session_id, isPaging: false});
      if (res.success) {
        const newlist = [];
        res.data.list.forEach(item => {
          newlist.push(formatMsg(item));
        });
        setLocalMsg(realm, newlist);
        navigation.navigate('Msg');
      }
      setLoading(false);
      showToast(res.message, res.success ? 'success' : 'error');
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const [clearVisible, setClearVisible] = useState(false);

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
      <Card marginT-16 enableShadow={false}>
        <ListItem
          ItemName={'从云端同步消息'}
          IconName={'cloud-download'}
          IconSize={20}
          IconColor={Colors.blue30}
          Fun={() => {
            getCouldChatHistory();
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
      {loading ? (
        <LoaderScreen
          message={'同步中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
    </View>
  );
};

export default ChatHistory;
