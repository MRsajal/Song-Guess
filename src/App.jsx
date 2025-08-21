import React, { useState } from "react";
import "./App.css";
import RoomCreation from "./components/RoomCreation";
import RoomJoin from "./components/RoomJoin";
import GameRoom from "./components/GameRoom";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [roomData, setRoomData] = useState(null);
  const [userId, setUserId] = useState(null);

  const handleCreateRoom = (roomCode, hostName, newUserId, newRoomData) => {
    setUserId(newUserId);
    setRoomData(newRoomData);
    setCurrentView("game");
  };

  const handleJoinRoom = (roomCode, playerName, newUserId, newRoomData) => {
    setUserId(newUserId);
    setRoomData(newRoomData);
    setCurrentView("game");
  };

  const handleLeaveRoom = () => {
    setCurrentView("home");
    setRoomData(null);
    setUserId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "create":
        return (
          <RoomCreation
            onCreateRoom={handleCreateRoom}
            onBack={() => setCurrentView("home")}
          />
        );
      case "join":
        return (
          <RoomJoin
            onJoinRoom={handleJoinRoom}
            onBack={() => setCurrentView("home")}
          />
        );
      case "game":
        return (
          <GameRoom
            roomData={roomData}
            userId={userId}
            onLeaveRoom={handleLeaveRoom}
          />
        );
      default:
        return (
          <div className="home-screen">
            <div className="home-container">
              <div className="home-content">
                <h1>🎵 Emoji Song Guess 🎵</h1>
                <p>
                  Create a room, add YouTube songs, and let AI generate emojis
                  for your friends to guess!
                </p>
                <div className="button-group">
                  <button
                    className="btn btn-primary"
                    onClick={() => setCurrentView("create")}
                  >
                    Create Room
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentView("join")}
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return <div className="App">{renderCurrentView()}</div>;
}

export default App;
