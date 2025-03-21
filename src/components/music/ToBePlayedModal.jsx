import * as React from 'react';
import {StyleSheet, Modal, ImageBackground, FlatList} from 'react-native';
import {useSelector} from 'react-redux';
import {View, Text, Colors, TouchableOpacity} from 'react-native-ui-lib';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {fullHeight, statusBarHeight} from '../../styles';

const ToBePlayedModal = props => {
  const {
    Visible = false,
    Music = {},
    OnClose = () => {},
    List = [],
    OnPressItem = () => {},
    OnPressRemove = () => {},
  } = props;

  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const userInfo = useSelector(state => state.userStore.userInfo);

  const {musicMore} = Music || {};
  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent={true}
      visible={Visible}
      onRequestClose={OnClose}>
      <View
        height={fullHeight + statusBarHeight}
        backgroundColor={Colors.hyalineGrey}>
        <ImageBackground
          blurRadius={40}
          style={styles.listBackImage}
          source={{
            uri: STATIC_URL + userInfo?.user_avatar,
          }}
          resizeMode="cover">
          <View padding-12>
            <TouchableOpacity onPress={OnClose}>
              <AntDesign name="close" color={Colors.white} size={24} />
            </TouchableOpacity>
            {Music?.id ? (
              <View marginL-12>
                <Text white text70BO marginT-12>
                  当前播放
                </Text>
                <Text white text80BO marginB-12 flexG>
                  {Music.title}
                </Text>
              </View>
            ) : null}
            <FlatList
              data={List}
              keyExtractor={(item, index) => item + index}
              renderItem={({item}) => (
                <View row centerV>
                  <View flexG marginB-6>
                    <TouchableOpacity
                      onPress={() => {
                        OnPressItem(item);
                      }}
                      flexS
                      centerV
                      style={styles.playingStyle}
                      backgroundColor={
                        Music?.id === item.id
                          ? Colors.hyalineGrey
                          : 'transparent'
                      }
                      padding-12>
                      <View row spread centerV>
                        <View width={'86%'}>
                          <Text text80BO white>
                            {item.title}
                          </Text>
                          <Text text90L white marginT-4>
                            {(item?.artists && item.artists?.length > 0
                              ? item.artists.join('/')
                              : '未知歌手') +
                              ' - ' +
                              (item?.album ?? '未知专辑')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.musicBut}
                          onPress={() => {
                            OnPressRemove(item);
                          }}>
                          <AntDesign
                            name="close"
                            color={Colors.white}
                            size={20}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View marginT-16 center>
                  <Text text90L white>
                    还没有要播放的音乐~
                  </Text>
                </View>
              }
              ListFooterComponent={<View marginB-140 />}
            />
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  playingStyle: {
    borderRadius: 12,
  },
  listBackImage: {
    width: '100%',
    height: fullHeight * 0.8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    elevation: 2,
  },
  musicBut: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ToBePlayedModal;
