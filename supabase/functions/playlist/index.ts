import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No playlist code provided", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("share_code", code)
    .single();

  if (error || !data) {
    return new Response("Playlist not found", { status: 404 });
  }

  const songs = data.songs;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.name} 🎵</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #ffd6e7;
      font-family: 'Share Tech Mono', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .player {
      background: linear-gradient(145deg, #ffb3d1, #ffd6e7);
      border: 3px solid #ff80b5;
      border-radius: 20px;
      padding: 24px;
      width: 340px;
      box-shadow: 6px 6px 0px #ff80b5;
    }
    h1 {
      font-family: 'VT323', monospace;
      color: #ffe066;
      font-size: 28px;
      text-align: center;
      background: #0d2137;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 16px;
      border: 2px solid #ff80b5;
    }
    .now-playing {
      background: #0d2137;
      border-radius: 8px;
      border: 2px solid #ff80b5;
      padding: 10px;
      margin-bottom: 16px;
      text-align: center;
    }
    .now-playing p {
      color: #7efff5;
      font-size: 8px;
      letter-spacing: 3px;
      margin-bottom: 4px;
    }
    #current-song {
      color: #ffe066;
      font-family: 'VT323', monospace;
      font-size: 20px;
    }
    audio {
      width: 100%;
      margin-bottom: 16px;
      accent-color: #ffe066;
    }
    .playlist {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
    .playlist li {
      color: #ffe066;
      font-family: 'VT323', monospace;
      font-size: 20px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      background: #0d2137;
    }
    .playlist li:hover { color: #7efff5; }
    .playlist li.active { color: #ff80b5; }
    .label {
      color: #7efff5;
      font-size: 8px;
      letter-spacing: 3px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="player">
    <h1>🎵 ${data.name}</h1>
    <div class="now-playing">
      <p>NOW PLAYING</p>
      <div id="current-song">SELECT A SONG</div>
    </div>
    <audio id="audio" controls></audio>
    <p class="label">PLAYLIST</p>
    <ul class="playlist" id="playlist"></ul>
  </div>
  <script>
    const songs = ${JSON.stringify(songs)};
    const audio = document.getElementById('audio');
    const playlistEl = document.getElementById('playlist');
    const currentSong = document.getElementById('current-song');

    songs.forEach((song, i) => {
      const li = document.createElement('li');
      li.textContent = song.name;
      li.addEventListener('click', () => {
        audio.src = song.url;
        audio.play();
        currentSong.textContent = song.name.toUpperCase();
        document.querySelectorAll('.playlist li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
      });
      playlistEl.appendChild(li);
    });

    audio.addEventListener('ended', () => {
      const active = document.querySelector('.playlist li.active');
      const next = active?.nextElementSibling;
      if (next) next.click();
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
});