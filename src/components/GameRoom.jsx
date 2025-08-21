import React, { useState, useEffect } from "react";
import SongManager from "./SongManager";
import GamePlay from "./GamePlay";
import FirebaseService from "../firebase/firbaseService";

const GameRoom = ({ roomData, userId, onLeaveRoom }) => {
  const [room, setRoom] = useState(roomData);
  const [currentView, setCurrentView] = useState("songs");
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  const isHost = userId === room.hostId;

  useEffect(() => {
    // Save room data to localStorage for persistence
    localStorage.setItem(
      "currentRoom",
      JSON.stringify({
        roomData: room,
        userId,
        currentView,
      })
    );
  }, [room, userId, currentView]);

  useEffect(() => {
    // Subscribe to real-time room updates
    setLoading(true);
    const unsubscribe = FirebaseService.subscribeToRoom(
      room.code,
      (updatedRoom) => {
        if (updatedRoom) {
          console.log("Room updated from Firebase:", updatedRoom);
          setRoom(updatedRoom);
          setIsConnected(true);
          setLoading(false);

          // Auto-switch to game view if host starts the game
          if (updatedRoom.gameState === "playing" && currentView === "songs") {
            setCurrentView("game");
          }
        } else {
          // Room was deleted
          setIsConnected(false);
          setLoading(false);
          localStorage.removeItem("currentRoom");
          alert("Room no longer exists");
          onLeaveRoom();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [room.code, currentView, onLeaveRoom]);

  const removeSong = async (songId) => {
    const result = await FirebaseService.removeSong(room.code, songId);
    if (!result.success) {
      alert(result.error || "Failed to remove song");
    }
  };

  const startGame = async () => {
    if (room.songs && Object.keys(room.songs).length > 0) {
      const result = await FirebaseService.startGame(room.code, room.songs);
      if (result.success) {
        setCurrentView("game");
      } else {
        alert(result.error || "Failed to start game");
      }
    } else {
      alert("Please add some songs before starting the game!");
    }
  };

  const handleLeaveRoom = async () => {
    localStorage.removeItem("currentRoom");
    await FirebaseService.leaveRoom(room.code, userId);
    onLeaveRoom();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    alert("Room code copied to clipboard!");
  };

  const shareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join my Emoji Song Guess game!",
        text: `Use code: ${room.code}`,
        url: window.location.href,
      });
    } else {
      copyRoomCode();
    }
  };

  if (!isConnected) {
    return (
      <div className="screen-container">
        <div className="content-wrapper">
          <div className="card">
            <div className="connection-error">
              <h2>⚠️ Connection Lost</h2>
              <p>
                Unable to connect to the room. Please check your internet
                connection.
              </p>
              <button onClick={onLeaveRoom} className="btn btn-primary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen-container">
        <div className="content-wrapper">
          <div className="card">
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Loading room...</h3>
              <p>Syncing with other players...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert participants object to array for display
  const participantsArray = room.participants
    ? Object.values(room.participants)
    : [];

  return (
    <div className="game-room">
      <div className="room-header">
        <div className="room-info">
          <h2>
            Room: <span className="room-code">{room.code}</span>
          </h2>
          <div className="room-actions">
            <button className="copy-code-btn" onClick={shareRoom}>
              📤 Share
            </button>
            <button className="copy-code-btn" onClick={copyRoomCode}>
              📋 Copy Code
            </button>
          </div>
        </div>

        <div className="participants">
          <h3>Players ({participantsArray.length})</h3>
          <div className="participant-list">
            {participantsArray.map((participant) => (
              <span key={participant.id} className="participant">
                {participant.name} {participant.id === room.hostId && "👑"}
              </span>
            ))}
          </div>
        </div>

        <button className="leave-btn" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="game-content">
        {currentView === "songs" ? (
          <SongManager
            songs={room.songs || {}}
            onRemoveSong={removeSong}
            onStartGame={startGame}
            isHost={isHost}
          />
        ) : (
          <GamePlay
            room={room}
            userId={userId}
            onBackToSongs={() => setCurrentView("songs")}
            isHost={isHost}
          />
        )}
      </div>
    </div>
  );
};

export default GameRoom;
