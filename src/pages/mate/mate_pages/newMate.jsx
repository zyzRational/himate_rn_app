import React, {useState, useEffect} from 'react';
import {FlatList} from 'react-native';
import {
  View,
  Text,
  Avatar,
  Button,
  Colors,
  TouchableOpacity,
  TextField,
} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import {useToast} from '../../../components/commom/Toast';
import {
  editmate,
  deletemate,
  getmatelist,
  getapplylist,
} from '../../../api/mate';
import BaseDialog from '../../../components/commom/BaseDialog';

const Newmate = ({navigation}) => {
  const userInfo = useSelector(state => state.userStore.userInfo);
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const {showToast} = useToast();

  /* 申请好友列表 */
  const [applylist, setAplylist] = React.useState([]);
  const getApplylist = userId => {
    getapplylist(userId)
      .then(res => {
        // console.log(res);
        if (res.success) {
          setAplylist(res.data.list);
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  /*   待通过好友列表 */
  const [waitinglist, setWaitinglist] = React.useState([]);
  const getWaitinglist = userId => {
    getmatelist({uid: userId, mate_status: 'waiting'})
      .then(res => {
        if (res.success) {
          const newList = res.data.list.filter(item => {
            return item.apply_uid === userId;
          });
          setWaitinglist(newList);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  /*   拒绝的好友列表 */
  const [refusedlist, setRefusedlist] = React.useState([]);
  const getRefusedlist = userId => {
    getmatelist({uid: userId, mate_status: 'refused'})
      .then(res => {
        if (res.success) {
          setRefusedlist(res.data.list);
          // console.log(res.data.list);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  /*  同意好友申请 */
  const [remarkisVisible, setRemarkIsVisible] = React.useState(false);
  const [remark, setRemark] = React.useState('');
  const [mateId, setMateId] = React.useState(null);
  const agreeOrRefuseApply = (status, Id) => {
    editmate({
      id: Id ? Id : mateId,
      uid: userInfo?.id,
      mate_status: status,
      remark: remark,
    })
      .then(res => {
        // console.log(res);
        if (res.success) {
          showToast(status === 'agreed' ? '已同意' : '已拒绝', 'success');
          getApplylist(userInfo?.id);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  /* 删除好友申请 */
  const [deleteisVisible, setDeleteIsVisible] = useState(false);
  const [deleteId, setDeleteId] = React.useState(null);
  const deleteApplyInfo = async delete_id => {
    try {
      const delRes = await deletemate(delete_id);
      if (delRes.success) {
        setDeleteIsVisible(false);
        getWaitinglist(userInfo.id);
        getRefusedlist(userInfo.id);
      }
      showToast(delRes.message, delRes.success ? 'success' : 'error');
    } catch (error) {
      console.log(error);
    }
  };

  /* 拒绝好友申请 */
  const [refusedVisible, setRefusedVisible] = React.useState(false);
  const [refusedId, setRefusedId] = React.useState(null);

  useEffect(() => {
    if (userInfo) {
      getApplylist(userInfo.id);
      getWaitinglist(userInfo.id);
      getRefusedlist(userInfo.id);
    }
  }, [userInfo]);

  const renderApplyItem = ({item}) => (
    <View padding-10 flexS backgroundColor={Colors.white} spread row centerV>
      <TouchableOpacity
        flexS
        row
        centerV
        onPress={() => {
          navigation.navigate('Mateinfo', {
            uid: item.apply_uid,
          });
        }}>
        <Avatar
          source={{
            uri: STATIC_URL + item.apply_avatar,
          }}
        />
        <View marginL-10>
          <Text text80BL>{item.apply_remark}</Text>
          <Text text90L marginT-5 grey30 style={{width: 210}}>
            {item.validate_msg}
          </Text>
        </View>
      </TouchableOpacity>
      <View marginL-10 flexS row>
        <Button
          label={'同意'}
          borderRadius={6}
          labelStyle={{fontSize: 13}}
          avoidMinWidth={true}
          size={Button.sizes.xSmall}
          backgroundColor={Colors.Primary}
          onPress={() => {
            setRemarkIsVisible(true);
            setMateId(item.id);
          }}
        />
        <Button
          marginL-8
          label={'拒绝'}
          borderRadius={6}
          labelStyle={{fontSize: 13}}
          avoidMinWidth={true}
          outline
          outlineColor={Colors.error}
          size={Button.sizes.xSmall}
          onPress={() => {
            setRefusedVisible(true);
            setRefusedId(item.id);
          }}
        />
      </View>
    </View>
  );

  const renderOtherItem = ({item}) => (
    <View padding-10 flexS backgroundColor={Colors.white} spread row centerV>
      <TouchableOpacity
        flexS
        row
        centerV
        onPress={() => {
          navigation.navigate('Mateinfo', {
            uid: item.uid,
          });
        }}>
        <Avatar
          source={{
            uri: STATIC_URL + item.avatar,
          }}
        />
        <View marginL-10>
          <Text text80BL>{item.remark}</Text>
          <Text text90L marginT-5 grey30 style={{width: 210}}>
            {item.validate_msg}
          </Text>
        </View>
      </TouchableOpacity>
      <View flexS row>
        <View center>
          <Text grey30 text90L>
            {item.mate_status === 'waiting' ? '等待通过' : '已被拒绝'}
          </Text>
        </View>
        <Button
          marginL-8
          label={'删除'}
          borderRadius={6}
          labelStyle={{fontSize: 13}}
          avoidMinWidth={true}
          outline
          outlineColor={Colors.error}
          size={Button.sizes.xSmall}
          onPress={() => {
            setDeleteIsVisible(true);
            setDeleteId(item.id);
          }}
        />
      </View>
    </View>
  );

  return (
    <View>
      {applylist.length > 0 ? (
        <>
          <View padding-6 paddingL-12>
            <Text text80 grey30>
              加我为好友
            </Text>
          </View>
          <FlatList
            data={applylist}
            renderItem={renderApplyItem}
            keyExtractor={(item, index) => item + index}
          />
        </>
      ) : null}

      {waitinglist.length > 0 || refusedlist.length > 0 ? (
        <>
          <View padding-6 paddingL-12>
            <Text text80 grey30>
              我的好友申请
            </Text>
          </View>
          <FlatList
            data={waitinglist}
            renderItem={renderOtherItem}
            keyExtractor={(item, index) => item + index}
          />
          <FlatList
            data={refusedlist}
            renderItem={renderOtherItem}
            keyExtractor={(item, index) => item + index}
          />
        </>
      ) : (
        <View marginT-16 center>
          <Text text90L grey40>
            还没有好友申请哦 ~
          </Text>
        </View>
      )}

      <BaseDialog
        IsButton={true}
        Fun={() => {
          agreeOrRefuseApply('agreed');
        }}
        Visible={remarkisVisible}
        SetVisible={setRemarkIsVisible}
        MainText={'好友备注'}
        Body={
          <TextField
            marginT-8
            placeholder={'请输入好友备注'}
            floatingPlaceholder
            onChangeText={value => {
              setRemark(value);
            }}
            maxLength={10}
            showCharCounter={true}
          />
        }
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          agreeOrRefuseApply('refused', refusedId);
        }}
        Visible={refusedVisible}
        SetVisible={setRefusedVisible}
        MainText={'您确定要拒绝该好友申请？'}
      />

      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          deleteApplyInfo(deleteId);
        }}
        Visible={deleteisVisible}
        SetVisible={setDeleteIsVisible}
        MainText={'您确定要删除该好友申请？'}
      />
    </View>
  );
};

export default Newmate;
