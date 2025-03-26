import {isEmptyString} from '../base';

// 解析普通歌词函数
export const parserLrc = lrc => {
  if (!lrc) {
    return [];
  }
  const lines = lrc.split('\n');
  return lines
    .map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);
        const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds * 10;
        const text = match[4].trim();
        return {time, text};
      }
      return null;
    })
    .filter(line => line !== null && !isEmptyString(line.text));
};

// 解析逐字歌词函数
export const parseYrcs = lyricsString => {
  if (!lyricsString) {
    return [];
  }

  // 分割各行
  const lines = lyricsString.split('\n').filter(line => line.trim());

  return lines
    .map((line, index) => {
      // 解析行信息 [startTime,duration]
      const lineMatch = line.match(/^\[(\d+),(\d+)\]/);
      if (!lineMatch) {
        return null;
      }

      const startTime = parseInt(lineMatch[1], 10);
      const duration = parseInt(lineMatch[2], 10);
      const endTime = startTime + duration;

      // 解析每个字
      const wordRegex = /([^]+?)\((\d+),(\d+)\)/g;
      const words = [];
      let match;

      while ((match = wordRegex.exec(line)) !== null) {
        words.push({
          char: match[1].replace(/\[\d+,\d+\]/g, ''),
          startTime: parseInt(match[2], 10),
          duration: parseInt(match[3], 10),
          endTime: parseInt(match[2], 10) + parseInt(match[3], 10),
        });
      }

      return {
        id: `${index}-${startTime}`,
        startTime,
        duration,
        endTime,
        words,
      };
    })
    .filter(line => line !== null);
};

export const formatLrc = Music => {
  const {music_lyric, music_trans, music_yrc, music_roma} = Music;

  const lyric = parserLrc(music_lyric);
  const transLyrics = parserLrc(music_trans);
  const romaLyrics = parseYrcs(music_roma);
  const yrcLyrics = parseYrcs(music_yrc);

  // 将歌词数组转换为以 time 为键的对象
  const transLyricsMap = transLyrics.reduce((map, _lyric) => {
    map[_lyric.time] = _lyric.text;
    return map;
  }, {});

  const romaLyricsMap = romaLyrics.map(item => {
    return {roma: item.words.map(word => word.char).join('')};
  });

  // 合并歌词
  const mergedLyrics = lyric.map(zhLyric => {
    const transText = transLyricsMap[zhLyric.time] || '';
    return {
      time: zhLyric.time,
      lyric: zhLyric.text,
      trans: transText,
    };
  });
  return {
    Lyrics: mergeArraysByIndex(mergedLyrics, yrcLyrics, romaLyricsMap),
    haveYrc: yrcLyrics.length > 0,
    haveTrans: transLyrics.length > 0,
    haveRoma: romaLyricsMap.length > 0,
  };
};

export const mergeArraysByIndex = (array1, array2 = [], array3 = []) => {
  const maxLength = array1.length;
  if (maxLength === 0) {
    return [];
  }

  const merge = (arr1, arr2) => {
    return Array.from({length: maxLength}, (_, index) => ({
      ...arr1[index],
      ...arr2[index],
    }));
  };

  if (array2.length > 0 && array3.length > 0) {
    return merge(merge(array1, array2), array3);
  }

  if (array2.length > 0) {
    return merge(array1, array2);
  }

  return array1;
};
