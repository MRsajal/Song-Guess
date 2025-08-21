import React, { useState } from "react";
import SongManager from "./SongManager";
import GamePlay from "./GamePlay";

const GameRoom = ({ roomData, userId, onLeaveRoom }) => {
  const [room, setRoom] = useState(roomData);
  const [currentView, setCurrentView] = useState("songs");
  const [roomState, setRoomState] = useState("songs");

  const isHost = userId === room.hostId;

  const addSong = (song) => {
    setRoom((prev) => ({
      ...prev,
      songs: [...prev.songs, { ...song, id: Date.now() }],
    }));
  };

  const removeSong = (songId) => {
    setRoom((prev) => ({
      ...prev,
      songs: prev.songs.filter((song) => song.id !== songId),
    }));
  };

  const startGame = () => {
    if (room.songs.length > 0) {
      const shuffledSongs = [...room.songs].sort(() => Math.random() - 0.5);

      setCurrentView("game");
      setRoomState("playing");
      setRoom((prev) => ({
        ...prev,
        songs: shuffledSongs,
        gameState: "playing",
        currentGame: {
          currentSongIndex: 0,
          scores: {},
          startTime: Date.now(),
          currentEmojis: "", // Add this to store current emojis
          currentSongTitle: shuffledSongs[0]?.title || "",
        },
      }));
    }
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

  const updateGameState = (newGameState) => {
    setRoom((prev) => ({
      ...prev,
      currentGame: {
        ...prev.currentGame,
        ...newGameState,
      },
    }));
  };

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
          <h3>Players ({room.participants.length})</h3>
          <div className="participant-list">
            {room.participants.map((participant) => (
              <span key={participant.id} className="participant">
                {participant.name} {participant.id === room.hostId && "👑"}
              </span>
            ))}
          </div>
        </div>

        <button className="leave-btn" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="game-content">
        {currentView === "game" ? (
          <GamePlay
            room={room}
            onBackToSongs={() => setCurrentView("songs")}
            onUpdateGameState={updateGameState} // Add this prop
            isHost={isHost}
          />
        ) : (
          <SongManager
            songs={room.songs}
            onAddSong={addSong}
            onRemoveSong={removeSong}
            onStartGame={startGame}
            isHost={isHost}
          />
        )}
      </div>
    </div>
  );
};

export default GameRoom;
