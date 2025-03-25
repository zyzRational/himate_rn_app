import React, {useEffect, useMemo, useCallback} from 'react';
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
    YrcVisible = false,
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
      duration: 600,
    });
    paddingH.value = withTiming(isActive ? fullWidth * 0.11 : 0, {
      easing: Easing.linear,
      duration: 300,
    });
    if (isActive) {
      opacity.value = withTiming(1, {
        easing: Easing.linear,
        duration: 200,
      });
      transOpacity.value = withTiming(1, {
        easing: Easing.linear,
        duration: 200,
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

  // 实际文本布局回调
  const [absTextWidth, setAbsTextWidth] = React.useState(0);
  const [textHeight, setTextHeight] = React.useState(24);

  const textDimensions = React.useMemo(
    () => ({
      width: absTextWidth,
      height: textHeight,
    }),
    [absTextWidth, textHeight],
  );

  const handleTextLayout = React.useCallback(
    event => {
      const {height, width} = event.nativeEvent.layout;
      if (width !== absTextWidth) {
        setAbsTextWidth(width);
      }
      if (height !== textHeight) {
        setTextHeight(height);
      }
    },
    [absTextWidth, textHeight],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
      opacity: opacity.value,
      color: color.value,
      paddingHorizontal: paddingH.value,
    };
  });

  const transAnimatedStyle = useAnimatedStyle(() => {
    return {
      color: color.value,
      opacity: transOpacity.value,
    };
  });

  // 动画值
  const textWidth = useSharedValue(0);

  // 计算进度 (0-1)
  const progress = useMemo(() => {
    if (NowIndex !== Index) {
      return [];
    }
    const lineTime = CurrentTime - Item.startTime;
    const _progress = Math.min(Math.max(lineTime / Item.duration, 0), 1);
    return _progress;
  }, [CurrentTime, NowIndex, Item.startTime, Item.duration]);

  // 动画样式
  const yrcAnimatedStyle = useAnimatedStyle(() => ({
    width: textWidth.value * textDimensions?.width,
    paddingHorizontal: paddingH.value,
  }));

  useEffect(() => {
    if (typeof progress === 'number') {
      textWidth.value = withTiming(progress, {
        duration: 1000,
        easing: Easing.linear,
      });
    }
  }, [progress]);

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
    <View paddingV-10 paddingH-20>
      {YrcVisible ? (
        <Animated.View style={[styles.lyricView, animatedStyle]}>
          <Text color={Colors.lyricColor} text70BO onLayout={handleTextLayout}>
            {fullText}
          </Text>
          <Animated.View style={[styles.lyricViewAbs, yrcAnimatedStyle]}>
            <Text
              text70BO
              color={Colors.Primary}
              style={{
                width: textDimensions?.width,
                height: textDimensions?.height,
              }}>
              {visibleChars.join('')}
            </Text>
          </Animated.View>
        </Animated.View>
      ) : (
        <Animated.Text style={animatedStyle}>
          <Text color={Colors.lyricColor} text70BO>
            {Item.lyric}
          </Text>
        </Animated.Text>
      )}
      {TransVisible && visibleText(Item.trans) ? (
        <Animated.Text style={transAnimatedStyle}>
          <Text color={Colors.lyricColor} text80>
            {Item.trans}
          </Text>
        </Animated.Text>
      ) : null}
      {RromaVisible && visibleText(Item.roma) ? (
        <Animated.Text style={transAnimatedStyle}>
          <Text color={Colors.lyricColor} text80>
            {Item.roma}
          </Text>
        </Animated.Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  lyricView: {
    width: fullWidth * 0.95,
  },
  lyricViewAbs: {
    width: fullWidth * 0.95,
    position: 'absolute',
    top: 0,
    left: 0,
    height: 24,
  },
});

export default LrcItem;
