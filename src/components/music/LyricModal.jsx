import React from 'react';
import {StyleSheet, Modal, ImageBackground} from 'react-native';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  Colors,
  Image,
  TouchableOpacity,
  Slider,
  Carousel,
} from 'react-native-ui-lib';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {fullHeight, fullWidth, statusBarHeight} from '../../styles';
import {formatMilliseconds} from '../../utils/base';
import LrcView from './LrcView';

const LyricModal = props => {
  const {
    Visible = false,
    Music = {},
    IsPlaying = false,
    PlayMode = 'order',
    OnClose = () => {},
    PlayProgress = {},
    OnSliderChange = () => {},
    OnChangeMode = () => {},
    OnBackWard = () => {},
    OnPlay = () => {},
    OnForWard = () => {},
    OnMain = () => {},
  } = props;

  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const userInfo = useSelector(state => state.userStore.userInfo);

  const {musicMore} = Music || {};

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={Visible}
      statusBarTranslucent
      onRequestClose={OnClose}>
      <View
        height={fullHeight + statusBarHeight}
        backgroundColor={Colors.hyalineGrey}>
        <ImageBackground
          blurRadius={40}
          style={styles.backImage}
          source={{
            uri: STATIC_URL + (musicMore?.music_cover || userInfo?.user_avatar),
          }}
          resizeMode="cover">
          <TouchableOpacity paddingT-48 paddingL-16 onPress={OnClose}>
            <AntDesign name="close" color={Colors.white} size={24} />
          </TouchableOpacity>
          <Carousel
            // onChangePage={onChangePage}
            pageWidth={fullWidth}
            itemSpacings={0}
            containerMarginHorizontal={0}
            initialPage={0}>
            <View>
              <View flexS center marginT-40>
                <Image
                  source={{
                    uri:
                      STATIC_URL +
                      (musicMore?.music_cover || 'default_music_cover.jpg'),
                  }}
                  style={styles.bigImage}
                />
              </View>
              <View padding-26>
                <View row centerV spread marginT-12>
                  <View flexS>
                    <Text text50BO white>
                      {Music?.title ?? '还没有要播放的音乐 ~'}
                    </Text>
                    <Text marginT-8 white text70>
                      {Music?.artists?.join(' / ') || '未知歌手'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.musicBut}>
                    <AntDesign name="hearto" color={Colors.white} size={20} />
                  </TouchableOpacity>
                </View>
                {Music?.sampleRate ? (
                  <View marginT-24 row centerV spread>
                    <Text white text100L>
                      采样率：{Music.sampleRate} Hz
                    </Text>
                    <Text white text100L>
                      比特率：{Music.bitrate} Hz
                    </Text>
                  </View>
                ) : null}
                <View marginT-16>
                  <Slider
                    value={PlayProgress?.currentPosition ?? 0}
                    minimumValue={0}
                    maximumValue={PlayProgress?.duration ?? 100}
                    maximumTrackTintColor={Colors.white}
                    thumbTintColor={Colors.Primary}
                    minimumTrackTintColor={Colors.Primary}
                    onValueChange={OnSliderChange}
                  />
                  <View row centerV spread marginT-4>
                    <Text text90L white>
                      {formatMilliseconds(PlayProgress?.currentPosition ?? 0)}
                    </Text>
                    <Text text90L white>
                      {formatMilliseconds(PlayProgress?.duration ?? 0)}
                    </Text>
                  </View>
                </View>
                <View row centerV spread marginT-16 paddingH-16>
                  <TouchableOpacity
                    style={styles.musicBut}
                    onPress={OnChangeMode}>
                    {PlayMode === 'order' ? (
                      <FontAwesome
                        name="long-arrow-right"
                        color={Colors.white}
                        size={20}
                      />
                    ) : PlayMode === 'random' ? (
                      <FontAwesome
                        name="refresh"
                        color={Colors.white}
                        size={20}
                      />
                    ) : PlayMode === 'single' ? (
                      <FontAwesome
                        name="repeat"
                        color={Colors.white}
                        size={20}
                      />
                    ) : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.musicBut}
                    onPress={OnBackWard}>
                    <FontAwesome
                      name="step-backward"
                      color={Colors.white}
                      size={24}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={OnPlay}>
                    {IsPlaying ? (
                      <FontAwesome
                        name="pause-circle"
                        color={Colors.white}
                        size={60}
                      />
                    ) : (
                      <FontAwesome
                        name="play-circle"
                        color={Colors.white}
                        size={60}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.musicBut} onPress={OnForWard}>
                    <FontAwesome
                      name="step-forward"
                      color={Colors.white}
                      size={24}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.musicBut} onPress={OnMain}>
                    <FontAwesome name="bars" color={Colors.white} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View>
              <LrcView
                Music={musicMore}
                CurrentTime={PlayProgress?.currentPosition}
              />
            </View>
          </Carousel>
        </ImageBackground>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  musicBut: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backImage: {
    backgroundColor: Colors.black,
    width: '100%',
    height: fullHeight + statusBarHeight,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    elevation: 2,
  },
  bigImage: {
    width: fullWidth * 0.86,
    height: fullWidth * 0.86,
    borderRadius: 40,
    borderColor: Colors.white,
    borderWidth: 1,
  },
});

export default LyricModal;
