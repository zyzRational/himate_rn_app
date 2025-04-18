import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {
  Colors,
  TouchableOpacity,
  View,
  Incubator,
  Text,
} from 'react-native-ui-lib';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const AudioMsg = props => {
  const {
    Msg = {},
    OnPress = () => {},
    OnLongPress = () => {},
    NowReadyAudioId = null,
    AudioPlayprogress = {},
    AudioIsPlaying = false,
    OnPause = () => {},
    OnPlay = () => {},
    OnValueChange = () => {},
  } = props;

  const {duration = 10, currentPosition = 0} = AudioPlayprogress;

  return (
    <View style={styles.audioBut}>
      <TouchableOpacity
        onPress={OnPress}
        onLongPress={OnLongPress}
        row
        centerV
        paddingV-6
        paddingH-12>
        {NowReadyAudioId === Msg.clientMsg_id ? (
          <>
            {AudioIsPlaying ? (
              <TouchableOpacity onPress={OnPause}>
                <AntDesign
                  name="pausecircle"
                  color={Msg.user._id === 1 ? Colors.Primary : Colors.grey10}
                  size={20}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={OnPlay}>
                <AntDesign
                  name="playcircleo"
                  color={Msg.user._id === 1 ? Colors.Primary : Colors.grey10}
                  size={20}
                />
              </TouchableOpacity>
            )}
            <View row centerV marginL-8>
              <View style={styles.audioProgress}>
                <Incubator.Slider
                  thumbStyle={styles.audioThumb}
                  value={currentPosition}
                  minimumValue={0}
                  maximumValue={duration}
                  minimumTrackTintColor={Colors.Primary}
                  onValueChange={value => {
                    OnValueChange(value);
                  }}
                />
              </View>
              <Text marginL-4 grey30 text90L>
                {Math.round(duration / 1000)}s
              </Text>
            </View>
          </>
        ) : (
          <FontAwesome
            name="volume-down"
            color={Msg.user._id === 1 ? Colors.Primary : Colors.grey10}
            size={24}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  audioBut: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    marginVertical: 4,
  },
  audioProgress: {
    width: 50,
  },
  audioThumb: {
    width: 2,
    height: 24,
    backgroundColor: Colors.red30,
    borderWidth: 1,
    borderRadius: 1,
    borderColor: Colors.red30,
  },
});

export default AudioMsg;
