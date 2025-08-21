import React, { useState } from "react";
import FirebaseService from "../firebase/firbaseService";

const RoomJoin = ({ onJoinRoom, onBack }) => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    setIsJoining(true);
    // Use the safe user ID generator from FirebaseService
    const userId = FirebaseService.generateUserId();

    try {
      const result = await FirebaseService.joinRoom(
        roomCode.toUpperCase(),
        playerName,
        userId
      );

      if (result.success) {
        onJoinRoom(roomCode.toUpperCase(), playerName, userId, result.roomData);
      } else {
        alert(result.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please check the room code and try again.");
    }

    setIsJoining(false);
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
                placeholder="Enter 6-digit room code"
                maxLength={6}
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
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomJoin;
