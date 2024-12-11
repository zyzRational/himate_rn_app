import React, {useEffect} from 'react';
import {View, Colors} from 'react-native-ui-lib';
import {getmatelist, getapplylist} from '../../api/mate';
import {useSelector} from 'react-redux';
import ListItem from '../../components/commom/ListItem';
import MateList from '../../components/mate/MateList';

const Mate = ({navigation}) => {
  const userInfo = useSelector(state => state.userStore.userInfo);

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

  /* 申请好友数量 */
  const [applycount, setApplycount] = React.useState(null);
  const getApplylist = userId => {
    getapplylist(userId)
      .then(res => {
        if (res.success) {
          setApplycount(res.data.count);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userInfo) {
        getApplylist(userInfo.id);
        getMatelist(userInfo.id);
      }
    });
    return unsubscribe;
  }, [navigation, userInfo]);

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
