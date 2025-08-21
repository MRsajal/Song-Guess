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

  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsLoading(true);
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      alert("Please enter a valid YouTube URL");
      setIsLoading(false);
      return;
    }

    try {
      const title = songTitle.trim() || `Song ${songs.length + 1}`;

      const newSong = {
        url: youtubeUrl,
        title: title,
        videoId: videoId,
        addedAt: Date.now(),
      };

      onAddSong(newSong);
      setYoutubeUrl("");
      setSongTitle("");
    } catch (error) {
      alert("Error adding song. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="screen-container">
      <div className="content-wrapper">
        <div className="card">
          <div className="song-manager-header">
            <h3>Song Playlist</h3>
            <span className="song-count">{songs.length} songs</span>
          </div>

          {isHost && (
            <div className="add-song-section">
              <h4>Add New Song</h4>
              <form onSubmit={handleAddSong} className="add-song-form">
                <div className="form-group">
                  <label>YouTube URL:</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Paste YouTube URL here..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Song Title (Optional):</label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Enter song title"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-add"
                >
                  {isLoading ? "Adding..." : "+ Add Song"}
                </button>
              </form>
            </div>
          )}

          {songs.length > 0 ? (
            <div className="song-list-section">
              <div className="song-list">
                {songs.map((song, index) => (
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
                <button
                  onClick={onStartGame}
                  className="btn btn-primary btn-large start-game-btn"
                >
                  🎮 Start Game with {songs.length} songs
                </button>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3>No songs added yet!</h3>
              {isHost ? (
                <p>Add some YouTube songs to get started.</p>
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
