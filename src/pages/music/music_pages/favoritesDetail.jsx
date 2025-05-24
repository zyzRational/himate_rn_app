import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Colors,
  Image,
  TouchableOpacity,
  Avatar,
  LoaderScreen,
} from 'react-native-ui-lib';
import {StyleSheet} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {getFavoritesDetail} from '../../../api/music';
import MusicList from '../../../components/music/MusicList';
import FavoriteModal from '../../../components/music/FavoriteModal';
import {isEmptyObject} from '../../../utils/base';
import dayjs from 'dayjs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const FavoritesDetail = ({navigation, route}) => {
  const {favoritesId} = route.params || {};

  const isFocused = useIsFocused();

  const userId = useSelector(state => state.userStore.userId);

  // baseConfig
  const {STATIC_URL, THUMBNAIL_URL} = useSelector(
    state => state.baseConfigStore.baseConfig,
  );

  /* 获取收藏夹详情 */
  const [loading, setLoading] = useState(false);
  const [favoritesForm, setFavoritesForm] = useState({});
  const [music, setMusic] = useState([]);
  const getFavorites = async f_id => {
    setLoading(true);
    try {
      const res = await getFavoritesDetail({id: f_id});
      if (res.success) {
        setFavoritesForm(res.data);
        setMusic(res.data.music);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (favoritesId && isFocused) {
      getFavorites(favoritesId);
    }
  }, [favoritesId, isFocused]);

  const [detailModalVisible, setdDetailModalVisible] = useState(false);

  return (
    <>
      {isEmptyObject(favoritesForm) ? null : (
        <>
          <View padding-24 row spread>
            <View flexS row width={'70%'}>
              <TouchableOpacity
                onPress={() => {
                  setdDetailModalVisible(true);
                }}>
                <Image
                  source={{uri: THUMBNAIL_URL + favoritesForm.favorites_cover}}
                  style={styles.image}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setdDetailModalVisible(true);
                }}>
                <View marginL-12>
                  <Text text60 grey10 marginT-4 numberOfLines={2}>
                    {favoritesForm.favorites_name}
                  </Text>
                  <View row centerV marginT-10>
                    <Avatar
                      size={26}
                      source={{
                        uri: STATIC_URL + favoritesForm.creator_avatar,
                      }}
                    />
                    <Text text90 marginL-4 grey20>
                      {favoritesForm.creator_name}
                    </Text>
                  </View>
                  <Text marginT-10 text90L grey40>
                    创建于
                    {dayjs(favoritesForm.create_time).format('YYYY-MM-DD')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            {favoritesForm?.creator_uid === userId ? (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('EditFavorites', {
                    favoritesId: favoritesForm.id,
                  });
                }}
                row
                centerV>
                <FontAwesome name="edit" color={Colors.grey40} size={20} />
                <Text marginL-4 text80BO grey40>
                  编辑
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
          </View>
          <TouchableOpacity
            paddingH-16
            onPress={() => {
              setdDetailModalVisible(true);
            }}>
            <Text grey20 text70BO>
              歌单简介
            </Text>
            <Text grey40 text90L marginT-4 numberOfLines={1}>
              {favoritesForm.favorites_remark ?? '还没有简介哦~'}
            </Text>
          </TouchableOpacity>
        </>
      )}
      <View paddingH-12 marginT-12>
        <MusicList
          List={music}
          FavoriteId={favoritesId}
          RefreshList={() => {
            getFavorites(favoritesId);
          }}
          IsOwn={favoritesForm?.creator_uid === userId}
        />
      </View>
      <FavoriteModal
        Visible={detailModalVisible}
        OnClose={() => setdDetailModalVisible(false)}
        BackgroundImg={THUMBNAIL_URL + favoritesForm?.favorites_cover}
        Title={favoritesForm?.favorites_name}
        Remark={favoritesForm?.favorites_remark}
        CreateAvatar={STATIC_URL + favoritesForm?.creator_avatar}
        CreateName={favoritesForm?.creator_name}
      />
      {loading ? (
        <LoaderScreen
          message={'加载中...'}
          color={Colors.Primary}
          backgroundColor={Colors.hyalineWhite}
          overlay={true}
        />
      ) : null}
    </>
  );
};
const styles = StyleSheet.create({
  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderColor: Colors.white,
    borderWidth: 1,
  },
  userName: {
    maxWidth: 80,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});
export default FavoritesDetail;
