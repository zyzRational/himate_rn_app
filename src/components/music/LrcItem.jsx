import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View, Colors } from 'react-native-ui-lib';
import { fullWidth } from '../../styles';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';

const LrcItem = props => {
    const {
        Item = {},
        Index = 0,
        NowIndex = 0,
        TransVisible = false,
        RromaVisible = false,
    } = props;

    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const color = useSharedValue(Colors.white);
    const transOpacity = useSharedValue(1);
    const paddingH = useSharedValue(0);

    useEffect(() => {
        const isActive = NowIndex === Index;
        scale.value = withTiming(isActive ? 1.3 : 1, {
            easing: Easing.linear,
            duration: 400,
        });
        paddingH.value = withTiming(isActive ? fullWidth * 0.1 : 0, {
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
            color.value = withTiming(Colors.white, {
                easing: Easing.linear,
                duration: 100,
            });
        } else if (NowIndex === Index - 1 || NowIndex === Index + 1) {
            color.value = withTiming(Colors.white, {
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
            color.value = withTiming(Colors.white, {
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
            color.value = withTiming(Colors.white, {
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
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
            color: color.value,
            fontWeight: NowIndex === Index ? 'bold' : 'normal',
            paddingHorizontal: paddingH.value,
        };
    });

    const transAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: transOpacity.value,
        };
    });

    const visibleText = (_text) => {
        const hiddenTexts = ['//', '本翻译作品'];
        for (let i = 0; i < hiddenTexts.length; i++) {
            if (_text.includes(hiddenTexts[i])) {
                return false;
            }
        }
        return true;
    };

    return (
        <View paddingV-12 paddingH-20 >
            <Animated.Text style={[styles.lyricText, animatedStyle]}>
                {Item.lyric}
            </Animated.Text>
            {TransVisible && visibleText(Item.trans) ? (
                <Animated.Text style={[styles.transText, transAnimatedStyle]}>
                    {Item.trans}
                </Animated.Text>
            ) : null}
            {RromaVisible && visibleText(Item.roma) ? (
                <Animated.Text style={[styles.transText, transAnimatedStyle]}>
                    {Item.roma}
                </Animated.Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    lyricText: {
        fontSize: 16,
        color: Colors.white,
        width: fullWidth * 0.95,
    },
    transText: {
        fontSize: 14,
        color: Colors.white,
        marginTop: 10,
    },
});

export default LrcItem;
