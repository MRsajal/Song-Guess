import React, { useState } from "react";
import FirebaseService from "../firebase/firbaseService";

const SongManager = ({
  songs,
  onRemoveSong,
  onStartGame,
  isHost,
  roomCode,
}) => {
  const [currentInput, setCurrentInput] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [inputType, setInputType] = useState("url"); // "url" or "name"
  const [isLoading, setIsLoading] = useState(false);

  const songsArray = songs ? Object.values(songs) : [];

  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    setIsLoading(true);

    try {
      let newSong;

      if (inputType === "url") {
        // Handle YouTube URL
        const videoId = extractVideoId(currentInput);

        if (!videoId) {
          alert("Please enter a valid YouTube URL");
          setIsLoading(false);
          return;
        }

        const title = currentTitle.trim() || `Song ${songsArray.length + 1}`;

        newSong = {
          url: currentInput,
          title: title,
          videoId: videoId,
          addedAt: Date.now(),
          type: "youtube"
        };
      } else {
        // Handle song name only
        const title = currentInput.trim();

        newSong = {
          url: "", // No URL for song name only
          title: title,
          videoId: null,
          addedAt: Date.now(),
          type: "name"
        };
      }

      const result = await FirebaseService.addSong(roomCode, newSong);
      
      if (result.success) {
        setCurrentInput("");
        setCurrentTitle("");
      } else {
        alert(result.error || "Failed to add song");
      }
    } catch (error) {
      console.error("Error adding song:", error);
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
            <span className="song-count">{songsArray.length} songs</span>
          </div>

          {isHost && (
            <div className="add-song-section">
              <h4>Add New Song</h4>
              <form onSubmit={handleAddSong} className="add-song-form">
                <div className="form-group">
                  <label>Add Song By:</label>
                  <div className="input-type-selector">
                    <button
                      type="button"
                      className={`btn ${inputType === "url" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => {
                        setInputType("url");
                        setCurrentInput("");
                        setCurrentTitle("");
                      }}
                    >
                      YouTube URL
                    </button>
                    <button
                      type="button"
                      className={`btn ${inputType === "name" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => {
                        setInputType("name");
                        setCurrentInput("");
                        setCurrentTitle("");
                      }}
                    >
                      Song Name
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>
                    {inputType === "url" ? "YouTube URL:" : "Song Name:"}
                  </label>
                  <input
                    type={inputType === "url" ? "url" : "text"}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder={
                      inputType === "url" 
                        ? "Paste YouTube URL here..." 
                        : "Enter song name..."
                    }
                    required
                  />
                </div>
                
                {inputType === "url" && (
                  <div className="form-group">
                    <label>Song Title (Optional):</label>
                    <input
                      type="text"
                      value={currentTitle}
                      onChange={(e) => setCurrentTitle(e.target.value)}
                      placeholder="Enter custom song title"
                    />
                    <small>Leave empty to use default title</small>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading || !currentInput.trim()}
                  className="btn btn-add"
                >
                  {isLoading ? "Adding..." : "+ Add Song"}
                </button>
              </form>
            </div>
          )}

          {songsArray.length > 0 ? (
            <div className="song-list-section">
              <div className="song-list">
                {songsArray.map((song, index) => (
                  <div key={song.id} className="song-item">
                    <div className="song-info">
                      <span className="song-number">{index + 1}</span>
                      <div className="song-details">
                        <h4>{song.title}</h4>
                        {song.type === "youtube" && song.url ? (
                          <a
                            href={song.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="song-url"
                          >
                            🎵 Watch on YouTube
                          </a>
                        ) : (
                          <span className="song-type">🎤 Song Name Only</span>
                        )}
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
                    Ready to play? Click to start the guessing game!
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
                <p>Use the form above to add your first song!</p>
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
