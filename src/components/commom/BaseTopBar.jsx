import * as React from 'react';
import {StyleSheet} from 'react-native';
import {View, TouchableOpacity, Text, Colors} from 'react-native-ui-lib';
import {fullWidth, fullHeight} from '../../styles';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';

const BaseTopBar = props => {
  const {
    Routes = [],
    FocusIndex = 0,
    OnChangeIndex = () => {},
    HeightScale = 0.84,
  } = props;

  return (
    <View width={fullWidth} height={fullHeight * HeightScale}>
      <View row spread backgroundColor="white" style={styles.topStyle}>
        {Routes.map((item, index) => {
          return (
            <View key={item.key}>
              <TouchableOpacity
                style={[styles.barStyle]}
                onPress={() => OnChangeIndex(index)}>
                <Text
                  color={index === FocusIndex ? Colors.Primary : Colors.grey30}>
                  {item.title}
                </Text>
              </TouchableOpacity>
              {index === FocusIndex ? (
                <Animated.View
                  entering={FadeIn}
                  exiting={FadeOut}
                  height={2}
                  backgroundColor={Colors.Primary}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View>{Routes[FocusIndex].screen}</View>
    </View>
  );
};
const styles = StyleSheet.create({
  topStyle: {
    borderBottomWidth: 0.8,
    borderBottomColor: Colors.grey70,
  },
  barStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
});
export default BaseTopBar;
