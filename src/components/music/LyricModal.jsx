import React, {useState, useEffect, useCallback, useMemo} from 'react';
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

const LyricModal = React.memo(props => {
  const {
    Visible = false,
    Music = {},
    IsPlaying = false,
    IsFavorite = false,
    OnFavorite = () => {},
    PlayMode = 'order',
    OnClose = () => {},
    CurPosition = 0,
    Duration = 0,
    OnSliderChange = () => {},
    OnChangeMode = () => {},
    OnBackWard = () => {},
    OnPlay = () => {},
    OnForWard = () => {},
    OnMain = () => {},
  } = props;

  // Redux selectors
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const userInfo = useSelector(state => state.userStore.userInfo);

  const {musicMore = {}} = Music || {};
  const [nowLyric, setNowLyric] = useState('');

  // 颜色计算 - 只在相关依赖变化时执行
  useEffect(() => {
    if (!musicMore?.music_cover) {
      return;
    }

    getColors(STATIC_URL + musicMore.music_cover, {
      fallback: '#ffffff',
      cache: true, // 启用缓存
    }).then(res => {
      const platform = res.platform;
      const colorValue = platform === 'android' ? res.average : res.background;
      const num = getWhitenessScore(colorValue);
      Colors.loadColors({
        lyricColor: num > 76 ? Colors.grey10 : Colors.white,
      });
    });
  }, [musicMore?.music_cover]);

  // 记忆化回调函数
  const handleFavorite = useCallback(() => {
    OnFavorite(Music.id, IsFavorite);
  }, [OnFavorite, Music.id, IsFavorite]);

  // 艺术家字符串
  const artistsString = useMemo(
    () => Music?.artists?.join(' / ') || '未知歌手',
    [Music?.artists],
  );

  // 当前时间和总时长格式化
  const currentTimeFormatted = useMemo(
    () => formatMilliseconds(CurPosition),
    [CurPosition],
  );

  const durationFormatted = useMemo(
    () => formatMilliseconds(Duration),
    [Duration],
  );

  // 歌词动画组件
  const lyricAnimation = useMemo(() => {
    if (isEmptyString(nowLyric)) {
      return null;
    }

    return (
      <Animated.View entering={FadeInUp} exiting={FadeOutDown} key={nowLyric}>
        <Text
          numberOfLines={1}
          width={fullWidth * 0.8}
          color={Colors.lyricColor}>
          {nowLyric}
        </Text>
      </Animated.View>
    );
  }, [nowLyric]);

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
            {/* 第一页：音乐信息 */}
            <View>
              <View flexS center marginT-40>
                <Image
                  source={{
                    uri:
                      STATIC_URL +
                      (musicMore?.music_cover || 'default_music_cover.jpg'),
                  }}
                  style={[styles.bigImage, {borderColor: Colors.lyricColor}]}
                />
              </View>

              <View padding-26>
                <View row centerV spread marginT-12>
                  <View flexS>
                    <Text text50BO color={Colors.lyricColor}>
                      {Music?.title ?? '还没有要播放的音乐 ~'}
                    </Text>
                    <Text marginT-6 color={Colors.lyricColor} text70>
                      {artistsString}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.musicBut}
                    onPress={handleFavorite}>
                    <AntDesign
                      name={IsFavorite ? 'heart' : 'hearto'}
                      color={Colors.lyricColor}
                      size={22}
                    />
                  </TouchableOpacity>
                </View>
                {lyricAnimation}
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
                    value={CurPosition}
                    minimumValue={0}
                    disabled={!Duration}
                    maximumValue={Duration || 100}
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
                      {currentTimeFormatted}
                    </Text>
                    <Text text90L color={Colors.lyricColor}>
                      {durationFormatted}
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
                    <Ionicons
                      name={
                        IsPlaying
                          ? 'pause-circle-outline'
                          : 'play-circle-outline'
                      }
                      color={Colors.lyricColor}
                      size={64}
                    />
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

            {/* 第二页：歌词视图 */}
            <View>
              <LrcView
                Music={musicMore}
                Cover={
                  STATIC_URL +
                  (musicMore?.music_cover || 'default_music_cover.jpg')
                }
                CurrentTime={CurPosition}
                OnLyricsChange={setNowLyric}
              />
            </View>
          </Carousel>
        </ImageBackground>
      </View>
    </Modal>
  );
});

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
