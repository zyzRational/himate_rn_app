import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {formatLrc} from '../../utils/handle/lyricHandle';
import {View, Text, Colors, TouchableOpacity, Image} from 'react-native-ui-lib';
import {fullHeight, fullWidth} from '../../styles';
import LrcItem from './LrcItem';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useToast} from '../commom/Toast';
import {useSelector, useDispatch} from 'react-redux';
import {setSwitchCount} from '../../stores/store-slice/musicStore';

const MODES = [
  {name: 'lrc+trans', label: '普通+翻译歌词'},
  {name: 'lrc+roma', label: '普通+音译歌词'},
  {name: 'lrc', label: '普通歌词'},
  {name: 'yrc+trans', label: '逐字+翻译歌词'},
  {name: 'yrc+roma', label: '逐字+音译歌词'},
  {name: 'yrc', label: '逐字歌词'},
];

const LrcView = React.memo(props => {
  const {
    IsHorizontal = false,
    Music = {},
    Cover = '',
    CurrentTime,
    OnLyricsChange = () => {},
  } = props;
  const {showToast} = useToast();
  const [parsedLrc, setParsedLrc] = useState([]);
  const flatListRef = useRef(null);

  const dispatch = useDispatch();
  const switchCount = useSelector(state => state.musicStore.switchCount);

  const [haveYrc, setHaveYrc] = useState(false);
  const [haveTrans, setHaveTrans] = useState(false);
  const [haveRoma, setHaveRoma] = useState(false);
  const [availableModes, setAvailableModes] = useState([]);
  const [transVisible, setTransVisible] = useState(true);
  const [romaVisible, setRomaVisible] = useState(false);
  const [yrcVisible, setYrcVisible] = useState(false);
  // 歌词是否为两行
  const [isTwoLines, setIsTwoLines] = useState(true);

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
    const modes = filteredModes(_haveYrc, _haveTrans, _haveRoma);
    setAvailableModes(modes);
    showLyric(modes[switchCount]);

    shouldSkip.current = false;
  }, [Music]);

  // 过滤出可用的歌词模式
  const filteredModes = (_haveYrc, _haveTrans, _haveRoma) => {
    const modes = MODES.filter(mode => {
      switch (mode.name) {
        case 'lrc+trans':
          return _haveTrans;
        case 'lrc+roma':
          return _haveRoma;
        case 'lrc':
          return true;
        case 'yrc+trans':
          return _haveTrans && _haveYrc;
        case 'yrc+roma':
          return _haveRoma && _haveYrc;
        case 'yrc':
          return _haveYrc;
        default:
          return false;
      }
    });
    return modes;
  };

  // 切换歌词
  const switchLyric = useCallback(() => {
    shouldSkip.current = false;

    const currentModeIndex = (switchCount + 1) % availableModes.length;
    const currentMode = availableModes[currentModeIndex];
    showLyric(currentMode);
    dispatch(setSwitchCount(currentModeIndex));
    showToast(`已切换为${currentMode.label}`, 'success', true);
  }, [switchCount, availableModes]);

  // 显示对应歌词
  const showLyric = _mode => {
    const {name} = _mode || {};
    switch (name) {
      case 'lrc+trans':
        setYrcVisible(false);
        setTransVisible(true);
        setRomaVisible(false);
        setIsTwoLines(true);
        break;
      case 'lrc+roma':
        setYrcVisible(false);
        setTransVisible(false);
        setRomaVisible(true);
        setIsTwoLines(true);
        break;
      case 'lrc':
        setYrcVisible(false);
        setTransVisible(false);
        setRomaVisible(false);
        setIsTwoLines(false);
        break;
      case 'yrc+trans':
        setYrcVisible(true);
        setTransVisible(true);
        setRomaVisible(false);
        setIsTwoLines(true);
        break;
      case 'yrc+roma':
        setYrcVisible(true);
        setTransVisible(false);
        setRomaVisible(true);
        setIsTwoLines(true);
        break;
      case 'yrc':
        setYrcVisible(true);
        setTransVisible(false);
        setRomaVisible(false);
        setIsTwoLines(false);
        break;
      default:
        setYrcVisible(false);
        setTransVisible(true);
        setRomaVisible(false);
        setIsTwoLines(true);
        break;
    }
  };

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
  }, [findCurrentLineIndex, parsedLrc]);

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
        if (isTwoLines && height === 68) {
          return prev;
        }
        if (!isTwoLines && height === 48) {
          return prev;
        }
        if (prev.get(index) === height) {
          return prev;
        }
        const newMap = new Map(prev);
        newMap.set(index, height);
        return newMap;
      });
    },
    [parsedLrc.length, shouldSkip.current, isTwoLines],
  );

  const itemLayouts = useMemo(() => {
    const newLengths = new Map();
    const newOffsets = new Map();
    if (!parsedLrc.length || itemHeights.size === 0 || !shouldSkip.current) {
      return {lengths: newLengths, offsets: newOffsets};
    }

    const defaultHeight = isTwoLines ? 68 : 48; // 动态默认高度
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
  }, [isTwoLines, itemHeights, parsedLrc.length, shouldSkip.current]);

  // 计算每行歌词高度
  const getItemLayout = useCallback(
    (data, index) => {
      const {lengths, offsets} = itemLayouts || {};
      return {
        length: lengths.get(index) || isTwoLines ? 68 : 48,
        offset: offsets.get(index) || (isTwoLines ? 68 : 48) * index,
        index,
      };
    },
    [isTwoLines, itemLayouts],
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
          IsHorizontal={IsHorizontal}
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

  const lrcHeight = useMemo(() => {
    const h = IsHorizontal ? fullHeight * 0.9 : fullHeight * 0.78;
    return h - (h % 68);
  }, [fullWidth, IsHorizontal]);

  return (
    <View>
      {IsHorizontal ? null : (
        <View flexS row centerV paddingV-16 paddingH-20 paddingB-20>
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
      )}
      <View height={lrcHeight}>
        {parsedLrc.length ? (
          <FlatList
            ref={flatListRef}
            data={parsedLrc}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{
              paddingVertical: isTwoLines
                ? lrcHeight / 2 - 48
                : lrcHeight / 2 - 68,
            }}
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
