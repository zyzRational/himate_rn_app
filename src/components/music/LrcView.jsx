import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
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

  const [haveYrc, setHaveYrc] = useState(false);
  const [haveTrans, setHaveTrans] = useState(false);
  const [haveRoma, setHaveRoma] = useState(false);
  const [yrcVisible, setYrcVisible] = useState(false);
  const [transVisible, setTransVisible] = useState(true);
  const [romaVisible, setRomaVisible] = useState(false);

  // 解析歌词
  useEffect(() => {
    if (Music && !isEmptyObject(Music)) {
      const {
        Lyrics,
        haveTrans: _haveTrans,
        haveRoma: _haveRoma,
        haveYrc: _haveYrc,
      } = formatLrc(Music);

      setParsedLrc(Lyrics);
      setHaveYrc(_haveYrc);
      setHaveRoma(_haveRoma);
      setHaveTrans(_haveTrans);
    }
  }, [Music]);

  // 切换歌词
  const switchLyric = useCallback(() => {
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
  }, [haveTrans, haveRoma, showToast]);

  // 根据当前时间找到对应的歌词索引
  const findCurrentLineIndex = useCallback(() => {
    for (let i = 0; i < parsedLrc.length; i++) {
      const matchTime =
        yrcVisible && haveYrc ? parsedLrc[i].startTime : parsedLrc[i].time;
      if (matchTime > CurrentTime) {
        return i - 1;
      }
    }
    return parsedLrc.length - 1;
  }, [parsedLrc, yrcVisible, haveYrc, CurrentTime]);

  // 自动滚动到当前歌词
  const [nowIndex, setNowIndex] = useState(-1);
  useEffect(() => {
    const index = findCurrentLineIndex();
    setNowIndex(index);
    if (flatListRef.current && index >= 0) {
      flatListRef.current.scrollToIndex({index, animated: true});
      OnLyricsChange(parsedLrc[index]?.lyric);
    }
  }, [CurrentTime, OnLyricsChange, findCurrentLineIndex]);

  // 渲染每行歌词
  const renderItem = useCallback(
    ({item, index}) => {
      let progress = 0;
      const visibleChars = [];
      const fullText = item.words.map(w => w.char).join('');
      if (nowIndex === index) {
        // 计算进度 (0-1)
        const lineTime = CurrentTime - item.startTime;
        progress = Math.min(Math.max(lineTime / item.duration, 0), 1);
        // 计算当前歌词
        for (const word of item.words) {
          if (CurrentTime >= word.startTime) {
            visibleChars.push(word.char);
          } else {
            break;
          }
        }
      }
      return (
        <LrcItem
          Item={item}
          Index={index}
          CurrentTime={CurrentTime}
          NowIndex={nowIndex}
          Progress={progress}
          VisibleChars={visibleChars.join('')}
          FullText={fullText}
          YrcVisible={yrcVisible && haveYrc}
          TransVisible={transVisible && haveTrans}
          RomaVisible={romaVisible && haveRoma}
        />
      );
    },
    [
      CurrentTime,
      nowIndex,
      yrcVisible,
      haveYrc,
      transVisible,
      haveTrans,
      romaVisible,
      haveRoma,
    ],
  );

  const contentContainerStyle = useMemo(() => {
    return {
      paddingVertical: fullHeight / 2 - 120,
    };
  }, [fullHeight]);

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
          <Text
            color={Colors.lyricColor}
            text70BO
            width={fullWidth * 0.78}
            numberOfLines={1}>
            {Music?.music_name}
          </Text>
          <Text
            color={Colors.lyricColor}
            marginT-2
            width={fullWidth * 0.78}
            numberOfLines={1}>
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
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={contentContainerStyle}
            getItemLayout={(data, index) => {
              return {
                length:
                  (transVisible && haveTrans) || (romaVisible && haveRoma)
                    ? 64
                    : 44,
                offset:
                  ((transVisible && haveTrans) || (romaVisible && haveRoma)
                    ? 64
                    : 44) * index,
                index,
              };
            }}
          />
        ) : (
          <View height={'100%'} center>
            <Text color={Colors.lyricColor} text80>
              此歌曲暂时还没有歌词哦 ~
            </Text>
          </View>
        )}
      </View>
      {(haveRoma || haveTrans || haveYrc) && parsedLrc.length > 0 ? (
        <View style={styles.switchView}>
          <View backgroundColor={Colors.hyalineWhite} style={styles.switchBut}>
            <TouchableOpacity style={styles.musicBut} onPress={switchLyric}>
              <Ionicons name="sync-sharp" color={Colors.lyricColor} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  lyricText: {
    fontSize: 16,
    color: Colors.lyricColor,
    width: '100%',
  },
  transText: {
    fontSize: 14,
    color: Colors.lyricColor,
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
    color: Colors.lyricColor,
    fontWeight: 'bold',
  },
  switchView: {
    position: 'absolute',
    bottom: 16,
    right: 24,
  },
  switchBut: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
