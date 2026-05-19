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