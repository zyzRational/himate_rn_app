import React, {useState, useEffect} from 'react';
import {
  View,
  Card,
  Colors,
  LoaderScreen,
  Button,
  TextField,
} from 'react-native-ui-lib';
import {StyleSheet} from 'react-native';
import {getFavoritesList} from '../../../api/music';
import FavoritesList from '../../../components/music/FavoritesList';

const FindFavorites = ({navigation}) => {
  /* 获取收藏夹列表 */
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [favoritesList, setFavoritesList] = useState([]);
  const pageSize = 20;
  const getAllFavoritesList = async () => {
    try {
      setIsLoading(true);
      const res = await getFavoritesList({
        pageNum,
        pageSize,
        is_public: 1,
        favorites_name: keyword,
      });
      if (res.success) {
        const {list} = res.data;
        setFavoritesList(prev => [...prev, ...list]);
        if (list.length < pageSize && pageNum !== 0) {
          return;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllFavoritesList();
  }, [pageNum]);

  return (
    <>
      <View padding-12>
        <Card row centerV>
          <TextField
            containerStyle={styles.input}
            placeholder={'请输入歌单关键字'}
            value={keyword}
            onChangeText={value => {
              setKeyword(value);
              if (!value) {
                getAllFavoritesList();
              }
            }}
          />
          <Button
            label={'搜索'}
            link
            linkColor={Colors.Primary}
            onPress={() => {
              setPageNum(1);
              setFavoritesList([]);
              getAllFavoritesList();
            }}
          />
        </Card>
        <View marginT-12>
          <FavoritesList
            List={favoritesList}
            OnPress={item => {
              navigation.navigate('FavoritesDetail', {
                favoritesId: item.id,
              });
            }}
            OnEndReached={() => {
              setPageNum(prev => prev + 1);
            }}
          />
        </View>
      </View>
      {isLoading ? (
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
  input: {
    width: '86%',
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderRadius: 12,
    height: 42,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
});
export default FindFavorites;
