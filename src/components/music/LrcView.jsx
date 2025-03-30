import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {formatLrc} from '../../utils/handle/lyricHandle';
import {View, Text, Colors, TouchableOpacity, Image} from 'react-native-ui-lib';
import {fullHeight, fullWidth} from '../../styles';
import LrcItem from './LrcItem';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useToast} from '../commom/Toast';
import {useSelector, useDispatch} from 'react-redux';
import {setLrcFlag, setSwitchCount} from '../../stores/store-slice/musicStore';

const LrcView = React.memo(props => {
  const {
    Music = {},
    Cover = '',
    CurrentTime,
    OnLyricsChange = () => {},
  } = props;
  const {showToast} = useToast();
  const [parsedLrc, setParsedLrc] = useState([]);
  const flatListRef = useRef(null);

  const dispatch = useDispatch();
  const yrcVisible = useSelector(state => state.musicStore.yrcVisible);
  const transVisible = useSelector(state => state.musicStore.transVisible);
  const romaVisible = useSelector(state => state.musicStore.romaVisible);
  const switchCount = useSelector(state => state.musicStore.switchCount);

  const [haveYrc, setHaveYrc] = useState(false);
  const [haveTrans, setHaveTrans] = useState(false);
  const [haveRoma, setHaveRoma] = useState(false);

  // 解析歌词
  useEffect(() => {
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
    setItemHeights(() => new Map());
    shouldSkip.current = false;
  }, [Music]);

  // 切换歌词
  const switchLyric = useCallback(() => {
    shouldSkip.current = false;
    setItemHeights(() => new Map());
    dispatch(
      setLrcFlag({
        yrcVisible: haveYrc && [3, 4, 5].includes(switchCount),
        transVisible: haveTrans && [0, 3].includes(switchCount),
        romaVisible: haveRoma && [1, 4].includes(switchCount),
      }),
    );
    if (haveTrans && [0, 3].includes(switchCount)) {
      showToast('已切换到翻译歌词', 'success', true);
    }
    if (haveRoma && [1, 4].includes(switchCount)) {
      showToast('已切换到音译歌词', 'success', true);
    }

    let skip = 0;
    let maxCount = haveYrc ? 5 : 2;
    if (!haveTrans && [5, 2].includes(switchCount)) {
      skip += 1;
    }
    if (!haveRoma && [0, 3].includes(switchCount)) {
      skip += 1;
    }
    if (!haveTrans && !haveRoma) {
      skip += 1;
    }
    dispatch(
      setSwitchCount(switchCount < maxCount ? switchCount + skip + 1 : 0),
    );
  }, [haveRoma, haveTrans, haveYrc, switchCount]);

  // 查找当前行
  const findCurrentLineIndex = useCallback(() => {
    if (parsedLrc.length === 0) {
      return -1;
    }

    for (let i = 0; i < parsedLrc.length; i++) {
      const matchTime =
        yrcVisible && haveYrc ? parsedLrc[i].startTime : parsedLrc[i].time;
      if (matchTime > CurrentTime) {
        return i - 1;
      }
    }
    return parsedLrc.length - 1;
  }, [parsedLrc, yrcVisible, haveYrc, CurrentTime]);

  // 自动滚动到当前歌词 - 保留基本逻辑
  const [nowIndex, setNowIndex] = useState(-1);
  useEffect(() => {
    const index = findCurrentLineIndex();
    setNowIndex(index);
    if (flatListRef.current && index >= 0) {
      flatListRef.current.scrollToIndex({index, animated: true});
      OnLyricsChange(parsedLrc[index]?.lyric);
    } else {
      OnLyricsChange('');
    }
  }, [CurrentTime, findCurrentLineIndex, OnLyricsChange, parsedLrc]);

  // 歌词是否为两行
  const isTwoLines = useRef(
    (transVisible && haveTrans) || (romaVisible && haveRoma),
  );
  useEffect(() => {
    isTwoLines.current =
      (transVisible && haveTrans) || (romaVisible && haveRoma);
  }, [transVisible, haveTrans, romaVisible, haveRoma]);

  // 每行歌词高度变化
  const [itemHeights, setItemHeights] = useState(() => new Map());
  const shouldSkip = useRef(false);
  const OnItemLayout = useCallback(
    (index, height) => {
      if (shouldSkip.current || index === parsedLrc.length - 1) {
        shouldSkip.current = true;
        return;
      }
      setItemHeights(prev => {
        if (
          isTwoLines.current &&
          (prev.get(index) === height || height === 68)
        ) {
          return prev;
        }
        if (
          !isTwoLines.current &&
          (prev.get(index) === height || height === 48)
        ) {
          return prev;
        }
        const newMap = new Map(prev);
        newMap.set(index, height);
        return newMap;
      });
    },
    [parsedLrc?.length, shouldSkip.current, isTwoLines.current, setItemHeights],
  );

  const itemLayouts = useMemo(() => {
    const newLengths = new Map();
    const newOffsets = new Map();
    if (!parsedLrc?.length || itemHeights.size === 0 || !shouldSkip.current) {
      return {lengths: newLengths, offsets: newOffsets};
    }

    const defaultHeight = isTwoLines.current ? 68 : 48; // 动态默认高度
    const maxIndex = parsedLrc.length - 1;

    for (let i = 0; i <= maxIndex; i++) {
      newLengths.set(i, itemHeights.get(i) || defaultHeight);
    }

    let currentOffset = 0;
    for (let i = 0; i <= newLengths.size; i++) {
      newOffsets.set(i, currentOffset);
      currentOffset += newLengths.get(i) || defaultHeight;
    }
    return {
      lengths: newLengths,
      offsets: newOffsets,
    };
  }, [isTwoLines.current, itemHeights, parsedLrc?.length, shouldSkip.current]);

  // 计算每行歌词高度
  const getItemLayout = useCallback(
    (data, index) => {
      const {lengths, offsets} = itemLayouts || {};
      return {
        length: lengths.get(index) || isTwoLines.current ? 68 : 48,
        offset: offsets.get(index) || (isTwoLines.current ? 68 : 48) * index,
        index,
      };
    },
    [isTwoLines.current, itemLayouts, itemHeights],
  );

  // 渲染每行歌词
  const renderItem = useCallback(
    ({item, index}) => {
      const isActive = nowIndex === index;
      let progress = 0;
      let visibleChars = '';
      const fullText = item.words.map(w => w.char).join('');
      if (isActive) {
        const lineTime = CurrentTime - item.startTime;
        progress = Math.min(Math.max(lineTime / item.duration, 0), 1);

        for (const word of item.words) {
          if (CurrentTime >= word.startTime) {
            visibleChars += word.char;
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
          VisibleChars={visibleChars}
          FullText={fullText}
          YrcVisible={yrcVisible && haveYrc}
          TransVisible={transVisible && haveTrans}
          RomaVisible={romaVisible && haveRoma}
          OnItemLayout={OnItemLayout}
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

  // 基本FlatList配置
  const contentContainerStyle = {
    paddingVertical: (fullHeight * 0.8) / 2 - 68,
  };

  return (
    <View>
      <View flexS row centerV paddingV-16 paddingH-20>
        {Music?.music_name ? (
          <Image
            source={{uri: Cover}}
            style={[styles.image, {borderColor: Colors.lyricColor}]}
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
            getItemLayout={getItemLayout}
          />
        ) : (
          <View height={'100%'} center>
            <Text color={Colors.lyricColor} text80>
              此歌曲暂时还没有歌词哦 ~
            </Text>
          </View>
        )}
      </View>
      {(haveRoma || haveTrans || haveYrc) && parsedLrc.length > 0 && (
        <View style={styles.switchView}>
          <View backgroundColor={Colors.hyalineWhite} style={styles.switchBut}>
            <TouchableOpacity style={styles.musicBut} onPress={switchLyric}>
              <Ionicons name="sync-sharp" color={Colors.lyricColor} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  // 保持原有样式不变
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
    borderWidth: 0.5,
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
