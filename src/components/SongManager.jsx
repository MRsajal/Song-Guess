import React, { useState } from "react";

const SongManager = ({
  songs,
  onAddSong,
  onRemoveSong,
  onStartGame,
  isHost,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const songsArray = songs ? Object.values(songs) : [];

  // const extractVideoId = (url) => {
  //   const regex =
  //     /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  //   const match = url.match(regex);
  //   return match ? match[1] : null;
  // };

  // const handleAddSong = async (e) => {
  //   e.preventDefault();
  //   if (!youtubeUrl.trim()) return;

  //   setIsLoading(true);
  //   const videoId = extractVideoId(youtubeUrl);

  //   if (!videoId) {
  //     alert("Please enter a valid YouTube URL");
  //     setIsLoading(false);
  //     return;
  //   }

  //   try {
  //     const title = songTitle.trim() || `Song ${songs.length + 1}`;

  //     const newSong = {
  //       url: youtubeUrl,
  //       title: title,
  //       videoId: videoId,
  //       addedAt: Date.now(),
  //     };

  //     onAddSong(newSong);
  //     setYoutubeUrl("");
  //     setSongTitle("");
  //   } catch (error) {
  //     alert("Error adding song. Please try again.");
  //   }

  //   setIsLoading(false);
  // };

  return (
    <div className="screen-container">
      <div className="content-wrapper">
        <div className="card">
          <div className="song-manager-header">
            <h3>Song Playlist</h3>
            <span className="song-count">{songsArray.length} songs</span>
          </div>

          {songsArray.length > 0 ? (
            <div className="song-list-section">
              <div className="song-list">
                {songsArray.map((song, index) => (
                  <div key={song.id} className="song-item">
                    <div className="song-info">
                      <span className="song-number">{index + 1}</span>
                      <div className="song-details">
                        <h4>{song.title}</h4>
                        <a
                          href={song.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="song-url"
                        >
                          🎵 Watch on YouTube
                        </a>
                      </div>
                    </div>
                    {isHost && (
                      <button
                        onClick={() => onRemoveSong(song.id)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isHost && (
                <div className="game-controls">
                  <button
                    onClick={onStartGame}
                    className="btn btn-primary btn-large start-game-btn"
                  >
                    🎮 Start Game with {songsArray.length} songs
                  </button>
                  <p className="help-text">
                    All songs were added during room creation. Ready to play?
                  </p>
                </div>
              )}

              {!isHost && (
                <div className="waiting-host">
                  <p>🎵 {songsArray.length} songs ready to play!</p>
                  <p>Waiting for host to start the game...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>No songs added yet!</h3>
              {isHost ? (
                <div>
                  <p>Songs can only be added when creating the room.</p>
                  <p>Create a new room to add songs.</p>
                </div>
              ) : (
                <p>Waiting for the host to add songs...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongManager;
