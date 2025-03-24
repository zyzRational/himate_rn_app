import React, {useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {View, Text, Colors} from 'react-native-ui-lib';
import {fullWidth} from '../../styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const LrcItem = React.memo(props => {
  const {
    Item = {},
    Index = 0,
    NowIndex = 0,
    CurrentTime,
    TransVisible = false,
    RromaVisible = false,
  } = props;

  // 计算当前行应该显示的字
  const visibleChars = useMemo(() => {
    if (NowIndex !== Index) {
      return [];
    }
    const result = [];
    for (const word of Item.words) {
      if (CurrentTime >= word.startTime) {
        result.push(word.char);
      } else {
        break;
      }
    }
    return result;
  }, [CurrentTime, NowIndex, Item.words]);

  // 计算进度 (0-1)
  const progress = useMemo(() => {
    if (NowIndex !== Index) {
      return [];
    }
    const lineTime = CurrentTime - Item.startTime;
    return Math.min(Math.max(lineTime / Item.duration, 0), 1);
  }, [CurrentTime, NowIndex, Item.startTime, Item.duration]);

  // 动画值
  const progressValue = useSharedValue(0);

  useEffect(() => {
    if (typeof progress === 'number') {
      progressValue.value = withTiming(progress, {
        duration: 300,
        easing: Easing.linear,
      });
    }
  }, [progress]);

  // 动画样式
  const yrcAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  // 完整行文本
  const fullText = useMemo(
    () => Item.words.map(w => w.char).join(''),
    [Item.words],
  );

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const color = useSharedValue(Colors.lyricColor);
  const transOpacity = useSharedValue(1);
  const paddingH = useSharedValue(0);

  useEffect(() => {
    const isActive = NowIndex === Index;
    scale.value = withTiming(isActive ? 1.3 : 1, {
      easing: Easing.linear,
      duration: 400,
    });
    paddingH.value = withTiming(isActive ? fullWidth * 0.11 : 0, {
      easing: Easing.linear,
      duration: 800,
    });
    if (isActive) {
      opacity.value = withTiming(1, {
        easing: Easing.linear,
        duration: 200,
      });
      transOpacity.value = withTiming(1, {
        easing: Easing.linear,
        duration: 100,
      });
      color.value = withTiming(Colors.lyricColor, {
        easing: Easing.linear,
        duration: 100,
      });
    } else if (NowIndex === Index - 1 || NowIndex === Index + 1) {
      color.value = withTiming(Colors.lyricColor, {
        easing: Easing.linear,
        duration: 100,
      });
      opacity.value = withTiming(0.8, {
        easing: Easing.linear,
        duration: 300,
      });
      transOpacity.value = withTiming(0.8, {
        easing: Easing.linear,
        duration: 300,
      });
    } else if (NowIndex === Index - 2 || NowIndex === Index + 2) {
      color.value = withTiming(Colors.lyricColor, {
        easing: Easing.linear,
        duration: 100,
      });
      opacity.value = withTiming(0.6, {
        easing: Easing.linear,
        duration: 300,
      });
      transOpacity.value = withTiming(0.6, {
        easing: Easing.linear,
        duration: 300,
      });
    } else {
      color.value = withTiming(Colors.lyricColor, {
        easing: Easing.linear,
        duration: 100,
      });
      opacity.value = withTiming(0.3, {
        easing: Easing.linear,
        duration: 300,
      });
      transOpacity.value = withTiming(0.3, {
        easing: Easing.linear,
        duration: 300,
      });
    }
  }, [Index, NowIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
      opacity: opacity.value,
      color: color.value,
      fontWeight: NowIndex === Index ? 'bold' : 'normal',
      paddingHorizontal: paddingH.value,
    };
  });

  const transAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: color.value,
      opacity: transOpacity.value,
    };
  });

  const visibleText = _text => {
    const hiddenTexts = ['//', '本翻译作品'];
    for (let i = 0; i < hiddenTexts.length; i++) {
      if (_text.includes(hiddenTexts[i])) {
        return false;
      }
    }
    return true;
  };

  return (
    <View paddingV-12 paddingH-20>
      <View style={styles.lineContainer} width={fullWidth * 0.95}>
        <Text style={styles.fullLineText}>{fullText}</Text>
        <Animated.View
          style={[styles.highlightLineContainer, yrcAnimatedStyle]}>
          <Text style={styles.highlightedLineText}>
            {visibleChars.join('')}
          </Text>
        </Animated.View>
      </View>
      {/* <Animated.Text style={[styles.lyricText, animatedStyle]}>
        {Item.lyric}
      </Animated.Text> */}
      {/* {TransVisible && visibleText(Item.trans) ? (
        <Animated.Text style={[styles.transText, transAnimatedStyle]}>
          {Item.trans}
        </Animated.Text>
      ) : null}
      {RromaVisible && visibleText(Item.roma) ? (
        <Animated.Text style={[styles.transText, transAnimatedStyle]}>
          {Item.roma}
        </Animated.Text>
      ) : null} */}
    </View>
  );
});

const styles = StyleSheet.create({
  lyricText: {
    fontSize: 16,
    color: Colors.lyricColor,
    width: fullWidth * 0.95,
  },
  transText: {
    fontSize: 14,
    color: Colors.lyricColor,
    marginTop: 10,
  },
  container: {
    paddingVertical: 16,
  },
  lineContainer: {
    position: 'relative',
    paddingVertical: 8,
    minHeight: 36,
  },
  fullLineText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
    lineHeight: 28,
  },
  highlightLineContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    height: 28,
    overflow: 'hidden',
  },
  highlightedLineText: {
    color: '#000',
    fontSize: 18,
    lineHeight: 28,
  },
});

export default LrcItem;
