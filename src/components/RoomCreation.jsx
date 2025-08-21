import React, { useState } from "react";

const RoomCreation = ({ onCreateRoom, onBack }) => {
  const [hostName, setHostName] = useState("");
  const [roomCode] = useState(() =>
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
  const [songs, setSongs] = useState([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!currentUrl.trim()) return;

    setIsLoading(true);
    const videoId = extractVideoId(currentUrl);

    if (!videoId) {
      alert("Please enter a valid YouTube URL");
      setIsLoading(false);
      return;
    }

    try {
      const title = currentTitle.trim() || `Song ${songs.length + 1}`;

      const newSong = {
        url: currentUrl,
        title: title,
        videoId: videoId,
        addedAt: Date.now(),
        id: Date.now(),
      };

      setSongs((prev) => [...prev, newSong]);
      setCurrentUrl("");
      setCurrentTitle("");
    } catch (error) {
      alert("Error adding song. Please try again.");
    }

    setIsLoading(false);
  };

  const removeSong = (songId) => {
    setSongs((prev) => prev.filter((song) => song.id !== songId));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (hostName.trim()) {
      onCreateRoom(roomCode, hostName);
    }
  };
  return (
    <div className="screen-container">
      <div className="content-wrapper">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <div className="card">
          <h2>Create a New Room</h2>

          <div className="form-section">
            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label>Room Code:</label>
              <input
                type="text"
                value={roomCode}
                disabled
                className="room-code-display"
              />
              <small>Share this code with your friends!</small>
            </div>
          </div>

          <div className="divider">
            <span>Add Songs to Your Playlist</span>
          </div>

          <form onSubmit={handleAddSong} className="add-song-form">
            <div className="form-group">
              <label>YouTube URL:</label>
              <input
                type="url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
              />
            </div>
            <div className="form-group">
              <label>Song Title (Optional):</label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Enter song title"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !currentUrl.trim()}
              className="btn btn-add"
            >
              {isLoading ? "Adding..." : "+ Add Song"}
            </button>
          </form>

          {songs.length > 0 && (
            <div className="songs-preview">
              <h3>Added Songs ({songs.length})</h3>
              <div className="song-list">
                {songs.map((song, index) => (
                  <div key={song.id} className="song-item">
                    <div className="song-info">
                      <span className="song-number">{index + 1}.</span>
                      <div className="song-details">
                        <h4>{song.title}</h4>
                        <a
                          href={song.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="song-url"
                        >
                          🎵 YouTube
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSong(song.id)}
                      className="remove-btn"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="create-room-section">
            <button
              onClick={handleCreate}
              className="btn btn-primary btn-large"
              disabled={!hostName.trim()}
            >
              Create Room {songs.length > 0 && `with ${songs.length} songs`}
            </button>
            {songs.length === 0 && (
              <p className="help-text">
                You can create the room now and add songs later, or add some
                songs first!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCreation;
