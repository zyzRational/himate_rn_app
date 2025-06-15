import React, {useEffect} from 'react';
import {View, Colors} from 'react-native-ui-lib';
import {getmatelist, getapplylist} from '../../api/mate';
import {useSelector} from 'react-redux';
import {useIsFocused} from '@react-navigation/native';
import ListItem from '../../components/commom/ListItem';
import MateList from '../../components/mate/MateList';

const Mate = ({navigation}) => {
  const isFocused = useIsFocused();
  const userId = useSelector(state => state.userStore.userId);

  /*   好友列表 */
  const [matelist, setMatelist] = React.useState([]);
  const getMatelist = _userId => {
    getmatelist({uid: _userId, mate_status: 'agreed'})
      .then(res => {
        if (res.success) {
          setMatelist(res.data.list);
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  /* 申请好友数量 */
  const [applycount, setApplycount] = React.useState(null);
  const getApplylist = _userId => {
    getapplylist({uid: _userId})
      .then(res => {
        if (res.success) {
          setApplycount(res.data.count);
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (isFocused && userId) {
      getApplylist(userId);
      getMatelist(userId);
    }
  }, [isFocused, userId]);

  return (
    <View>
      <View>
        <View flexG paddingV-4 backgroundColor={Colors.white}>
          <ListItem
            ItemName={'新的朋友'}
            IconName={'user'}
            IconColor={Colors.Primary}
            IsBadge={true}
            BadgeCount={applycount}
            Fun={() => {
              navigation.navigate('Newmate');
            }}
          />
          <View marginT-8>
            <ListItem
              ItemName={'我的群聊'}
              IconName={'group'}
              IconColor={Colors.success}
              IconSize={20}
              Fun={() => {
                navigation.navigate('Grouplist');
              }}
            />
          </View>
        </View>
        <MateList
          OriginList={matelist}
          Height={'84.3%'}
          Fun={item => {
            navigation.navigate('Mateinfo', {
              uid: item.uid,
            });
          }}
        />
      </View>
    </View>
  );
};

export default Mate;
