import React, {useState, useEffect, useRef} from 'react';
import {FlatList, StyleSheet, Dimensions} from 'react-native';
import {formatLrc} from '../../utils/handle/lyricHandle';
import {formatMilliseconds, isEmptyString} from '../../utils/base';
import {
  View,
  Text,
  Colors,
  Image,
  TouchableOpacity,
  Slider,
  Carousel,
} from 'react-native-ui-lib';
import {fullHeight} from '../../styles';

const LrcView = props => {
  const {Music = {}, CurrentTime} = props;
  const [parsedLrc, setParsedLrc] = useState([]);
  const flatListRef = useRef(null);

  // 解析歌词
  useEffect(() => {
    const _lrc = formatLrc(Music);
    setParsedLrc(_lrc);
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
  useEffect(() => {
    const index = findCurrentLineIndex();
    if (flatListRef.current && index >= 0) {
      flatListRef.current.scrollToIndex({index, animated: true});
    }
  }, [CurrentTime]);

  // 渲染每行歌词
  const renderItem = ({item, index}) => {
    const isActive = index === findCurrentLineIndex();
    return isEmptyString(item.text) ? null : (
      <View paddingV-12 paddingH-20>
        <Text text70 white style={[isActive && styles.activeLine]}>
          {item.text}
        </Text>
      </View>
    );
  };
  return (
    <View height={fullHeight}>
      <View paddingV-16 paddingH-20>
        <Text white text60BO>
          {Music?.music_name}
        </Text>
        <Text white marginT-2>
          {Music?.music_singer}
        </Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={parsedLrc}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.container}
        getItemLayout={(data, index) => ({
          length: 40,
          offset: 40 * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: fullHeight / 24, // 让当前歌词居中
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
});

export default LrcView;
