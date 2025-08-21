import React, { useState, useEffect } from "react";
import GeminiService from "./GeminiService";

const GamePlay = ({ room, onBackToSongs, isHost, onUpdateGameState }) => {
  const [currentSong, setCurrentSong] = useState(0);
  const [emojis, setEmojis] = useState("");
  const [userGuess, setUserGuess] = useState("");
  const [gamePhase, setGamePhase] = useState("loading");
  const [timeLeft, setTimeLeft] = useState(30);
  const [scores, setScores] = useState({});
  const [isGeneratingEmojis, setIsGeneratingEmojis] = useState(false);

  useEffect(() => {
    generateEmojisForCurrentSong();
  }, [currentSong]);

  useEffect(() => {
    if (gamePhase === "guessing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === "guessing") {
      setGamePhase("revealing");
    }
  }, [timeLeft, gamePhase]);

  const generateEmojisForCurrentSong = async () => {
    const song = room.songs[currentSong];
    if (!song) return;

    setIsGeneratingEmojis(true);
    setGamePhase("loading");
    //setApiError(null);

    try {
      console.log("Generating emojis for:", song.title);
      const generatedEmojis = await GeminiService.generateEmojis(song.title);
      console.log("Generated emojis:", generatedEmojis);

      setEmojis(generatedEmojis);
      setGamePhase("guessing");
      setTimeLeft(30); // Changed from 60 to 30

      // Share emojis with all players (if host)
      if (isHost && onUpdateGameState) {
        onUpdateGameState({
          currentEmojis: generatedEmojis,
          currentSongIndex: currentSong,
          gamePhase: "guessing",
          timeLeft: 30,
        });
      }
    } catch (error) {
      console.error("Error generating emojis:", error);
      //setApiError(error.message);

      const fallbackEmojis = GeminiService.getFallbackEmojis(song.title);
      setEmojis(fallbackEmojis);
      setGamePhase("guessing");
      setTimeLeft(30); // Changed from 60 to 30

      // Share fallback emojis with all players (if host)
      if (isHost && onUpdateGameState) {
        onUpdateGameState({
          currentEmojis: fallbackEmojis,
          currentSongIndex: currentSong,
          gamePhase: "guessing",
          timeLeft: 30,
        });
      }
    }

    setIsGeneratingEmojis(false);
  };
  useEffect(() => {
    if (!isHost && room.currentGame) {
      const {
        currentEmojis,
        currentSongIndex,
        gamePhase: hostGamePhase,
        timeLeft: hostTimeLeft,
      } = room.currentGame;

      if (currentEmojis && currentSongIndex !== undefined) {
        setCurrentSong(currentSongIndex);
        setEmojis(currentEmojis);
        setGamePhase(hostGamePhase || "guessing");
        setTimeLeft(hostTimeLeft || 30);
      }
    }
  }, [room.currentGame, isHost]);

  useEffect(() => {
    if (gamePhase === "guessing" && timeLeft > 0) {
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);

        // Host updates time for all players
        if (isHost && onUpdateGameState) {
          onUpdateGameState({
            timeLeft: newTimeLeft,
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === "guessing") {
      setGamePhase("revealing");

      // Host updates phase for all players
      if (isHost && onUpdateGameState) {
        onUpdateGameState({
          gamePhase: "revealing",
        });
      }
    }
  }, [timeLeft, gamePhase, isHost, onUpdateGameState]);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (userGuess.trim()) {
      console.log("Guess submitted:", userGuess);
      // Store the guess for later comparison
    }
  };

  const nextSong = () => {
    if (currentSong < room.songs.length - 1) {
      const nextIndex = currentSong + 1;
      setCurrentSong(nextIndex);
      setUserGuess("");

      // Host updates song index for all players
      if (isHost && onUpdateGameState) {
        onUpdateGameState({
          currentSongIndex: nextIndex,
          gamePhase: "loading",
        });
      }
    } else {
      setGamePhase("finished");

      // Host updates phase for all players
      if (isHost && onUpdateGameState) {
        onUpdateGameState({
          gamePhase: "finished",
        });
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (gamePhase === "loading") {
    return (
      <div className="screen-container">
        <div className="content-wrapper">
          <button onClick={onBackToSongs} className="back-btn">
            ← Back to Songs
          </button>
          <div className="card">
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Generating emojis...</h3>
              <p>Creating emoji clues for "{room.songs[currentSong]?.title}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === "finished") {
    return (
      <div className="screen-container">
        <div className="content-wrapper">
          <div className="card">
            <div className="game-finished">
              <div className="finish-icon">🎉</div>
              <h2>Game Finished!</h2>
              <p>You completed all {room.songs.length} songs!</p>
              <button
                onClick={onBackToSongs}
                className="btn btn-primary btn-large"
              >
                🎵 Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="content-wrapper">
        <button onClick={onBackToSongs} className="back-btn">
          ← Back to Songs
        </button>

        <div className="card">
          <div className="game-header">
            <div className="game-progress">
              <h3>
                Song {currentSong + 1} of {room.songs.length}
              </h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentSong + 1) / room.songs.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className={`timer ${timeLeft <= 10 ? "timer-urgent" : ""}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>

          <div className="emoji-display">
            <h2>Guess the song from these emojis:</h2>
            <div className="emojis">{emojis}</div>
          </div>

          {gamePhase === "guessing" && (
            <div className="guess-section">
              <form onSubmit={handleGuessSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    placeholder="Type your guess here..."
                    className="guess-input"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Submit Guess
                </button>
              </form>
            </div>
          )}

          {gamePhase === "revealing" && (
            <div className="reveal-section">
              <h3>⏰ Time's up!</h3>
              <div className="answer-reveal">
                <p>The answer was:</p>
                <h2 className="answer">"{room.songs[currentSong].title}"</h2>
              </div>
              <a
                href={room.songs[currentSong].url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary youtube-link"
              >
                🎵 Listen on YouTube
              </a>
              {isHost && (
                <button
                  onClick={nextSong}
                  className="btn btn-primary btn-large"
                >
                  {currentSong < room.songs.length - 1
                    ? "➡️ Next Song"
                    : "🏁 Finish Game"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
