import React, {useEffect} from 'react';
import {View, Colors, Text, Button} from 'react-native-ui-lib';
import {getmatelist} from '../../api/mate';
import {useToast} from '../../components/commom/Toast';
import {useSelector} from 'react-redux';
import MateList from '../../components/mate/MateList';
import {addGroup} from '../../api/group';
import {addGroupMember} from '../../api/groupMember';

const CreateGroup = ({navigation, route}) => {
  const userInfo = useSelector(state => state.userStore.userInfo);
  const {showToast} = useToast();
  const {
    uid,
    group_id: groupId,
    gId: g_Id,
    existMemberIds,
    is_create,
  } = route.params || {};

  /*   好友列表 */
  const [matelist, setMatelist] = React.useState([]);
  const getMatelist = userId => {
    getmatelist({uid: userId, mate_status: 'agreed'})
      .then(res => {
        if (res.success) {
          setMatelist(res.data.list);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  /* 创建群聊 */
  const [selectUids, setSelectUids] = React.useState([]);
  const handleCreateGroup = async () => {
    if (is_create && selectUids.length < 2) {
      showToast('至少选择两个好友', 'warning');
      return;
    }
    try {
      if (groupId && g_Id && !is_create) {
        // 群主本身也要加入群聊
        addQueue([...selectUids], g_Id, groupId);
        showToast('邀请群成员成功', 'error');
        navigation.goBack();
      } else {
        const groupRes = await addGroup({creator_uid: userInfo.id});
        if (groupRes.success) {
          // 群主本身也要加入群聊
          addQueue(
            [userInfo.id, ...selectUids],
            groupRes.data.id,
            groupRes.data.group_id,
          );
          navigation.navigate('Grouplist');
        }
        showToast(groupRes.message, groupRes.success ? 'success' : 'error');
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* 添加群成员队列 */
  let count = 0;
  const addQueue = async (list, gId, group_id) => {
    if (count === list.length) {
      count = 0;
      return 'complete';
    }
    try {
      const result = await addGroupMember({
        gId,
        group_id,
        member_uid: list[count],
      });
      if (result.success) {
        count++;
        return addQueue(list, gId, group_id);
      } else {
        showToast(result.message, 'error');
        count++;
        return addQueue(list, gId, group_id);
      }
    } catch (error) {
      console.log(error);
      count++;
      return addQueue(list, gId, group_id);
    }
  };

  useEffect(() => {
    if (userInfo) {
      getMatelist(userInfo.id);
    }
  }, [userInfo]);

  useEffect(() => {
    if (uid) {
      setSelectUids([uid]);
    }
  }, [uid]);

  return (
    <View>
      <View>
        <View
          flexS
          row
          spread
          centerH
          padding-12
          backgroundColor={Colors.white}>
          <View center>
            <Text text70 grey20 center>
              已选择
              <Text color={Colors.Primary}> {selectUids.length} </Text>
              位好友
            </Text>
          </View>
          {selectUids.length > 0 ? (
            <Button
              label={'完成'}
              size={Button.sizes.small}
              borderRadius={8}
              backgroundColor={Colors.Primary}
              onPress={handleCreateGroup}
            />
          ) : null}
        </View>
        <MateList
          OriginList={matelist}
          Height={'92%'}
          IsSelect={true}
          SelectedIds={uid ? [uid] : []}
          ExistMemberIds={existMemberIds}
          IsNew={!groupId && !g_Id}
          SelectChange={value => {
            setSelectUids(value);
          }}
        />
      </View>
    </View>
  );
};

export default CreateGroup;
