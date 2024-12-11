import React, {useState, useEffect} from 'react';
import {View} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import {getFavoritesDetail} from '../../../api/music';
import MusicList from '../../../components/music/MusicList';

const MyFavorites = ({navigation}) => {
  const userInfo = useSelector(state => state.userStore.userInfo);

  const [music, setMusic] = useState([]);
  const [favoriteId, setFavoriteId] = useState(null);

  /* 获取用户收藏的音乐列表 */
  const [pageNum, setPageNum] = useState(1);
  const getAllMusicList = async userId => {
    try {
      const res = await getFavoritesDetail({
        pageSize: pageNum * 20,
        creator_uid: userId,
        is_default: 1,
      });
      if (res.success) {
        // console.log(res.data);
        setFavoriteId(res.data.id);
        setMusic(res.data.music);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (userInfo?.id) {
      getAllMusicList(userInfo?.id);
    }
  }, [userInfo, pageNum]);

  return (
    <View padding-12>
      <MusicList
        HeightScale={0.92}
        List={music}
        FavoriteId={favoriteId}
        RefreshList={() => {
          getAllMusicList(userInfo?.id);
        }}
        IsOwn={true}
        OnEndReached={() => {
          setPageNum(prev => prev + 1);
        }}
      />
    </View>
  );
};

export default MyFavorites;
