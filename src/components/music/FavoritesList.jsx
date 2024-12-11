import React from 'react';
import {StyleSheet} from 'react-native';
import {
  View,
  Text,
  Colors,
  Avatar,
  TouchableOpacity,
  GridList,
  Card,
  Image,
} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import {fullHeight, fullWidth} from '../../styles';

const FavoritesList = props => {
  const {
    List = [],
    OnEndReached = () => {},
    OnPress = () => {},
  } = props;
  // baseConfig
  const {STATIC_URL, THUMBNAIL_URL} = useSelector(
    state => state.baseConfigStore.baseConfig,
  );

  return (
    <View height={fullHeight * 0.9}>
      <GridList
        data={List}
        numColumns={2}
        containerWidth={fullWidth - 24}
        keyExtractor={(item, index) => item + index}
        onEndReached={() => {
          OnEndReached();
        }}
        renderItem={({item}) => (
          <Card flexS centerV enableShadow={true} padding-12>
            <TouchableOpacity
              onPress={() => {
                OnPress(item);
              }}>
              <View row>
                <Image
                  source={{uri: THUMBNAIL_URL + item.favorites_cover}}
                  style={styles.image}
                />
                <View row bottom>
                  <Text text30BO grey50 marginL-4>
                    {item.musicCount}
                  </Text>
                  <Text text100BO grey50 marginL-4 marginB-10>
                    首
                  </Text>
                </View>
              </View>
              <View marginT-6>
                <Text text80BO numberOfLines={1} grey10>
                  {item.favorites_name}
                </Text>
              </View>
              <View marginT-6 row bottom spread>
                <View row centerV>
                  <Text text90BO grey10>
                    来自
                  </Text>
                  <Text text90L grey30 style={styles.userName}>
                    {item.creator_name}
                  </Text>
                  <View marginL-6>
                    <Avatar
                      size={26}
                      source={{
                        uri: STATIC_URL + item.creator_avatar,
                      }}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={
          <View marginT-16 center>
            <Text text90L grey40>
              还没有发现歌单{' T_T'}
            </Text>
          </View>
        }
        ListFooterComponent={
          List.length > 8 ? (
            <View marginB-80 padding-12 center>
              <Text text90L grey40>
                已经到底啦 ~
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
const styles = StyleSheet.create({
  image: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderColor: Colors.white,
    borderWidth: 1,
  },
  userName: {
    maxWidth: 90,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});
export default FavoritesList;
