import * as React from 'react';
import {StyleSheet, ImageBackground, Modal, FlatList} from 'react-native';
import {
  Image,
  View,
  Text,
  Colors,
  TouchableOpacity,
  Slider,
} from 'react-native-ui-lib';
import {useSelector, useDispatch} from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {fullHeight, statusBarHeight} from '../../styles';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import MarqueeText from 'react-native-marquee';
import {
  formatMilliseconds,
  isEmptyObject,
  deepClone,
  getRandomInt,
} from '../../utils/base';
import {
  setPlayingMusic,
  removePlayList,
  setIsClosed,
  addPlayList,
} from '../../stores/store-slice/musicStore';
import {useToast} from '../commom/Toast';
import {useRealm} from '@realm/react';
import MusicControl, {Command} from 'react-native-music-control';
import {getMusicList} from '../../api/music';

export const MusicCtrlContext = React.createContext();
export const useMusicCtrl = () => React.useContext(MusicCtrlContext);
const audioPlayer = new AudioRecorderPlayer();

const MusicCtrlProvider = props => {
  const {children} = props;
  const {showToast} = useToast();
  const realm = useRealm();
  const dispatch = useDispatch();
  const userInfo = useSelector(state => state.userStore.userInfo);
  // baseConfig
  const {STATIC_URL} = useSelector(state => state.baseConfigStore.baseConfig);
  const showMusicCtrl = useSelector(state => state.musicStore.showMusicCtrl);
  const playList = useSelector(state => state.musicStore.playList);
  const playingMusic = useSelector(state => state.musicStore.playingMusic);
  const closeTime = useSelector(state => state.musicStore.closeTime);
  const randomNum = useSelector(state => state.musicStore.randomNum);
  const isRandomPlay = useSelector(state => state.musicStore.isRandomPlay);

  const [musicModalVisible, setMusicModalVisible] = React.useState(false);
  const [listModalVisible, setListModalVisible] = React.useState(false);
  const [audioIsPlaying, setAudioIsPlaying] = React.useState(false); // 音频是否正在播放
  const [audioPlayprogress, setAudioPlayprogress] = React.useState({}); // 音频播放进度
  const [prevPlayingMusic, setPrevPlayingMusic] = React.useState({}); // 记录上一次播放的音乐
  const [playingIndex, setPlayingIndex] = React.useState(0); // 当前播放音乐的索引
  const [progressNum, setProgressNum] = React.useState(0); // 进度条数值
  const [playType, setPlayType] = React.useState('order'); // 列表播放类型 single order random

  audioPlayer.addPlayBackListener(playbackMeta => {
    // console.log(value);
    MusicControl.updatePlayback({
      elapsedTime: Math.round(playbackMeta.currentPosition / 1000),
    });
    setAudioPlayprogress(playbackMeta);
    const num = Math.round(
      (playbackMeta.currentPosition / playbackMeta.duration) * 100,
    );
    if (num) {
      setProgressNum(num);
    }
    if (playbackMeta.isFinished) {
      restMusicStatus().then(() => {
        if (isRandomPlay) {
          getRandMusic();
        } else if (playList.length > 0) {
          if (playType === 'single') {
            dispatch(setPlayingMusic(playList[playingIndex]));
          }
          if (playType === 'order') {
            if (playingIndex === playList.length - 1) {
              dispatch(setPlayingMusic(playList[0]));
              return;
            }
            dispatch(setPlayingMusic(playList[playingIndex + 1]));
          }
          if (playType === 'random') {
            dispatch(
              setPlayingMusic(
                playList[Math.floor(Math.random() * playList.length)],
              ),
            );
          }
        } else {
          dispatch(setPlayingMusic({}));
        }
      });
    }
  });

  /* 上一曲 */
  const previousRemote = () => {
    if (playingIndex === 0) {
      dispatch(setPlayingMusic(playList[playList.length - 1]));
      showToast('已经是第一首了~', 'warning');
      return;
    }
    if (playList.length > 0) {
      dispatch(setPlayingMusic(playList[playingIndex - 1]));
    } else {
      showToast('没有要播放的音乐~', 'warning');
    }
  };

  /* 暂停/播放 */
  const playOrPauseRemote = () => {
    if (audioIsPlaying) {
      audioPlayer.pausePlayer();
      setAudioIsPlaying(false);
      MusicControl.updatePlayback({
        state: MusicControl.STATE_PAUSED,
      });
    } else {
      if (isEmptyObject(playingMusic)) {
        showToast('没有要播放的音乐~', 'warning');
        return;
      }
      audioPlayer.resumePlayer();
      setAudioIsPlaying(true);
      MusicControl.updatePlayback({
        state: MusicControl.STATE_PLAYING,
      });
    }
  };

  /* 下一曲 */
  const nextRemote = () => {
    if (playingIndex === playList.length - 1) {
      dispatch(setPlayingMusic(playList[0]));
      showToast('已经是最后一首了~', 'warning');
      return;
    }
    if (playList.length > 0) {
      dispatch(setPlayingMusic(playList[playingIndex + 1]));
    } else {
      showToast('没有要播放的音乐~', 'warning');
    }
  };

  // 重置音乐播放所有状态
  const restMusicStatus = async () => {
    MusicControl.stopControl();
    setAudioPlayprogress({});
    setProgressNum(0);
    setAudioIsPlaying(false);
    try {
      const stopResult = await audioPlayer.stopPlayer();
      return stopResult;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /* 写入本地播放记录 */
  const addOrUpdateLocalMusic = music => {
    if (typeof music?.id === 'string') {
      return;
    }
    const localMusic = deepClone(music);
    for (const key in localMusic) {
      if (localMusic[key] === null) {
        delete localMusic[key];
      }
    }
    const musicList = realm
      .objects('MusicInfo')
      .filtered('id == $0', localMusic.id);
    if (musicList.length > 0) {
      realm.write(() => {
        for (const ele of musicList) {
          ele.updateAt = Date.now().toString();
        }
      });
    } else {
      localMusic.createdAt = Date.now().toString();
      localMusic.updateAt = Date.now().toString();
      realm.write(() => {
        realm.create('MusicInfo', localMusic);
      });
    }
  };

  /* 开启通知栏控件 */
  const startNotification = musicInfo => {
    const {title, artist, album, duration} = musicInfo;
    MusicControl.enableControl('play', true);
    MusicControl.enableControl('pause', true);
    MusicControl.enableControl('stop', false);
    MusicControl.enableControl('nextTrack', true);
    MusicControl.enableControl('previousTrack', true);
    MusicControl.enableControl('seek', true);
    MusicControl.enableControl('closeNotification', true, {when: 'never'});
    MusicControl.enableBackgroundMode(true);
    MusicControl.handleAudioInterruptions(true);
    MusicControl.setNowPlaying({
      title: title,
      artwork: STATIC_URL + userInfo?.user_avatar, // URL or RN's image require()
      artist: artist,
      album: album,
      duration: duration, // (Seconds)
      color: 0x0000ff, // Android Only - Notification Color
      //colorized: true, // Android 8+ Only - Notification Color extracted from the artwork. Set to false to use the color property instead
      date: Date.now().toString(), // , // Release Date (RFC 3339) - Android Only
      isLiveStream: true, // iOS Only (Boolean), Show or hide Live Indicator instead of seekbar on lock screen for live streams. Default value is false.
    });
    MusicControl.updatePlayback({
      state: MusicControl.STATE_PLAYING,
      speed: 1, // Playback Rate
    });
  };

  /* 控件操作 */
  MusicControl.on(Command.pause, () => {
    playOrPauseRemote();
  });

  MusicControl.on(Command.play, () => {
    playOrPauseRemote();
  });

  MusicControl.on(Command.nextTrack, () => {
    nextRemote();
  });

  MusicControl.on(Command.previousTrack, () => {
    previousRemote();
  });

  MusicControl.on(Command.seek, pos => {
    audioPlayer?.seekToPlayer(pos * 1000);
  });

  // 是否处于音乐中
  React.useEffect(() => {
    if (!showMusicCtrl) {
      audioPlayer.removeRecordBackListener();
    }
  }, [showMusicCtrl]);

  // 是否要定时关闭音乐
  let timer = null;
  React.useEffect(() => {
    if (closeTime) {
      timer = setTimeout(() => {
        audioPlayer.pausePlayer();
        setAudioIsPlaying(false);
        MusicControl.updatePlayback({
          state: MusicControl.STATE_PAUSED,
        });
        dispatch(setIsClosed(true));

        clearTimeout(timer);
      }, closeTime * 60000);
    } else {
      clearTimeout(timer);
    }
  }, [closeTime]);

  // 获取随机歌曲
  const getRandMusic = async () => {
    const index = getRandomInt(randomNum.min, randomNum.max);
    try {
      const res = await getMusicList({pageNum: index, pageSize: 1});
      if (res.success) {
        if (res.data.list.length > 0) {
          const music = res.data.list[0];
          dispatch(setPlayingMusic(music));
          dispatch(addPlayList([music]));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 随机播放
  React.useEffect(() => {
    if (isRandomPlay && playList.length === 0) {
      getRandMusic();
    }
  }, [isRandomPlay]);

  // 是否播放新的音乐
  React.useEffect(() => {
    if (
      prevPlayingMusic?.id !== playingMusic?.id ||
      playType === 'single' ||
      !audioIsPlaying
    ) {
      restMusicStatus().then(() => {
        if (playingMusic?.file_name) {
          let url = '';
          if (typeof playingMusic?.id === 'number') {
            url = STATIC_URL + playingMusic?.file_name;
          } else {
            url = playingMusic?.file_name;
          }
          // console.log('开始播放音乐', playingMusic);
          audioPlayer
            .startPlayer(url)
            .then(() => {
              setAudioIsPlaying(true);
              const index = playList.findIndex(
                item => item.id === playingMusic.id,
              );
              setPlayingIndex(index);
              setPrevPlayingMusic(playingMusic);
              startNotification(playingMusic);
              if (realm) {
                addOrUpdateLocalMusic(playingMusic);
              }
            })
            .catch(error => {
              console.log(error);
              showToast('无法播放的音乐！', 'error');
            });
        }
      });
    }
  }, [playingMusic, realm]);

  return (
    <MusicCtrlContext.Provider value={{}}>
      {children}
      {showMusicCtrl ? (
        <View style={styles.CtrlContainer}>
          <ImageBackground
            blurRadius={40}
            style={styles.ctrlBackImage}
            source={{uri: STATIC_URL + userInfo?.user_avatar}}
            resizeMode="cover">
            <View row centerV spread>
              <TouchableOpacity
                row
                centerV
                onPress={() => {
                  setMusicModalVisible(true);
                }}>
                <AnimatedCircularProgress
                  key={playingMusic}
                  size={47}
                  width={3}
                  fill={progressNum}
                  tintColor={Colors.red40}
                  rotation={0}
                  lineCap="round">
                  {() => (
                    <Image
                      source={{uri: STATIC_URL + 'default_music_cover.jpg'}}
                      style={styles.image}
                    />
                  )}
                </AnimatedCircularProgress>
                <View width={210} marginL-12>
                  <MarqueeText
                    speed={0.2}
                    style={{color: Colors.white}}
                    marqueeOnStart={false}
                    loop={true}
                    delay={1000}>
                    {(playingMusic?.title ?? '还没有要播放的音乐') +
                      ' - ' +
                      (playingMusic?.artists?.join('/') || '未知歌手')}
                  </MarqueeText>
                </View>
              </TouchableOpacity>
              <View row centerV>
                <TouchableOpacity
                  style={styles.musicBut}
                  onPress={() => {
                    playOrPauseRemote();
                  }}>
                  {audioIsPlaying ? (
                    <FontAwesome
                      name="pause-circle"
                      color={Colors.white}
                      size={30}
                    />
                  ) : (
                    <FontAwesome
                      name="play-circle-o"
                      color={Colors.white}
                      size={30}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.musicBut}
                  marginL-6
                  marginR-12
                  onPress={() => setListModalVisible(true)}>
                  <FontAwesome name="bars" color={Colors.white} size={22} />
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>
      ) : null}
      <Modal
        animationType="fade"
        transparent={true}
        visible={musicModalVisible}
        statusBarTranslucent
        onRequestClose={() => {
          setMusicModalVisible(!musicModalVisible);
        }}>
        <View
          height={fullHeight + statusBarHeight}
          backgroundColor={Colors.hyalineGrey}>
          <ImageBackground
            blurRadius={40}
            style={styles.backImage}
            source={{uri: STATIC_URL + userInfo?.user_avatar}}
            resizeMode="cover">
            <View padding-12>
              <TouchableOpacity onPress={() => setMusicModalVisible(false)}>
                <AntDesign name="close" color={Colors.white} size={24} />
              </TouchableOpacity>
              <View row centerV marginT-12>
                <Image
                  source={{uri: STATIC_URL + 'default_music_cover.jpg'}}
                  style={styles.bigImage}
                />
                <View paddingH-16 flexS>
                  <Text text60BO white>
                    {playingMusic?.title ?? '还没有要播放的音乐 ~'}
                  </Text>
                  <Text marginT-8 white>
                    {playingMusic?.artists?.join(' / ') || '未知歌手'}
                  </Text>
                </View>
              </View>
              {playingMusic?.sampleRate ? (
                <View marginT-16 row centerV spread>
                  <Text white text100L>
                    采样率：{playingMusic.sampleRate} Hz
                  </Text>
                  <Text white text100L>
                    比特率：{playingMusic.bitrate} Hz
                  </Text>
                </View>
              ) : null}
              <View marginT-16>
                <Slider
                  value={audioPlayprogress?.currentPosition ?? 0}
                  minimumValue={0}
                  maximumValue={audioPlayprogress?.duration ?? 100}
                  maximumTrackTintColor={Colors.white}
                  thumbTintColor={Colors.Primary}
                  minimumTrackTintColor={Colors.Primary}
                  onValueChange={value => {
                    audioPlayer.seekToPlayer(value);
                  }}
                />
                <View row centerV spread marginT-4>
                  <Text text90L white>
                    {formatMilliseconds(
                      audioPlayprogress?.currentPosition ?? 0,
                    )}
                  </Text>
                  <Text text90L white>
                    {formatMilliseconds(audioPlayprogress?.duration ?? 0)}
                  </Text>
                </View>
              </View>
              <View row centerV spread marginT-16 paddingH-16>
                <TouchableOpacity
                  style={styles.musicBut}
                  onPress={() => {
                    setPlayType(prev => {
                      if (prev === 'order') {
                        showToast('随机播放', 'success');
                        return 'random';
                      }
                      if (prev === 'random') {
                        showToast('单曲循环', 'success');
                        return 'single';
                      }
                      if (prev === 'single') {
                        showToast('顺序播放', 'success');
                        return 'order';
                      }
                    });
                  }}>
                  {playType === 'order' ? (
                    <FontAwesome
                      name="long-arrow-right"
                      color={Colors.white}
                      size={20}
                    />
                  ) : playType === 'random' ? (
                    <FontAwesome
                      name="refresh"
                      color={Colors.white}
                      size={20}
                    />
                  ) : playType === 'single' ? (
                    <FontAwesome name="repeat" color={Colors.white} size={20} />
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.musicBut}
                  onPress={() => {
                    previousRemote();
                  }}>
                  <FontAwesome
                    name="step-backward"
                    color={Colors.white}
                    size={24}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    playOrPauseRemote();
                  }}>
                  {audioIsPlaying ? (
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
                <TouchableOpacity
                  style={styles.musicBut}
                  onPress={() => {
                    nextRemote();
                  }}>
                  <FontAwesome
                    name="step-forward"
                    color={Colors.white}
                    size={24}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.musicBut}
                  onPress={() => setListModalVisible(true)}>
                  <FontAwesome name="bars" color={Colors.white} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent={true}
        visible={listModalVisible}
        onRequestClose={() => {
          setListModalVisible(!listModalVisible);
        }}>
        <View
          height={fullHeight + statusBarHeight}
          backgroundColor={Colors.hyalineGrey}>
          <ImageBackground
            blurRadius={40}
            style={styles.listBackImage}
            source={{uri: STATIC_URL + userInfo?.user_avatar}}
            resizeMode="cover">
            <View padding-12>
              <TouchableOpacity onPress={() => setListModalVisible(false)}>
                <AntDesign name="close" color={Colors.white} size={24} />
              </TouchableOpacity>
              {playingMusic?.id ? (
                <View marginL-12>
                  <Text white text70BO marginT-12>
                    当前播放
                  </Text>
                  <Text white text80BO marginB-12 flexG>
                    {playingMusic.title}
                  </Text>
                </View>
              ) : null}
              <FlatList
                data={playList}
                keyExtractor={(item, index) => item + index}
                renderItem={({item}) => (
                  <View row centerV>
                    <View flexG marginB-6>
                      <TouchableOpacity
                        onPress={() => {
                          dispatch(setPlayingMusic(item));
                        }}
                        flexS
                        centerV
                        style={styles.playingStyle}
                        backgroundColor={
                          playingMusic?.id === item.id
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
                              dispatch(removePlayList([item]));
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
    </MusicCtrlContext.Provider>
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
  playingStyle: {
    borderRadius: 12,
  },
  marqueeText: {
    maxWidth: 240,
  },
  ctrlBackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 2,
  },
  backImage: {
    width: '100%',
    height: fullHeight * 0.42,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    elevation: 2,
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
  CtrlContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    width: '100%',
    bottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  image: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderColor: Colors.white,
    borderWidth: 1,
  },
  bigImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: Colors.white,
    borderWidth: 1,
  },
});

export default MusicCtrlProvider;
