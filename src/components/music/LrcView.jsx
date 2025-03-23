import React, {useState, useEffect, useRef} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {formatLrc} from '../../utils/handle/lyricHandle';
import {isEmptyObject} from '../../utils/base';
import {View, Text, Colors, TouchableOpacity, Image} from 'react-native-ui-lib';
import {fullHeight, fullWidth} from '../../styles';
import LrcItem from './LrcItem';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useToast} from '../commom/Toast';

const LrcView = props => {
  const {
    Music = {},
    Cover = '',
    CurrentTime,
    OnLyricsChange = () => {},
  } = props;
  const {showToast} = useToast();
  const [parsedLrc, setParsedLrc] = useState([]);
  const flatListRef = useRef(null);

  const [haveTrans, setHaveTrans] = useState(false);
  const [haveRoma, setHaveRoma] = useState(false);
  const [transVisible, setTransVisible] = useState(true);
  const [romaVisible, setRomaVisible] = useState(false);

  // 切换歌词
  const switchLyric = () => {
    setTransVisible(prev => {
      if (!prev && haveTrans) {
        showToast('已显示翻译歌词', 'success', true);
        return true;
      }
      return false;
    });
    setRomaVisible(prev => {
      if (!prev && haveRoma) {
        showToast('已显示音译歌词', 'success', true);
        return true;
      }
      return false;
    });
  };

  // 解析歌词
  useEffect(() => {
    if (Music && !isEmptyObject(Music)) {
      const {
        Lyrics,
        haveTrans: _haveTrans,
        haveRoma: _haveRoma,
      } = formatLrc(Music);
      setParsedLrc(Lyrics);
      setHaveRoma(_haveRoma);
      setHaveTrans(_haveTrans);
    }
  }, [Music]);

  // 根据当前时间找到对应的歌词索引
  const findCurrentLineIndex = () => {
    for (let i = 0; i < parsedLrc.length; i++) {
      if (parsedLrc[i].time > CurrentTime) {
        return i - 1;
      }
    }
    return parsedLrc.length - 1;
  };

  // 自动滚动到当前歌词
  const [nowIndex, setNowIndex] = useState(-1);
  useEffect(() => {
    const index = findCurrentLineIndex();
    setNowIndex(index);
    if (flatListRef.current && index >= 0) {
      flatListRef.current.scrollToIndex({index, animated: true});
      OnLyricsChange(parsedLrc[index].lyric);
    }
  }, [CurrentTime]);

  // 渲染每行歌词
  const renderItem = ({item, index}) => {
    return (
      <LrcItem
        Item={item}
        Index={index}
        NowIndex={nowIndex}
        TransVisible={transVisible && haveTrans}
        RomaVisible={romaVisible && haveRoma}
      />
    );
  };

  return (
    <View>
      <View flexS row centerV paddingV-16 paddingH-20>
        {Music?.music_name ? (
          <Image
            source={{
              uri: Cover,
            }}
            style={styles.image}
          />
        ) : null}
        <View>
          <Text white text70BO width={fullWidth * 0.78} numberOfLines={1}>
            {Music?.music_name}
          </Text>
          <Text white marginT-2 width={fullWidth * 0.78} numberOfLines={1}>
            {Music?.music_singer}
          </Text>
        </View>
      </View>
      <View height={fullHeight * 0.8}>
        {parsedLrc.length ? (
          <FlatList
            ref={flatListRef}
            data={parsedLrc}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.container}
            getItemLayout={(data, index) => {
              return {
                length:
                  (transVisible && haveTrans) || (romaVisible && haveRoma)
                    ? 72
                    : 46,
                offset:
                  ((transVisible && haveTrans) || (romaVisible && haveRoma)
                    ? 72
                    : 46) * index,
                index,
              };
            }}
          />
        ) : (
          <View height={'100%'} center>
            <Text white text80>
              此歌曲暂时还没有歌词哦 ~
            </Text>
          </View>
        )}
      </View>
      {haveRoma || haveTrans ? (
        <View style={styles.switchBut}>
          <TouchableOpacity style={styles.musicBut} onPress={switchLyric}>
            <Ionicons name="sync-sharp" color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  lyricText: {
    fontSize: 16,
    color: Colors.white,
    width: '100%',
  },
  transText: {
    fontSize: 14,
    color: Colors.white,
    width: '100%',
    marginTop: 10,
  },
  image: {
    width: 46,
    height: 46,
    borderRadius: 8,
    marginRight: 12,
  },
  container: {
    paddingVertical: fullHeight / 2 - 120,
  },
  line: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 10,
  },
  activeLine: {
    fontSize: 22,
    color: Colors.Primary,
    fontWeight: 'bold',
  },
  activeLine2: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: 'bold',
  },
  switchBut: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: Colors.hyalineWhite,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 16,
    right: 24,
  },
  musicBut: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LrcView;
