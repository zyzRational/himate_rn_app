import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  LoaderScreen,
  Card,
  Colors,
  Button,
  TextField,
} from 'react-native-ui-lib';
import {StyleSheet} from 'react-native';
import {getMusicList} from '../../../api/music';
import MusicList from '../../../components/music/MusicList';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const SearchMusic = ({navigation}) => {
  /* 获取收藏夹列表 */
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [music, setMusic] = useState([]);
  const pageSize = 20;
  const getAllMusicList = async () => {
    try {
      setIsLoading(true);
      const res = await getMusicList({
        pageNum,
        pageSize,
        title: keyword,
        artist: keyword,
        album: keyword,
      });
      if (res.success) {
        const {list} = res.data;
        setMusic(prev => [...prev, ...list]);
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
    getAllMusicList();
  }, [pageNum]);

  return (
    <>
      <View padding-12>
        <Card row centerV>
          <TextField
            containerStyle={styles.input}
            placeholder={'请输入歌曲关键字'}
            value={keyword}
            onChangeText={value => {
              setKeyword(value);
              if (!value) {
                getAllMusicList();
              }
            }}
          />
          <Button
            label={'搜索'}
            link
            linkColor={Colors.Primary}
            onPress={() => {
              setPageNum(1);
              setMusic([]);
              getAllMusicList();
            }}
          />
        </Card>
        <View marginT-12>
          <View row centerV marginL-4 marginB-12>
            <FontAwesome name="clock-o" color={Colors.blue40} size={18} />
            <Text text70BO blue40 marginL-4>
              最近更新
            </Text>
          </View>
          <MusicList
            HeightScale={0.8}
            List={music}
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
export default SearchMusic;
