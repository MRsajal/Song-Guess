import React, { useState, useEffect } from "react";
import "./App.css";
import RoomCreation from "./components/RoomCreation";
import RoomJoin from "./components/RoomJoin";
import GameRoom from "./components/GameRoom";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [roomData, setRoomData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted room data on page load
    const savedRoom = localStorage.getItem("currentRoom");
    if (savedRoom) {
      try {
        const {
          roomData: savedRoomData,
          userId: savedUserId,
          currentView: savedView,
        } = JSON.parse(savedRoom);
        setRoomData(savedRoomData);
        setUserId(savedUserId);
        setCurrentView("game"); // Always go to game view when restoring
        console.log("Restored room from localStorage:", savedRoomData.code);
      } catch (error) {
        console.error("Error restoring room data:", error);
        localStorage.removeItem("currentRoom");
      }
    }
    setIsLoading(false);
  }, []);

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
    localStorage.removeItem("currentRoom");
  };

  if (isLoading) {
    return (
      <div className="screen-container">
        <div className="content-wrapper">
          <div className="card">
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Loading...</h3>
              <p>Checking for existing session...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
