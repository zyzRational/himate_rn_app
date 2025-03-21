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
    .filter(line => line !== null);
};

export const formatLrc = Music => {
  const lyricKeys = ['music_lyric', 'music_trans', 'music_yrc', 'music_roma'];
  let lyric = [];
  for (const key in Music) {
    if (Object.prototype.hasOwnProperty.call(Music, key)) {
      const element = Music[key];
      if (lyricKeys.includes(key)) {
        lyric = parserLrc(element);
      }
    }
  }

  return lyric;
};
