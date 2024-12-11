import * as React from 'react';
import {StyleSheet} from 'react-native';
import {TouchableOpacity, Colors, View, Badge, Text} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const ListItem = props => {
  const {
    Fun = () => {},
    IconName,
    IconColor,
    IconSize,
    ItemName,
    IsBottomLine,
    IsBadge,
    BadgeCount,
    RightText,
    RightView = null,
  } = props;

  return (
    <>
      <TouchableOpacity
        flexG
        spread
        row
        centerV
        paddingH-16
        paddingV-12
        onPress={() => Fun()}>
        <View flexS centerV row>
          <View width={22} center>
            <FontAwesome
              name={IconName}
              color={IconColor}
              size={IconSize ? IconSize : 22}
            />
          </View>
          <Text text70 marginL-8>
            {ItemName}
          </Text>
        </View>
        {RightView ? (
          RightView
        ) : (
          <View flexS row spread centerV>
            {IsBadge && BadgeCount > 0 ? (
              <View marginR-12>
                <Badge
                  label={BadgeCount}
                  backgroundColor={Colors.error}
                  size={16}
                />
              </View>
            ) : null}
            {RightText ? (
              <Text
                marginR-12
                numberOfLines={1}
                style={{maxWidth: 160}}
                text80
                grey40>
                {RightText}
              </Text>
            ) : null}
            <FontAwesome name="angle-right" color={Colors.grey50} size={26} />
          </View>
        )}
      </TouchableOpacity>
      <View style={IsBottomLine ? styles.boxBottomline : null}></View>
    </>
  );
};
const styles = StyleSheet.create({
  boxBottomline: {
    borderBottomColor: Colors.grey80,
    borderBottomWidth: 1,
    width: '82%',
    position: 'absolute',
    right: 18,
  },
});
export default ListItem;
