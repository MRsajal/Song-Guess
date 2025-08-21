import React, { useState } from "react";
import "./App.css";
import RoomCreation from "./components/RoomCreation";
import RoomJoin from "./components/RoomJoin";
import GameRoom from "./components/GameRoom";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [roomData, setRoomData] = useState(null);
  const [userId] = useState(() => Math.random().toString(36).substring(2, 15));
  const handleCreateRoom = (roomCode, hostName) => {
    const newRoom = {
      code: roomCode,
      host: hostName,
      hostId: userId,
      participants: [{ id: userId, name: hostName }],
      songs: [],
      currentGame: null,
      gameState: "waiting",
    };
    setRoomData(newRoom);
    setCurrentView("game");
  };
  const handleJoinRoom = (roomCode, playerName) => {
    const joinedRoom = {
      code: roomCode,
      host: "Demo Host",
      participants: [
        { id: "demoUser1", name: "Demo User 1" },
        { id: userId, name: playerName },
      ],
      songs: [],
      currentGame: null,
      gameState: "waiting",
    };
    setRoomData(joinedRoom);
    setCurrentView("game");
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
            onLeaveRoom={() => setCurrentView("home")}
          />
        );
      default:
        return (
          <div className="home-screen">
            <div className="container">
              <h1>🎵 Emoji Song Guess</h1>
              <p>
                Create a room, add YouTube songs, and let AI generate emoji
                clues!
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
        );
    }
  };
  return <div className="App">{renderCurrentView()}</div>;
}
