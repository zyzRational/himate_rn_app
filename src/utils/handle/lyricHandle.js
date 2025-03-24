import {isEmptyString} from '../base';

export const parserLrc = lrc => {
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

// 解析歌词函数
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
      const wordRegex =
        /([\p{Script=Hani}\p{Script=Hira}\p{Script=Kana}])\((\d+),(\d+)\)/gu;
      const words = [];
      let match;

      while ((match = wordRegex.exec(line)) !== null) {
        words.push({
          char: match[1],
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
  const romaLyrics = parserLrc(music_roma);
  const yrcLyrics = parseYrcs(music_yrc);
  console.log(lyric, yrcLyrics);

  // 将歌词数组转换为以 time 为键的对象
  const transLyricsMap = transLyrics.reduce((map, _lyric) => {
    map[_lyric.time] = _lyric.text;
    return map;
  }, {});

  const romaLyricsMap = romaLyrics.reduce((map, _lyric) => {
    map[_lyric.time] = _lyric.text;
    return map;
  }, {});

  // 合并歌词
  const mergedLyrics = lyric.map(zhLyric => {
    const transText = transLyricsMap[zhLyric.time] || '';
    const romaText = romaLyricsMap[zhLyric.time] || '';
    return {
      time: zhLyric.time,
      lyric: zhLyric.text,
      trans: transText,
      roma: romaText,
    };
  });

  return {
    Lyrics: mergedLyrics,
    yrcLyrics: yrcLyrics,
    haveYrc: yrcLyrics.length > 0,
    haveTrans: transLyrics.length > 0,
    haveRoma: romaLyrics.length > 0,
  };
};
