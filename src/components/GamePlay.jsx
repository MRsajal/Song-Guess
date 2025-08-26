import React, { useState, useEffect, useCallback } from "react";
import GeminiService from "./GeminiService";
import FirebaseService from "../firebase/firbaseService";

const GamePlay = ({ room, userId, onBackToSongs, isHost }) => {
  const [currentSong, setCurrentSong] = useState(
    room.currentGame?.currentSongIndex || 0
  );
  const [emojis, setEmojis] = useState(room.currentGame?.currentEmojis || "");
  const [userGuess, setUserGuess] = useState("");
  const [gamePhase, setGamePhase] = useState(
    room.currentGame?.gamePhase || "loading"
  );
  const [timeLeft, setTimeLeft] = useState(room.currentGame?.timeLeft || 30);
  const [apiError, setApiError] = useState(null);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [guessResult, setGuessResult] = useState(null);
  const [userAttempts, setUserAttempts] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const songs =
    room.currentGame?.shuffledSongs || Object.values(room.songs || {});

  useEffect(() => {
    // Sync with room's current game state
    if (room.currentGame) {
      setCurrentSong(room.currentGame.currentSongIndex || 0);
      setEmojis(room.currentGame.currentEmojis || "");
      setGamePhase(room.currentGame.gamePhase || "loading");
      setTimeLeft(room.currentGame.timeLeft || 30);
      
      // Reset guess state when song changes
      const newSongIndex = room.currentGame.currentSongIndex || 0;
      if (newSongIndex !== currentSong) {
        setGuessSubmitted(false);
        setGuessResult(null);
        setUserAttempts(0);
        setPointsEarned(0);
        setUserGuess("");
      }
      
      // Count user's attempts for current song
      if (room.currentGame.guesses) {
        const guesses = Object.values(room.currentGame.guesses);
        const userGuessesForCurrentSong = guesses.filter(g => g.userId === userId);
        setUserAttempts(userGuessesForCurrentSong.length);
        
        // Check if user already guessed correctly
        const correctGuess = userGuessesForCurrentSong.find(g => g.correct);
        if (correctGuess) {
          setGuessSubmitted(true);
          setGuessResult(true);
          setPointsEarned(correctGuess.points || 0);
        }
      }
    }
  }, [room.currentGame, userId, currentSong]);

  const generateEmojisForCurrentSong = useCallback(async () => {
    const song = songs[currentSong];
    if (!song) return;

    setApiError(null);

    try {
      console.log("Generating emojis for:", song.title);
      const generatedEmojis = await GeminiService.generateEmojis(song.title);
      console.log("Generated emojis:", generatedEmojis);

      // Update Firebase with generated emojis
      await FirebaseService.updateGameState(room.code, {
        currentEmojis: generatedEmojis,
        gamePhase: "guessing",
        timeLeft: 30,
      });
    } catch (error) {
      console.error("Error generating emojis:", error);
      setApiError(error.message);

      // Use fallback emojis
      const fallbackEmojis = GeminiService.getFallbackEmojis(song.title);
      await FirebaseService.updateGameState(room.code, {
        currentEmojis: fallbackEmojis,
        gamePhase: "guessing",
        timeLeft: 30,
      });
    }
  }, [songs, currentSong, room.code]);

  useEffect(() => {
    // Only host generates emojis
    if (isHost && gamePhase === "loading") {
      generateEmojisForCurrentSong();
    }
  }, [currentSong, isHost, gamePhase, generateEmojisForCurrentSong]);

  useEffect(() => {
    // Load leaderboard when game finishes
    if (gamePhase === "finished" && leaderboard.length === 0) {
      const loadLeaderboard = async () => {
        const scoresResult = await FirebaseService.getFinalScores(room.code);
        if (scoresResult.success) {
          setLeaderboard(scoresResult.leaderboard);
        }
      };
      loadLeaderboard();
    }
  }, [gamePhase, room.code, leaderboard.length]);

  useEffect(() => {
    // Timer countdown - only host manages the timer
    if (isHost && gamePhase === "guessing" && timeLeft > 0) {
      const timer = setTimeout(async () => {
        const newTimeLeft = timeLeft - 1;
        await FirebaseService.updateGameState(room.code, {
          timeLeft: newTimeLeft,
        });

        if (newTimeLeft === 0) {
          await FirebaseService.updateGameState(room.code, {
            gamePhase: "revealing",
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, gamePhase, isHost, room.code]);

  const handleGuessSubmit = async (e) => {
    e.preventDefault();
    if (userGuess.trim() && !guessSubmitted) {
      setGuessSubmitted(true);

      const result = await FirebaseService.submitGuess(
        room.code,
        userId,
        userGuess,
        songs[currentSong]?.title
      );

      if (result.success) {
        setGuessResult(result.correct);
        if (result.correct) {
          setPointsEarned(result.points);
        }
      }
    }
  };

  const nextSong = async () => {
    if (currentSong < songs.length - 1) {
      const nextIndex = currentSong + 1;
      await FirebaseService.updateGameState(room.code, {
        currentSongIndex: nextIndex,
        gamePhase: "loading",
        currentEmojis: "",
        timeLeft: 30,
      });
      setGuessSubmitted(false);
      setGuessResult(null);
      setUserGuess("");
      setUserAttempts(0);
      setPointsEarned(0);
    } else {
      await FirebaseService.updateGameState(room.code, {
        gamePhase: "finished",
      });
      
      // Load final scores
      const scoresResult = await FirebaseService.getFinalScores(room.code);
      if (scoresResult.success) {
        setLeaderboard(scoresResult.leaderboard);
      }
    }
  };

  const retryGeneration = async () => {
    if (isHost) {
      await FirebaseService.updateGameState(room.code, {
        gamePhase: "loading",
      });
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
              <p>Creating emoji clues for "{songs[currentSong]?.title}"</p>
              {isHost && apiError && (
                <div className="api-error">
                  <p className="error-message">⚠️ API Error: {apiError}</p>
                  <p className="error-help">Using fallback emojis instead</p>
                  <button
                    onClick={retryGeneration}
                    className="btn btn-secondary"
                  >
                    🔄 Retry with AI
                  </button>
                </div>
              )}
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
              <p>You completed all {songs.length} songs!</p>
              
              {leaderboard.length > 0 && (
                <div className="leaderboard">
                  <h3>🏆 Final Scores</h3>
                  <div className="leaderboard-list">
                    {leaderboard.map((player, index) => (
                      <div 
                        key={player.userId} 
                        className={`leaderboard-item ${index === 0 ? 'winner' : ''} ${player.userId === userId ? 'current-user' : ''}`}
                      >
                        <div className="rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="player-name">{player.name}</div>
                        <div className="player-score">{player.score} pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={onBackToSongs}
                className="btn btn-primary btn-large"
              >
                🎵 Back to Room
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
                Song {currentSong + 1} of {songs.length}
              </h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentSong + 1) / songs.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="game-stats">
              <div className={`timer ${timeLeft <= 10 ? "timer-urgent" : ""}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              {room.currentGame?.scores && room.currentGame.scores[userId] && (
                <div className="current-score">
                  🏆 Score: {room.currentGame.scores[userId]}
                </div>
              )}
            </div>
          </div>

          <div className="emoji-display">
            <h2>Guess the song from these emojis:</h2>
            <div className="emojis">{emojis}</div>
            {apiError && isHost && (
              <div className="emoji-source">
                <small>Generated using fallback system</small>
                <button onClick={retryGeneration} className="retry-btn">
                  🤖 Try AI Again
                </button>
              </div>
            )}
          </div>

          {gamePhase === "guessing" && (
            <div className="guess-section">
              {userAttempts > 0 && (
                <div className="attempt-info">
                  <p>Attempt #{userAttempts + 1}</p>
                  <div className="points-info">
                    <span>Points for correct answer: </span>
                    <strong>{FirebaseService.calculatePoints(userAttempts + 1)}</strong>
                  </div>
                </div>
              )}
              
              {!guessSubmitted && (
                <form onSubmit={handleGuessSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      value={userGuess}
                      onChange={(e) => setUserGuess(e.target.value)}
                      placeholder="Type your guess here..."
                      className="guess-input"
                      disabled={guessSubmitted}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={guessSubmitted || !userGuess.trim()}
                  >
                    Submit Guess
                  </button>
                </form>
              )}

              {guessResult !== null && (
                <div
                  className={`guess-feedback ${
                    guessResult ? "correct" : "incorrect"
                  }`}
                >
                  {guessResult ? (
                    <div>
                      <div className="feedback-text">✅ Correct!</div>
                      <div className="points-earned">+{pointsEarned} points!</div>
                    </div>
                  ) : (
                    <div className="feedback-text">❌ Not quite right, try again!</div>
                  )}
                </div>
              )}
            </div>
          )}

          {gamePhase === "revealing" && (
            <div className="reveal-section">
              <h3>⏰ Time's up!</h3>
              <div className="answer-reveal">
                <p>The answer was:</p>
                <h2 className="answer">"{songs[currentSong]?.title}"</h2>
              </div>
              <a
                href={songs[currentSong]?.url}
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
                  {currentSong < songs.length - 1
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
