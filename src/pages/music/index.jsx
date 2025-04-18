import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Card,
  Colors,
  Image,
  TouchableOpacity,
  GridList,
  TextField,
  Drawer,
  Checkbox,
  Button,
  Slider,
  Switch,
  PanningProvider,
  Dialog,
} from 'react-native-ui-lib';
import {FlatList, StyleSheet, Vibration} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useToast} from '../../components/commom/Toast';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {fullHeight, fullWidth} from '../../styles';
import {
  getFavoritesList,
  addFavorities,
  deleteFavorites,
} from '../../api/music';
import BaseDialog from '../../components/commom/BaseDialog';
import {useRealm} from '@realm/react';
import dayjs from 'dayjs';
import {
  setCloseTime,
  setIsRandomPlay,
  setRandomNum,
} from '../../stores/store-slice/musicStore';
import {getMusicList, importFavorites} from '../../api/music';

const Music = ({navigation}) => {
  const {showToast} = useToast();
  const dispatch = useDispatch();
  const realm = useRealm();

  const userInfo = useSelector(state => state.userStore.userInfo);
  const userId = useSelector(state => state.userStore.userId);
  const isClosed = useSelector(state => state.musicStore.isClosed);
  const randomNum = useSelector(state => state.musicStore.randomNum);

  // baseConfig
  const {STATIC_URL, THUMBNAIL_URL} = useSelector(
    state => state.baseConfigStore.baseConfig,
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userId) {
        getUserFavoritesList(userId);
        getDefaultFavoritesCount(userId);
        getAllMusicList();
        if (realm) {
          getLocalMusicInfo();
        }
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  const [showAddDialog, setShowAddDialog] = useState(false);

  // 宫格列表数据
  const [itemData, setItemData] = useState([
    {
      title: '发现歌单',
      icon: 'cloud',
      iconColor: Colors.blue50,
      num: '',
      route: 'FindFavorites',
    },
    {
      title: '最近播放',
      icon: 'clock-o',
      iconColor: Colors.green50,
      num: 0,
      route: 'LatelyMusic',
    },
    {
      title: '本地音乐',
      icon: 'folder-open',
      iconColor: Colors.yellow40,
      num: 0,
      route: 'LocalMusic',
    },
    {
      title: '我的收藏',
      icon: 'heart',
      iconColor: Colors.red40,
      num: 0,
      route: 'MyFavorites',
    },
  ]);

  // 个人歌单列表
  const [pageNum, setPageNum] = useState(1);
  const [favoritesList, setFavoritesList] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const getUserFavoritesList = async _userId => {
    try {
      const res = await getFavoritesList({
        pageSize: pageNum * 20,
        creator_uid: _userId,
      });
      if (res.success) {
        // console.log(res.data.list);
        setFavoritesList(res.data.list);
        setFavoritesCount(res.data.count);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* 默认收藏数量 */
  const getDefaultFavoritesCount = async _userId => {
    try {
      const res = await getFavoritesList({
        is_default: 1,
        creator_uid: _userId,
      });
      if (res.success) {
        setItemData(prev => {
          prev[3].num = res.data.list[0]?.musicCount;
          return prev;
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* 提交歌单 */
  const [favoritesName, setFavoritesName] = useState('');
  const submitData = async () => {
    setShowAddDialog(false);
    try {
      const addRes = await addFavorities({
        creator_uid: userId,
        favorites_name: favoritesName,
      });
      if (addRes.success) {
        getUserFavoritesList(userId);
      }
      showToast(addRes.message, addRes.success ? 'success' : 'error');
    } catch (error) {
      console.error(error);
    }
  };

  /* 删除歌单 */
  const [delVisible, setDelVisible] = useState(false);
  const [delids, setDelids] = useState([]);
  const [delName, setDelName] = useState('');
  const delFavorites = async del_ids => {
    try {
      const delRes = await deleteFavorites({
        ids: del_ids || delids,
      });
      if (delRes.success) {
        getUserFavoritesList(userId);
      }
      showToast(delRes.message, 'success');
      resetMultiSelect();
    } catch (error) {
      console.error(error);
    }
  };

  /* 多选 */
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAllSelect, setIsAllSelect] = useState(false);

  const resetMultiSelect = () => {
    setIsMultiSelect(false);
    setIsAllSelect(false);
    setSelectedItems([]);
  };

  // 最近播放
  const [latelyDay, setLatelyDay] = useState(0);

  /* 获取最近播放数据 */
  const getLocalMusicInfo = () => {
    const music = realm.objects('MusicInfo').toJSON();
    const newList = music.sort((a, b) => b.updateAt - a.updateAt);
    if (newList.length > 0) {
      const latelyMusic = newList[0];
      const startDate = dayjs();
      const endDate = dayjs(latelyMusic.updateAt);
      const diffInDays = endDate.diff(startDate, 'day');
      setLatelyDay(diffInDays);
    }
    const localMusic = realm.objects('LocalMusic').toJSON();
    setItemData(prev => {
      prev[1].num = music.length;
      prev[2].num = localMusic.length;
      return prev;
    });
  };

  /* 定时关闭 */
  const [showAlarmDialog, setShowAlarmDialog] = useState(false);
  const [alarmSwitch, setAlarmSwitch] = useState(false);
  const [alarmTime, setAlarmTime] = useState(0);

  useEffect(() => {
    if (isClosed) {
      setAlarmSwitch(false);
    }
  }, [isClosed]);

  /* 随机播放 */
  const [showRandomDialog, setShowRandomDialog] = useState(false);
  const [randomSwitch, setRandomSwitch] = useState(false);

  // 获取所有歌曲数
  const [allMusicNum, setAllMusicNum] = useState(1);
  const getAllMusicList = async () => {
    try {
      const res = await getMusicList();
      if (res.success) {
        setAllMusicNum(res.data.count);
        dispatch(setRandomNum({min: 1, max: res.data.count}));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 导入外部歌单
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const onImport = async () => {
    try {
      const urlRegex = /https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*/g;
      const urls = importUrl.match(urlRegex);
      if (urls && urls?.[0]) {
        const trueUrl = urls?.[0];
        showToast('歌单导入中...', 'success');
        const res = await importFavorites({uid: userId, url: trueUrl});
        showToast(res.message, res.success ? 'success' : 'error');
        getUserFavoritesList(userId);
        getAllMusicList();
      }
    } catch (error) {
      console.error(error);
      showToast('歌单导入失败', 'error');
    }
  };

  return (
    <View top padding-16 height={fullHeight}>
      <Card
        borderRadius={20}
        padding-6
        paddingL-12
        row
        centerV
        onPress={() => {
          navigation.navigate('SearchMusic');
        }}>
        <FontAwesome name="search" color={Colors.Primary} size={16} />
        <View marginL-8>
          <TextField readOnly placeholder={'搜索你想找的音乐'} />
        </View>
      </Card>
      <Card marginT-16 padding-12>
        <View row centerV marginB-12>
          <View>
            <Image
              source={{uri: STATIC_URL + userInfo?.user_avatar}}
              style={styles.image}
            />
          </View>
          <View marginL-12 flexG>
            <View row centerV>
              <Text grey20 text70BO>
                {userInfo?.user_name}
              </Text>
              <View flexS row center marginL-6>
                {userInfo?.sex === 'woman' ? (
                  <FontAwesome name="venus" color={Colors.magenta} size={12} />
                ) : userInfo?.sex === 'man' ? (
                  <FontAwesome name="mars" color={Colors.blue50} size={12} />
                ) : null}
              </View>
            </View>
            <Text grey20 text100L marginT-6>
              {latelyDay > 0 ? (
                <Text grey20 text100L marginT-6>
                  距离上次听歌已经过了
                  <Text blue60 text80L marginT-6>
                    {latelyDay}
                  </Text>
                  天
                </Text>
              ) : (
                '今天也来听听音乐吧 ~'
              )}
            </Text>
          </View>
        </View>
        <View paddingT-12 row centerV style={styles.funBox}>
          <View width={'50%'} center>
            <TouchableOpacity
              centerV
              row
              onPress={() => {
                setShowRandomDialog(true);
              }}>
              <MaterialIcons
                name="library-music"
                color={randomSwitch ? Colors.Primary : Colors.grey50}
                size={20}
              />
              <Text text80 marginL-4 grey30>
                随机播放
              </Text>
            </TouchableOpacity>
          </View>
          <View width={'50%'} center style={styles.rightBox}>
            <TouchableOpacity
              row
              centerV
              onPress={() => {
                setShowAlarmDialog(true);
              }}>
              <MaterialIcons
                name="access-alarm"
                color={alarmSwitch ? Colors.Primary : Colors.grey50}
                size={20}
              />
              <Text text80 marginL-4 grey30>
                定时关闭
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
      <View marginT-16>
        <GridList
          data={itemData}
          containerWidth={fullWidth - 32}
          numColumns={2}
          keyExtractor={(item, index) => item.title + index}
          renderItem={({item, index}) => (
            <Card flexS centerV enableShadow={true} padding-12>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate(item.route);
                }}>
                <FontAwesome
                  name={item.icon}
                  color={item.iconColor}
                  size={22}
                />
                <View row bottom>
                  <Text marginT-6 text70BO grey20>
                    {item.title}
                  </Text>
                  <Text text90L grey40 marginL-4 marginB-2>
                    {item.num}
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      </View>
      <View marginT-16 flexS>
        <View row centerV spread>
          <View row centerV>
            <Text text70BL>我的歌单</Text>
            <Text text80L grey40 marginL-4>
              {favoritesCount}
            </Text>
          </View>
          <View row centerV>
            {isMultiSelect ? (
              <>
                <Button
                  marginR-12
                  size={'xSmall'}
                  label={'删除'}
                  link
                  color={Colors.red30}
                  onPress={() => {
                    delFavorites(selectedItems);
                  }}
                />
                <Button
                  marginR-12
                  size={'xSmall'}
                  label={isAllSelect ? '全不选' : '全选'}
                  link
                  color={Colors.Primary}
                  onPress={() => {
                    setIsAllSelect(prev => {
                      if (!prev) {
                        setSelectedItems(favoritesList.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                      return !prev;
                    });
                  }}
                />
                <Button
                  marginR-12
                  size={'xSmall'}
                  label={'取消'}
                  link
                  color={Colors.blue40}
                  onPress={() => {
                    resetMultiSelect();
                  }}
                />
              </>
            ) : null}
            <TouchableOpacity
              row
              centerV
              padding-4
              marginR-10
              onPress={() => {
                setShowAddDialog(true);
                setFavoritesName('');
              }}>
              <AntDesign name="pluscircleo" color={Colors.grey40} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              row
              centerV
              padding-4
              onPress={() => {
                setShowImportDialog(true);
                setImportUrl('');
              }}>
              <AntDesign name="login" color={Colors.grey40} size={18} />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={favoritesList}
          keyExtractor={(item, index) => item + index}
          onEndReached={() => {
            setPageNum(prev => prev + 1);
          }}
          renderItem={({item, index}) => (
            <View marginT-8 row centerV>
              {isMultiSelect ? (
                <Checkbox
                  marginR-12
                  color={Colors.Primary}
                  size={20}
                  borderRadius={10}
                  value={selectedItems.includes(item.id)}
                  onValueChange={value => {
                    if (value) {
                      setSelectedItems(prevItem => {
                        const newItem = [...prevItem, item.id];
                        return newItem;
                      });
                    } else {
                      setSelectedItems(prevItem => {
                        const newItem = prevItem.filter(id => id !== item.id);
                        return newItem;
                      });
                    }
                  }}
                />
              ) : null}
              <Drawer
                disableHaptic={true}
                itemsTintColor={Colors.red30}
                rightItems={[
                  {
                    text: isMultiSelect ? '' : '删除',
                    background: Colors.$backgroundNeutral,
                    onPress: () => {
                      if (isMultiSelect) {
                        return;
                      }
                      setDelName(item.favorites_name);
                      setDelids([item.id]);
                      setDelVisible(true);
                    },
                  },
                ]}
                leftItem={{background: Colors.$backgroundNeutral}}>
                <TouchableOpacity
                  row
                  centerV
                  backgroundColor={Colors.$backgroundNeutral}
                  onLongPress={() => {
                    Vibration.vibrate(50);
                    setIsMultiSelect(true);
                  }}
                  onPress={() => {
                    navigation.navigate('FavoritesDetail', {
                      favoritesId: item.id,
                    });
                  }}>
                  <Image
                    source={{uri: THUMBNAIL_URL + item.favorites_cover}}
                    style={styles.favoritesCover}
                  />
                  <View centerV marginL-12>
                    <Text>{item.favorites_name}</Text>
                    <Text marginT-4 text90L grey40>
                      {item.musicCount}首歌曲
                    </Text>
                  </View>
                </TouchableOpacity>
              </Drawer>
            </View>
          )}
          ListEmptyComponent={
            <View marginT-16 center>
              <Text text90L grey40>
                还没有任何歌单，快去新建一个吧~
              </Text>
            </View>
          }
          ListFooterComponent={<View marginB-140 />}
        />
      </View>
      <BaseDialog
        IsButton={true}
        Fun={() => {
          submitData();
        }}
        Visible={showAddDialog}
        SetVisible={setShowAddDialog}
        MainText={'新建歌单'}
        Body={
          <View>
            <TextField
              text70
              placeholderTextColor={Colors.grey40}
              placeholder={'请输入歌单名称'}
              floatingPlaceholder
              value={favoritesName}
              maxLength={10}
              onChangeText={value => {
                setFavoritesName(value);
              }}
            />
          </View>
        }
      />
      <BaseDialog
        IsButton={true}
        Fun={() => {
          onImport();
          setShowImportDialog(false);
        }}
        Visible={showImportDialog}
        SetVisible={setShowImportDialog}
        MainText={'导入外部歌单'}
        Body={
          <View>
            <Text marginT-2 text90L blue40>
              暂只支持QQ音乐，同名歌单将覆盖原歌单
            </Text>
            <TextField
              text70
              placeholderTextColor={Colors.grey40}
              placeholder={'请输入歌单分享链接'}
              floatingPlaceholder
              value={importUrl}
              onChangeText={value => {
                setImportUrl(value);
              }}
            />
          </View>
        }
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          delFavorites();
          setDelVisible(false);
        }}
        Visible={delVisible}
        SetVisible={setDelVisible}
        MainText={`您确定要删除 ${delName} 吗？`}
      />
      <Dialog
        visible={showAlarmDialog}
        useSafeArea={true}
        onDismiss={() => setShowAlarmDialog(false)}
        width={'90%'}
        panDirection={PanningProvider.Directions.DOWN}>
        <Card flexS padding-16>
          <View row centerV>
            <Text text70BL marginR-12>
              定时关闭
            </Text>
            <Switch
              onColor={Colors.Primary}
              offColor={Colors.grey50}
              value={alarmSwitch}
              onValueChange={value => {
                if (value) {
                  dispatch(setCloseTime(alarmTime));
                } else {
                  setAlarmTime(0);
                  dispatch(setCloseTime(0));
                }
                setAlarmSwitch(value);
              }}
            />
          </View>
          <View marginT-12>
            <Text text90L grey30 marginV-6>
              将在{alarmTime}分钟后停止播放
            </Text>
            <Slider
              thumbTintColor={Colors.Primary}
              minimumTrackTintColor={Colors.Primary}
              minimumValue={0}
              maximumValue={120}
              onValueChange={value => {
                setAlarmTime(value);
                if (alarmSwitch) {
                  dispatch(setCloseTime(value));
                }
              }}
              value={alarmTime}
              step={1}
            />
          </View>
        </Card>
      </Dialog>
      <Dialog
        visible={showRandomDialog}
        useSafeArea={true}
        onDismiss={() => setShowRandomDialog(false)}
        width={'90%'}
        panDirection={PanningProvider.Directions.DOWN}>
        <Card flexS padding-16>
          <View row centerV>
            <Text text70BL marginR-12>
              随机播放
            </Text>
            <Switch
              onColor={Colors.Primary}
              offColor={Colors.grey50}
              value={randomSwitch}
              onValueChange={value => {
                if (value) {
                  dispatch(setIsRandomPlay(value));
                  showToast('随机播放已开启', 'success');
                } else {
                  dispatch(setRandomNum({min: 1, max: allMusicNum}));
                  dispatch(setIsRandomPlay(value));
                }
                setRandomSwitch(value);
              }}
            />
          </View>
          <View marginT-12>
            <Text text90L grey30 marginV-6>
              将在曲库中第{randomNum.min}-{randomNum.max}首歌曲之间随机播放
            </Text>
            <Slider
              thumbTintColor={Colors.Primary}
              minimumTrackTintColor={Colors.Primary}
              minimumValue={1}
              maximumValue={allMusicNum}
              initialMinimumValue={randomNum?.min}
              initialMaximumValue={randomNum?.max}
              useGap={true}
              useRange={true}
              step={1}
              onRangeChange={values => {
                dispatch(setRandomNum(values));
              }}
            />
          </View>
        </Card>
      </Dialog>
    </View>
  );
};
const styles = StyleSheet.create({
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: Colors.grey80,
    borderWidth: 1,
  },
  favoritesCover: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderColor: Colors.white,
    borderWidth: 1,
  },
  delBox: {
    color: Colors.$backgroundNeutral,
  },
  funBox: {
    borderTopWidth: 1,
    borderColor: Colors.grey80,
  },
  rightBox: {
    borderLeftWidth: 1,
    borderColor: Colors.grey80,
  },
});
export default Music;
