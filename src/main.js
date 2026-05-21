const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const volumeBar = document.getElementById('volume-bar');
const fileInput = document.getElementById('file-input');
const playlistEl = document.getElementById('playlist');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const playlistBtn = document.getElementById('playlist-btn');
const playlistPanel = document.getElementById('playlist-panel');

let playlist = [];
let currentIndex = 0;


// Load songs from file picker
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^/.]+$/, '');
    playlist.push({ name, url, file });
    const li = document.createElement('li');
    li.textContent = name;
    li.addEventListener('click', () => loadSong(playlist.indexOf({ name, url })));
    playlistEl.appendChild(li);
  });
  if (playlist.length === files.length) {
    loadSong(0);
  }
});

// Load a song by index
function loadSong(index) {
  currentIndex = index;
  const song = playlist[index];
  audio.src = song.url;
  songTitle.innerHTML = `<span>${song.name.toUpperCase()}</span>`;
  songArtist.textContent = '--';
  audio.play();
  playBtn.textContent = '⏸';
  updateActiveItem();

  jsmediatags.read(song.file, {
    onSuccess: (tag) => {
      const artist = tag.tags.artist || '--';
      const title = tag.tags.title || song.name;
      songArtist.textContent = artist.toUpperCase();
      songTitle.innerHTML = `<span>${title.toUpperCase()}</span>`;
    },
    onError: () => {
      songTitle.innerHTML = `<span>${song.name.toUpperCase()}</span>`;
    }
  });
}

// Update which playlist item is highlighted
function updateActiveItem() {
  const items = playlistEl.querySelectorAll('li');
  items.forEach((item, i) => {
    item.classList.toggle('active', i === currentIndex);
  });
}

// Play / pause
playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = '⏸';
  } else {
    audio.pause();
    playBtn.textContent = '▶';
  }
});

// Previous
prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadSong(currentIndex);
});

// Next
nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  loadSong(currentIndex);
});

// Auto play next song when current ends
audio.addEventListener('ended', () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  loadSong(currentIndex);
});

// Update progress bar as song plays
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalTimeEl.textContent = formatTime(audio.duration);
  }
});

// Scrub through song
progressBar.addEventListener('input', () => {
  audio.currentTime = (progressBar.value / 100) * audio.duration;
});

// Volume
volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value;
});

// Toggle playlist panel
playlistBtn.addEventListener('click', () => {
  playlistPanel.classList.toggle('open');
});

document.getElementById('close-playlist-btn').addEventListener('click', () => {
  playlistPanel.classList.remove('open');
});

// Format seconds into m:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Exit button
document.getElementById('exit-btn').addEventListener('click', async () => {
  const { exit } = window.__TAURI__.process;
  await exit(0);
});

// Share button - generate shareable link
document.getElementById('share-btn').addEventListener('click', async () => {
  if (playlist.length === 0) {
    alert('Add some songs first!');
    return;
  }

  // Create status popup
  const status = document.createElement('div');
  status.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0d2137;
    border: 3px solid #ff80b5;
    border-radius: 12px;
    padding: 20px;
    z-index: 1000;
    text-align: center;
    font-family: 'Share Tech Mono', monospace;
    color: #7efff5;
    font-size: 11px;
    min-width: 200px;
  `;
  status.id = 'share-status';
  document.body.appendChild(status);

  const setStatus = (msg) => {
    console.log(msg);
    status.innerHTML = `
      <p style="letter-spacing: 2px; margin-bottom: 10px;">${msg}</p>
      <button onclick="this.parentElement.remove()" style="background: #ff80b5; border: none; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 10px;">CANCEL</button>
    `;
  };

  try {
    setStatus('CONNECTING TO SUPABASE...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabaseClient
      .from('playlists')
      .select('count')
      .limit(1);
    
    if (testError) {
      setStatus(`CONNECTION ERROR: ${testError.message}`);
      return;
    }

    setStatus('CONNECTED! UPLOADING SONGS...');
    const songData = [];

    for (let i = 0; i < playlist.length; i++) {
      const song = playlist[i];
      setStatus(`UPLOADING ${i + 1} OF ${playlist.length}:<br/>${song.name}`);
      
      const fileName = `${Date.now()}-${song.file.name}`;

      const { error } = await supabaseClient.storage
        .from('songs')
        .upload(fileName, song.file, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (error) {
        setStatus(`UPLOAD FAILED:<br/>${error.message}`);
        return;
      }

      const { data: urlData } = supabaseClient.storage
        .from('songs')
        .getPublicUrl(fileName);

      songData.push({ name: song.name, url: urlData.publicUrl });
      setStatus(`UPLOADED ${i + 1} OF ${playlist.length} ✓`);
    }

    setStatus('SAVING PLAYLIST...');
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: dbError } = await supabaseClient
.from('playlists')
  .upsert({ name: 'My Playlist', songs: songData, share_code: shareCode }, { onConflict: 'share_code' });

    if (dbError) {
      setStatus(`DATABASE ERROR:<br/>${dbError.message}`);
      return;
    }

    const shareUrl = `https://chpiknoillslpmowgvdj.supabase.co/functions/v1/playlist?code=${shareCode}`;

 status.innerHTML = `
  <p style="color: #7efff5; font-size: 10px; letter-spacing: 3px; margin-bottom: 10px;">SHARE YOUR PLAYLIST</p>
  <button id="open-link-btn" style="background: none; border: none; color: #ffe066; font-size: 14px; cursor: pointer; font-family: 'Share Tech Mono', monospace; text-decoration: underline;">🎵 Click to open playlist</button>
  <br/><br/>
  <button onclick="this.parentElement.remove()" style="background: #ff80b5; border: none; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 10px;">CLOSE</button>
`;

document.getElementById('open-link-btn').addEventListener('click', async () => {
  window.__TAURI__.core.invoke('open_url', { url: shareUrl });

await openUrl(shareUrl);
});

  } catch (err) {
    setStatus(`ERROR: ${err.message}`);
  }
});
