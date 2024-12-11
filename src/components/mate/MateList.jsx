import React, {useEffect, useState} from 'react';
import {StyleSheet, FlatList, SectionList} from 'react-native';
import {
  View,
  Text,
  Colors,
  Avatar,
  TouchableOpacity,
  Dialog,
  PanningProvider,
  Checkbox,
} from 'react-native-ui-lib';
import {getFirstLetter} from '../../utils/base';
import {useSelector} from 'react-redux';

const MateList = props => {
  const {
    OriginList = [],
    Fun = () => {},
    Height = '100%',
    IsSelect = false,
    SelectChange = () => {},
    SelectedIds = [],
    ExistMemberIds = [],
    IsNew = false,
  } = props;

  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);

  const [matelist, setMatelist] = React.useState([]);
  const [alphabetList, setAlphabetList] = React.useState([]);
  const [scorollData, setScorollData] = React.useState([]);
  /* 处理为分组数据 */
  const toGroupList = list => {
    const newlist = list.map(item => {
      return {
        title: getFirstLetter(item.remark),
        data: item,
      };
    });
    const newData = newlist.reduce((accumulator, currentValue) => {
      // 检查当前title是否已经存在于累积器中
      const foundIndex = accumulator.findIndex(
        item => item.title === currentValue.title,
      );

      // 如果找到了对应的title，则把当前的data对象添加到对应的data数组中
      if (foundIndex !== -1) {
        accumulator[foundIndex].data.push(currentValue.data);
      } else {
        // 如果没有找到对应的title，则创建一个新的对象并添加到累积器中
        accumulator.push({
          title: currentValue.title,
          data: [currentValue.data], // 注意这里初始化为数组
        });
      }
      return accumulator;
    }, []); // 初始化累积器为空数组
    newData.sort((a, b) => {
      if (a.title === '#') {
        return 1;
      }
      // 如果b的title是'#'，则b应该排在a前面
      if (b.title === '#') {
        return -1;
      }
      // 如果两个title都不是'#'，则按字母顺序排序
      return a.title.localeCompare(b.title);
    });
    const letterList = newData.map(item => {
      return item.title;
    });

    return {
      mlist: newData,
      letterList: letterList,
    };
  };

  const [pressIndex, setPressIndex] = useState(-1);
  const [HintVisible, setHintVisible] = useState(false);
  const [groupHeight, setGroupHeight] = useState(0);
  /* 滑动字母对应表 */
  const ScorollSetting = list => {
    const newlist = [];
    const height = groupHeight / 2 - (20 * list.length) / 2 + 46;
    for (let i = 0; i < list.length; i++) {
      const element = {
        min: Math.floor(height + i * 20),
        max: Math.floor(height + (i + 1) * 20),
        index: i,
      };
      newlist.push(element);
    }
    return JSON.parse(JSON.stringify(newlist));
  };

  const [flatListRef, setFlatListRef] = useState(null);
  /* 处理滑动字母对应表 */
  const showletter = num => {
    const findIndex = scorollData.findIndex(
      range => num >= range.min && num < range.max,
    );
    if (findIndex === -1) {
      setHintVisible(false);
    } else {
      setHintVisible(true);
      setPressIndex(findIndex);
      flatListRef.scrollToLocation({
        itemIndex: 0, // 要滚动到的项的索引
        sectionIndex: findIndex, // 要滚动到的组的索引
      });
    }
  };

  useEffect(() => {
    if (OriginList.length > 0) {
      const needRes = toGroupList(OriginList);
      setMatelist(needRes.mlist);
      setAlphabetList(needRes.letterList);
      setScorollData(ScorollSetting(needRes.letterList));
    }
  }, [OriginList]);

  const [selectedItem, setSelectedItem] = useState(SelectedIds);
  return (
    <>
      <SectionList
        style={{height: Height}}
        sections={matelist}
        keyExtractor={(item, index) => item + index}
        ref={Ref => setFlatListRef(Ref)}
        renderItem={({item}) =>
          IsSelect ? (
            <View flexS row centerV backgroundColor={Colors.white} padding-12>
              <Checkbox
                marginR-12
                color={Colors.Primary}
                size={20}
                borderRadius={10}
                value={selectedItem.includes(item.uid)}
                disabled={
                  (IsNew && item.uid === selectedItem[0]) ||
                  ExistMemberIds.includes(item.uid)
                }
                onValueChange={value => {
                  if (value) {
                    setSelectedItem(prevItem => {
                      const newItem = [...prevItem, item.uid];
                      SelectChange(newItem);
                      return newItem;
                    });
                  } else {
                    setSelectedItem(prevItem => {
                      const newItem = prevItem.filter(uid => uid !== item.uid);
                      SelectChange(newItem);
                      return newItem;
                    });
                  }
                }}
              />
              <View flexS row centerV>
                <Avatar
                  source={{
                    uri: STATIC_URL + item.avatar,
                  }}
                  size={40}
                />
                <Text marginL-10 text70>
                  {item.remark}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              flexS
              row
              centerV
              backgroundColor={Colors.white}
              padding-12
              onPress={() => {
                Fun(item);
              }}>
              <Avatar
                source={{
                  uri: STATIC_URL + item.avatar,
                }}
                size={40}
              />
              <Text marginL-10 text70>
                {item.remark}
              </Text>
            </TouchableOpacity>
          )
        }
        renderSectionHeader={({section: {title}}) => (
          <View padding-4 marginL-10>
            <Text grey30 text80>
              {title}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View marginT-16 center>
            <Text text90L grey40>
              没有发现任何好友{' T_T'}
            </Text>
          </View>
        }
      />
      <View
        style={styles.alphabet}
        onStartShouldSetResponder={() => true}
        onResponderMove={event => {
          showletter(event.nativeEvent.pageY);
        }}
        onResponderRelease={() => {
          setHintVisible(false);
          setPressIndex(-1);
        }}
        onLayout={event => {
          const {height} = event.nativeEvent.layout;
          setGroupHeight(height);
        }}>
        <View>
          <FlatList
            data={alphabetList}
            keyExtractor={(item, index) => item + index}
            renderItem={({item, index}) => (
              <View
                style={styles.alphabeBox}
                center
                backgroundColor={
                  index == pressIndex ? Colors.Primary : Colors.transparent
                }>
                <Text
                  text90L
                  style={{
                    color: index == pressIndex ? Colors.white : Colors.grey30,
                  }}>
                  {item}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
      <Dialog
        visible={HintVisible}
        overlayBackgroundColor={Colors.rgba(0, 0, 0, 0)}
        onDismiss={() => setHintVisible(false)}
        panDirection={PanningProvider.Directions.RIGHT}>
        <View flexG center>
          <View
            padding-8
            flexS
            center
            width={80}
            backgroundColor="rgba(0,0,0,0.3)"
            style={{
              borderRadius: 8,
            }}>
            <Text white text20>
              {alphabetList[pressIndex]}
            </Text>
          </View>
        </View>
      </Dialog>
    </>
  );
};
const styles = StyleSheet.create({
  alphabet: {
    position: 'absolute',
    justifyContent: 'center',
    height: '100%',
    top: 0,
    right: 0,
  },
  alphabeBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
export default MateList;
