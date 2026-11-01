const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();
const agent = new https.Agent({ rejectUnauthorized: false });

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://sarigama.lk/'
};

app.get('/', (req, res) => {
  res.json({
    status: true,
    message: 'Sarigama.lk Direct Scraper API is Live!',
    endpoint: '/api/audio?q=SongName'
  });
});

app.get('/api/audio', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ status: false, error: 'Provide a song name using ?q=SongName' });
  }

  try {
    // 1. Sarigama Search API එකට රික්වෙස්ට් කිරීම
    const searchUrl = `https://sarigama.lk/api/v1/search/mas/${encodeURIComponent(query)}`;[span_1](start_span)[span_1](end_span)
    const searchRes = await axios.get(searchUrl, { headers, httpsAgent: agent, timeout: 15000 });
    
    // API එකෙන් එන JSON එකෙන් ඩිරෙක්ට් ඩවුන්ලෝඩ් ලින්ක් එක හෝ සොං ඩේටා ලබාගැනීම
    const data = searchRes.data;
    
    // මෙතන API එකේ structure එකට අනුව direct download link එක ලබා ගැනීම 
    // (උඹ උඩ දීලා තියෙන forceddownloadfile ලින්ක් එක හෝ API එකෙන් එන ඩීටෙල්ස්)
    let directAudioUrl = data?.download_url || data?.result?.download_url || data?.url;
    let songTitle = query;

    // JSON එකේ ස්ට්‍රක්චර් එක වෙනස් නම්, අදාළ රිזල්ට් එකෙන් ලින්ක් එක ලබාගැනීමේ ලොජික් එක
    if (!directAudioUrl && Array.isArray(data) && data.length > 0) {
      directAudioUrl = data[0].download_url || data[0].url;
      songTitle = data[0].title || query;
    } else if (!directAudioUrl && data?.data) {
      directAudioUrl = data.data.download_url || data.data.url;
      songTitle = data.data.title || query;
    }

    // ස්විස්තරාත්මක ලින්ක් එකක් හමු නොවූයේ නම් උඹ සොයාගත් ෆෝමැට් එකට අනුව සෙට් කිරීම
    if (!directAudioUrl) {
      return res.status(404).json({ status: false, error: 'Song download link not found from sarigama API' });
    }

    // 2. Binary Buffer එක ලෙස ඕඩියෝ එක ලබාගෙන බොට් වෙත යැවීම
    const audioStream = await axios.get(directAudioUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Song-Title', encodeURIComponent(songTitle));
    res.send(Buffer.from(audioStream.data));

  } catch (e) {
    res.status(500).json({ status: false, error: e.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Server running on port 3000'));
}

module.exports = app;
