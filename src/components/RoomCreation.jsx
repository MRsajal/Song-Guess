import React, { useState } from "react";
import FirebaseService from "../firebase/firbaseService";

const RoomCreation = ({ onCreateRoom, onBack }) => {
  const [hostName, setHostName] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [inputType, setInputType] = useState("url"); // "url" or "name"
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const extractVideoId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isValidYouTubeUrl = (url) => {
    return extractVideoId(url) !== null;
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

        const title = currentTitle.trim() || `Song ${songs.length + 1}`;

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

      setSongs((prev) => [...prev, newSong]);
      setCurrentInput("");
      setCurrentTitle("");
    } catch (error) {
      console.error("Error adding song:", error);
      alert("Error adding song. Please try again.");
    }

    setIsLoading(false);
  };

  const removeSong = (songIndex) => {
    setSongs((prev) => prev.filter((_, index) => index !== songIndex));
  };

  const handleCreateRoom = async () => {
    if (!hostName.trim()) return;

    setIsCreatingRoom(true);
    // Use the safe user ID generator from FirebaseService
    const userId = FirebaseService.generateUserId();

    try {
      const result = await FirebaseService.createRoom(hostName, userId, songs);

      if (result.success) {
        onCreateRoom(result.roomCode, hostName, userId, result.roomData);
      } else {
        alert(result.error || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    }

    setIsCreatingRoom(false);
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
          </div>

          <div className="divider">
            <span>Add Songs to Your Playlist</span>
          </div>

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

          {songs.length > 0 && (
            <div className="songs-preview">
              <h3>Added Songs ({songs.length})</h3>
              <div className="song-list">
                {songs.map((song, index) => (
                  <div key={index} className="song-item">
                    <div className="song-info">
                      <span className="song-number">{index + 1}.</span>
                      <div className="song-details">
                        <h4>{song.title}</h4>
                        {song.type === "youtube" ? (
                          <a
                            href={song.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="song-url"
                          >
                            🎵 YouTube
                          </a>
                        ) : (
                          <span className="song-type">🎤 Song Name Only</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSong(index)}
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
              onClick={handleCreateRoom}
              className="btn btn-primary btn-large"
              disabled={!hostName.trim() || isCreatingRoom}
            >
              {isCreatingRoom
                ? "Creating Room..."
                : `Create Room ${
                    songs.length > 0 ? `with ${songs.length} songs` : ""
                  }`}
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
