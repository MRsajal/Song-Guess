import React, { useState } from "react";

const RoomJoin = ({ onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      // Simulate joining a room that might already have a game in progress
      const joinedRoom = {
        code: roomCode.toUpperCase(),
        host: "Demo Host",
        hostId: "demo-host",
        participants: [
          { id: "demo-host", name: "Demo Host" },
          { id: Date.now().toString(), name: playerName },
        ],
        songs: [
          {
            id: 1,
            title: "Shape of You",
            url: "https://youtube.com/watch?v=demo1",
            videoId: "demo1",
          },
          {
            id: 2,
            title: "Blinding Lights",
            url: "https://youtube.com/watch?v=demo2",
            videoId: "demo2",
          },
        ],
        currentGame: {
          currentSongIndex: 0,
          scores: {},
          startTime: Date.now(),
          currentEmojis: "🔷👤💘🎵", // Demo emojis
          gamePhase: "guessing",
          timeLeft: 25,
        },
        gameState: "playing",
      };
      onJoinRoom(roomCode.toUpperCase(), playerName, joinedRoom);
    }
  };

  return (
    <div className="screen-container">
      <div className="content-wrapper">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <div className="card">
          <h2>Join a Room</h2>
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label>Room Code:</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 4-digit room code"
                maxLength={4}
                className="room-code-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-large">
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomJoin;
