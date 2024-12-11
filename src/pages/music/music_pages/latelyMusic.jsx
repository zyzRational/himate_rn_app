import React, {useState, useEffect} from 'react';
import {View, Colors, Button} from 'react-native-ui-lib';
import {useToast} from '../../../components/commom/Toast';
import MusicList from '../../../components/music/MusicList';
import {useRealm} from '@realm/react';
import BaseDialog from '../../../components/commom/BaseDialog';

const LatelyMusic = ({navigation}) => {
  const {showToast} = useToast();
  const realm = useRealm();
  const [localMusic, setLocalMusic] = useState([]);

  // 获取最近播放的音乐记录
  const getLocalMusic = async () => {
    const music = realm.objects('MusicInfo').toJSON();
    setLocalMusic(music);
  };

  /* 删除本地音乐记录 */
  const [delVisible, setDelVisible] = useState(false);
  const delLocalMusic = () => {
    const toDelete = realm.objects('MusicInfo');
    realm.write(() => {
      realm.delete(toDelete);
    });
    showToast('清空成功', 'success');
    getLocalMusic();
  };

  useEffect(() => {
    if (realm) {
      getLocalMusic();
    }
  }, [realm]);

  return (
    <View padding-12>
      <MusicList
        List={localMusic}
        HeightScale={0.92}
        RightBut={
          <View paddingR-12>
            <Button
              label="清空记录"
              size="small"
              link
              linkColor={Colors.red40}
              onPress={() => {
                setDelVisible(true);
              }}
            />
          </View>
        }
      />
      <BaseDialog
        IsWarning={true}
        Title={true}
        IsButton={true}
        Fun={() => {
          delLocalMusic();
          setDelVisible(false);
        }}
        Visible={delVisible}
        SetVisible={setDelVisible}
        MainText={'您确定清空最近播放记录吗？'}
      />
    </View>
  );
};

export default LatelyMusic;
