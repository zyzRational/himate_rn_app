import * as React from 'react';
import {ToastAndroid, StyleSheet, Platform} from 'react-native';
import {Toast, View, Text, Colors} from 'react-native-ui-lib';
import {useSelector} from 'react-redux';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export const ToastContext = React.createContext();
export const useToast = () => React.useContext(ToastContext);

let timer = null;
const ToastProvider = props => {
  const {children} = props;
  const ToastType = useSelector(state => state.settingStore.toastType);
  const [Message, setMessage] = React.useState(null);
  const [isVisible, setVisible] = React.useState(false);
  const [typecolor, setTypecolor] = React.useState(Colors.grey40);
  const [iosToatVisible, setIosToatVisible] = React.useState(false);

  const iosToastShow = useSharedValue(false);
  const AnimatedShowToast = useAnimatedStyle(() => {
    return {
      opacity: withTiming(iosToastShow.value ? 1 : 0),
    };
  });

  const showToast = async (msg, type, isSystem = false) => {
    if (msg) {
      if (ToastType === 'System' || isSystem) {
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            msg,
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        }
        if (Platform.OS === 'ios') {
          if (timer) {
            return;
          }
          setIosToatVisible(true);
          iosToastShow.value = true;
          setMessage(msg);
          timer = setTimeout(() => {
            setIosToatVisible(false);
            iosToastShow.value = false;
            clearTimeout(timer);
            timer = null;
          }, 1200);
        }
      }
      if (ToastType !== 'System' && !isSystem) {
        setMessage(msg);
        setVisible(true);
      }
    }
    if (type === 'warning') {
      setTypecolor(Colors.warning);
    }
    if (type === 'success') {
      setTypecolor(Colors.success);
    }
    if (type === 'error') {
      setTypecolor(Colors.error);
    }
  };

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      <Toast
        onDismiss={() => {
          setVisible(false);
        }}
        position={ToastType === 'System' ? 'bottom' : ToastType}
        centerMessage={true}
        backgroundColor={typecolor}
        visible={isVisible}
        autoDismiss={1200}
        message={Message}
        color={Colors.white}
      />
      {iosToatVisible ? (
        <Animated.View style={[styles.IosToastStyle, AnimatedShowToast]}>
          <View style={styles.IosToastBox} padding-10>
            <Text white text80>
              {Message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  IosToastStyle: {
    position: 'absolute',
    backgroundColor: 'transparent',
    width: '100%',
    bottom: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  IosToastBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    maxWidth: 200,
  },
});

export default ToastProvider;
