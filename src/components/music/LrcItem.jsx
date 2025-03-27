import React, {useEffect, useCallback} from 'react';
import {StyleSheet} from 'react-native';
import {View, Text, Colors} from 'react-native-ui-lib';
import {fullWidth} from '../../styles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// 预定义隐藏文本，避免每次渲染都重新创建
const HIDDEN_TEXTS = ['//', '本翻译作品'];

const LrcItem = React.memo(
  props => {
    const {
      Item = {},
      Index = 0,
      NowIndex = 0,
      Progress = 0,
      VisibleChars = [],
      FullText = '',
      YrcVisible = false,
      TransVisible = false,
      RomaVisible = false,
    } = props;

    // 共享动画值
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const color = useSharedValue(Colors.lyricColor);
    const transOpacity = useSharedValue(1);
    const paddingH = useSharedValue(0);
    const textWidth = useSharedValue(0);

    // 文本尺寸状态
    const [textDimensions, setTextDimensions] = React.useState({
      width: fullWidth * 0.84,
      height: 24,
    });

    // 处理文本布局
    const handleTextLayout = useCallback(event => {
      const {height, width} = event.nativeEvent.layout;
      setTextDimensions(prev => {
        // 只有当尺寸变化时才更新状态
        if (prev.width !== width || prev.height !== height) {
          return {width, height};
        }
        return prev;
      });
    }, []);

    // 检查文本是否可见
    const isTextVisible = useCallback(text => {
      return !HIDDEN_TEXTS.some(hidden => text.includes(hidden));
    }, []);

    // 动画样式
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{scale: scale.value}],
      opacity: opacity.value,
      color: color.value,
      paddingHorizontal: paddingH.value,
    }));

    const transAnimatedStyle = useAnimatedStyle(() => ({
      color: color.value,
      opacity: transOpacity.value,
    }));

    const yrcAnimatedStyle = useAnimatedStyle(() => ({
      paddingHorizontal: paddingH.value,
      width: textWidth.value * textDimensions.width,
    }));

    // 更新动画效果
    useEffect(() => {
      const isActive = NowIndex === Index;
      const isAdjacent = Math.abs(NowIndex - Index) === 1;
      const isNearby = Math.abs(NowIndex - Index) === 2;

      // 批量更新动画值
      if (isActive) {
        scale.value = withTiming(1.3, {duration: 200});
        paddingH.value = withTiming(fullWidth * 0.105, {duration: 400});
        textWidth.value = withTiming(Progress, {
          duration: 390,
          easing: Easing.in,
        });
        opacity.value = withTiming(1, {duration: 200});
        transOpacity.value = withTiming(1, {duration: 200});
        color.value = withTiming(Colors.lyricColor, {duration: 100});
      } else if (isAdjacent) {
        opacity.value = withTiming(0.8, {duration: 200});
        transOpacity.value = withTiming(0.8, {duration: 200});
        scale.value = withTiming(1, {duration: 200});
        paddingH.value = withTiming(0, {duration: 200});
      } else if (isNearby) {
        opacity.value = withTiming(0.6, {duration: 200});
        transOpacity.value = withTiming(0.6, {duration: 200});
        scale.value = withTiming(1, {duration: 200});
        paddingH.value = withTiming(0, {duration: 200});
      } else {
        opacity.value = withTiming(0.3, {duration: 200});
        transOpacity.value = withTiming(0.3, {duration: 200});
        scale.value = withTiming(1, {duration: 200});
        paddingH.value = withTiming(0, {duration: 200});
      }
    }, [Index, NowIndex, Progress]);

    return (
      <View paddingV-10 paddingH-20>
        {YrcVisible ? (
          <Animated.View style={[styles.lyricView, animatedStyle]}>
            <Text
              color={Colors.lyricColor}
              text70BO
              onLayout={handleTextLayout}>
              {FullText}
            </Text>
            <Animated.View style={[styles.lyricViewAbs, yrcAnimatedStyle]}>
              <View width={textDimensions.width} height={textDimensions.height}>
                <Text text70BO color={Colors.Primary}>
                  {VisibleChars}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          <Animated.Text style={animatedStyle}>
            <Text color={Colors.lyricColor} text70BO>
              {Item.lyric}
            </Text>
          </Animated.Text>
        )}

        {TransVisible && isTextVisible(Item.trans) && (
          <Animated.Text style={transAnimatedStyle}>
            <Text color={Colors.lyricColor} text80>
              {Item.trans}
            </Text>
          </Animated.Text>
        )}
        {RomaVisible && isTextVisible(Item.roma) && (
          <Animated.Text style={transAnimatedStyle}>
            <Text color={Colors.lyricColor} text80>
              {Item.roma}
            </Text>
          </Animated.Text>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，只在必要属性变化时重新渲染
    return (
      prevProps.Item === nextProps.Item &&
      prevProps.Index === nextProps.Index &&
      prevProps.NowIndex === nextProps.NowIndex &&
      prevProps.CurrentTime === nextProps.CurrentTime &&
      prevProps.Progress === nextProps.Progress &&
      prevProps.VisibleChars === nextProps.VisibleChars &&
      prevProps.FullText === nextProps.FullText &&
      prevProps.YrcVisible === nextProps.YrcVisible &&
      prevProps.TransVisible === nextProps.TransVisible &&
      prevProps.RomaVisible === nextProps.RomaVisible
    );
  },
);

const styles = StyleSheet.create({
  lyricView: {
    width: fullWidth * 0.95,
  },
  lyricViewAbs: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
});

export default LrcItem;
