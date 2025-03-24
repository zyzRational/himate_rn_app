import {Colors} from 'react-native-ui-lib';
import {Dimensions, StatusBar} from 'react-native';

export const fullWidth = Dimensions.get('window').width;
export const fullHeight = Dimensions.get('window').height;
export const statusBarHeight = StatusBar.currentHeight;

/* 设置系统主题色 */
export const SystemThemeInit = color => {
  Colors.loadColors({
    Primary: color ?? '#5A48F4',
    geekblue: '#2f54eb',
    magenta: '#eb2f96',
    success: Colors.green40,
    warning: Colors.yellow40,
    error: Colors.red40,
    hyalineWhite: 'rgba(255,255,255,0.4)',
    hyalineGrey: 'rgba(0,0,0,0.4)',
    primaryBackground: '#f5f5f5',
    lyricColor: Colors.white,
  });
};
