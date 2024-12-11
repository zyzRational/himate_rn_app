import React, {useState, useEffect} from 'react';
import {View, Card, Colors, Button, TextField} from 'react-native-ui-lib';
import {StyleSheet} from 'react-native';
import {getFavoritesList} from '../../../api/music';
import FavoritesList from '../../../components/music/FavoritesList';

const FindFavorites = ({navigation}) => {
  /* 获取收藏夹列表 */
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [favoritesList, setFavoritesList] = useState([]);
  const getAllFavoritesList = async () => {
    try {
      const res = await getFavoritesList({
        pageSize: pageNum * 20,
        is_public: 1,
        favorites_name: keyword,
      });
      if (res.success) {
        console.log(res.data.list);
        setFavoritesList(res.data.list);
      }
    } catch (error) {
      console.log(error);
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
            onPress={() => getAllFavoritesList()}
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
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    width: '86%',
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderRadius: 8,
    height: 42,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
});
export default FindFavorites;
