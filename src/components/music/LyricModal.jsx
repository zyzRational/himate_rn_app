import React, {useState} from 'react';
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
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fullHeight, fullWidth, statusBarHeight} from '../../styles';
import {formatMilliseconds, isEmptyString} from '../../utils/base';
import Animated, {FadeInUp, FadeOutDown} from 'react-native-reanimated';
import {getColors} from 'react-native-image-colors';
import {getWhitenessScore} from '../../utils/handle/colorHandle';
import LrcView from './LrcView';
import KeepAwake from '@sayem314/react-native-keep-awake';

const LyricModal = props => {
  const {
    Visible = false,
    Music = {},
    IsPlaying = false,
    IsFavorite = false,
    OnFavorite = () => {},
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
  const [nowLyric, setNowLyric] = useState('');

  React.useEffect(() => {
    getColors(STATIC_URL + musicMore?.music_cover, {
      fallback: '#ffffff',
      cache: false,
    }).then(res => {
      if (res.platform === 'android') {
        const num = getWhitenessScore(res.dominant);
        num > 87
          ? Colors.loadColors({lyricColor: Colors.grey10})
          : Colors.loadColors({lyricColor: Colors.white});
      }
      if (res.platform === 'ios') {
        const num = getWhitenessScore(res.background);
        num > 87
          ? Colors.loadColors({lyricColor: Colors.grey10})
          : Colors.loadColors({lyricColor: Colors.white});
      }
    });
  }, [musicMore]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={Visible}
      statusBarTranslucent
      onRequestClose={OnClose}>
      <KeepAwake />
      <View
        height={fullHeight + statusBarHeight}
        backgroundColor={Colors.hyalineGrey}>
        <ImageBackground
          blurRadius={50}
          style={styles.backImage}
          source={{
            uri: STATIC_URL + (musicMore?.music_cover || userInfo?.user_avatar),
          }}
          resizeMode="cover">
          <TouchableOpacity paddingT-48 paddingL-22 onPress={OnClose}>
            <AntDesign name="close" color={Colors.lyricColor} size={24} />
          </TouchableOpacity>
          <Carousel
            pageControlPosition={Carousel.pageControlPositions.UNDER}
            pageControlProps={{
              color: Colors.lyricColor,
              inactiveColor: Colors.hyalineWhite,
            }}
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
                    <Text text50BO color={Colors.lyricColor}>
                      {Music?.title ?? '还没有要播放的音乐 ~'}
                    </Text>
                    <Text marginT-6 color={Colors.lyricColor} text70>
                      {Music?.artists?.join(' / ') || '未知歌手'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.musicBut}
                    onPress={() => {
                      OnFavorite(Music.id, IsFavorite);
                    }}>
                    {IsFavorite ? (
                      <AntDesign name="heart" color={Colors.lyricColor} size={22} />
                    ) : (
                      <AntDesign
                        name="hearto"
                        color={Colors.lyricColor}
                        size={22}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                {isEmptyString(nowLyric) ? null : (
                  <Animated.View
                    entering={FadeInUp}
                    exiting={FadeOutDown}
                    key={nowLyric}>
                    <Text
                      numberOfLines={1}
                      width={fullWidth * 0.8}
                      color={Colors.lyricColor}>
                      {nowLyric}
                    </Text>
                  </Animated.View>
                )}
                {Music?.sampleRate ? (
                  <View marginT-12 row centerV spread>
                    <Text color={Colors.lyricColor} text100L>
                      采样率：{Music.sampleRate} Hz
                    </Text>
                    <Text color={Colors.lyricColor} text100L>
                      比特率：{Music.bitrate} Hz
                    </Text>
                  </View>
                ) : null}
                <View marginT-16>
                  <Slider
                    value={PlayProgress?.currentPosition ?? 0}
                    minimumValue={0}
                    maximumValue={PlayProgress?.duration ?? 100}
                    maximumTrackTintColor={Colors.lyricColor}
                    thumbTintColor={Colors.Primary}
                    thumbStyle={styles.thumbStyle}
                    trackStyle={styles.trackStyle}
                    disableActiveStyling={true}
                    minimumTrackTintColor={Colors.Primary}
                    onValueChange={OnSliderChange}
                  />
                  <View row centerV spread>
                    <Text text90L color={Colors.lyricColor}>
                      {formatMilliseconds(PlayProgress?.currentPosition ?? 0)}
                    </Text>
                    <Text text90L color={Colors.lyricColor}>
                      {formatMilliseconds(PlayProgress?.duration ?? 0)}
                    </Text>
                  </View>
                </View>
                <View row centerV spread marginT-16>
                  <TouchableOpacity
                    style={styles.musicBut}
                    onPress={OnChangeMode}>
                    {PlayMode === 'order' ? (
                      <Ionicons
                        name="repeat"
                        color={Colors.lyricColor}
                        size={30}
                      />
                    ) : PlayMode === 'random' ? (
                      <Ionicons
                        name="shuffle"
                        color={Colors.lyricColor}
                        size={30}
                      />
                    ) : PlayMode === 'single' ? (
                      <Ionicons
                        name="reload"
                        color={Colors.lyricColor}
                        size={24}
                      />
                    ) : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.musicBut}
                    onPress={OnBackWard}>
                    <Ionicons
                      name="play-skip-back-sharp"
                      color={Colors.lyricColor}
                      size={24}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={OnPlay}>
                    {IsPlaying ? (
                      <Ionicons
                        name="pause-circle-outline"
                        color={Colors.lyricColor}
                        size={64}
                      />
                    ) : (
                      <Ionicons
                        name="play-circle-outline"
                        color={Colors.lyricColor}
                        size={64}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.musicBut} onPress={OnForWard}>
                    <Ionicons
                      name="play-skip-forward-sharp"
                      color={Colors.lyricColor}
                      size={24}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.musicBut} onPress={OnMain}>
                    <AntDesign
                      name="menu-fold"
                      color={Colors.lyricColor}
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View>
              <LrcView
                Music={musicMore}
                Cover={
                  STATIC_URL + (musicMore?.music_cover || userInfo?.user_avatar)
                }
                CurrentTime={PlayProgress?.currentPosition}
                OnLyricsChange={setNowLyric}
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
    borderRadius: 20,
    borderColor: Colors.lyricColor,
    borderWidth: 1,
  },
  trackStyle: {
    height: 3,
  },
  thumbStyle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});

export default LyricModal;
