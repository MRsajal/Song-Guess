import React, { useState } from "react";

const RoomJoin = ({ onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      onJoinRoom(roomCode.toUpperCase(), playerName);
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
