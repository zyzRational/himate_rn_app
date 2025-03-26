import React, {useMemo, useCallback} from 'react';
import {StyleSheet, Modal, ImageBackground, FlatList} from 'react-native';
import {useSelector} from 'react-redux';
import {View, Text, Colors, TouchableOpacity} from 'react-native-ui-lib';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {fullHeight, statusBarHeight} from '../../styles';

const ToBePlayedModal = React.memo(props => {
  const {
    Visible = false,
    Music = {},
    OnClose = () => {},
    List = [],
    OnPressItem = () => {},
    OnPressRemove = () => {},
  } = props;

  // Redux selectors
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const userInfo = useSelector(state => state.userStore.userInfo);

  // 记忆化背景图片URI
  const backgroundImageUri = useMemo(
    () => STATIC_URL + userInfo?.user_avatar,
    [userInfo?.user_avatar],
  );

  // 记忆化当前播放的音乐信息
  const currentMusicInfo = useMemo(() => {
    if (!Music?.id) {
      return null;
    }

    return (
      <View marginL-12>
        <Text white text70BO marginT-12>
          当前播放
        </Text>
        <Text white text80BO marginB-12 flexG>
          {Music.title}
        </Text>
      </View>
    );
  }, [Music]);

  // 记忆化空列表组件
  const emptyListComponent = useMemo(
    () => (
      <View marginT-16 center>
        <Text text90L white>
          还没有要播放的音乐~
        </Text>
      </View>
    ),
    [],
  );

  // 记忆化列表底部组件
  const listFooterComponent = useMemo(() => <View marginB-140 />, []);

  // 记忆化渲染项
  const renderItem = useCallback(
    ({item}) => {
      const artistsText =
        item?.artists?.length > 0 ? item.artists.join('/') : '未知歌手';
      const albumText = item?.album ?? '未知专辑';
      const isCurrent = Music?.id === item.id;

      return (
        <View row centerV>
          <View flexG marginB-6>
            <TouchableOpacity
              onPress={() => OnPressItem(item)}
              flexS
              centerV
              style={styles.playingStyle}
              backgroundColor={isCurrent ? Colors.hyalineGrey : 'transparent'}
              padding-12>
              <View row spread centerV>
                <View width={'86%'}>
                  <Text text80BO white>
                    {item.title}
                  </Text>
                  <Text text90L white marginT-4>
                    {`${artistsText} - ${albumText}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.musicBut}
                  onPress={() => OnPressRemove(item)}>
                  <AntDesign name="close" color={Colors.white} size={20} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [Music?.id, OnPressItem, OnPressRemove],
  );

  // 记忆化keyExtractor
  const keyExtractor = useCallback((item, index) => `${item.id}_${index}`, []);

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
          source={{uri: backgroundImageUri}}
          resizeMode="cover">
          <View padding-12>
            <TouchableOpacity onPress={OnClose}>
              <AntDesign name="close" color={Colors.white} size={24} />
            </TouchableOpacity>
            {currentMusicInfo}
            <FlatList
              data={List}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={emptyListComponent}
              ListFooterComponent={listFooterComponent}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={11}
              removeClippedSubviews={true}
            />
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
});

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
