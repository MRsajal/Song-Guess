import { database } from "./firebase-config";
import {
  ref,
  push,
  set,
  get,
  onValue,
  remove,
  serverTimestamp,
  update,
} from "firebase/database";

class FirebaseService {
  // Generate safe user ID (no dots or invalid characters)
  static generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique room code
  static generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Create a new room
  static async createRoom(hostName, userId, initialSongs = []) {
    try {
      let roomCode;
      let codeExists = true;

      // Generate unique room code
      while (codeExists) {
        roomCode = this.generateRoomCode();
        const roomSnapshot = await get(ref(database, `rooms/${roomCode}`));
        codeExists = roomSnapshot.exists();
      }

      // Clean userId to ensure it's Firebase-safe
      const safeUserId = userId.replace(/[.#$\/\[\]]/g, "_");

      const roomData = {
        code: roomCode,
        host: hostName,
        hostId: safeUserId,
        participants: {
          [safeUserId]: {
            id: safeUserId,
            name: hostName,
            joinedAt: serverTimestamp(),
          },
        },
        songs: {},
        currentGame: null,
        gameState: "waiting",
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      };

      // Add initial songs if provided
      if (initialSongs.length > 0) {
        initialSongs.forEach((song, index) => {
          const songId = `song_${Date.now()}_${index}`;
          roomData.songs[songId] = {
            ...song,
            id: songId,
            addedAt: serverTimestamp(),
          };
        });
      }

      await set(ref(database, `rooms/${roomCode}`), roomData);

      return {
        success: true,
        roomCode,
        roomData: {
          ...roomData,
          participants: {
            [safeUserId]: {
              id: safeUserId,
              name: hostName,
              joinedAt: Date.now(),
            },
          },
        },
      };
    } catch (error) {
      console.error("Error creating room:", error);
      return {
        success: false,
        error: "Failed to create room",
      };
    }
  }

  // Join an existing room
  static async joinRoom(roomCode, playerName, userId) {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const roomSnapshot = await get(roomRef);

      if (!roomSnapshot.exists()) {
        return {
          success: false,
          error: "Room not found",
        };
      }

      const roomData = roomSnapshot.val();

      // Clean userId to ensure it's Firebase-safe
      const safeUserId = userId.replace(/[.#$\/\[\]]/g, "_");

      // Add participant to room
      await update(
        ref(database, `rooms/${roomCode}/participants/${safeUserId}`),
        {
          id: safeUserId,
          name: playerName,
          joinedAt: serverTimestamp(),
        }
      );

      // Update last activity
      await update(ref(database, `rooms/${roomCode}`), {
        lastActivity: serverTimestamp(),
      });

      return {
        success: true,
        roomData: {
          ...roomData,
          participants: {
            ...roomData.participants,
            [safeUserId]: {
              id: safeUserId,
              name: playerName,
              joinedAt: Date.now(),
            },
          },
        },
      };
    } catch (error) {
      console.error("Error joining room:", error);
      return {
        success: false,
        error: "Failed to join room",
      };
    }
  }

  // Add song to room
  static async addSong(roomCode, song) {
    try {
      const songId = `song_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await set(ref(database, `rooms/${roomCode}/songs/${songId}`), {
        ...song,
        id: songId,
        addedAt: serverTimestamp(),
      });

      await update(ref(database, `rooms/${roomCode}`), {
        lastActivity: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error adding song:", error);
      return { success: false, error: "Failed to add song" };
    }
  }

  // Remove song from room
  static async removeSong(roomCode, songId) {
    try {
      await remove(ref(database, `rooms/${roomCode}/songs/${songId}`));
      await update(ref(database, `rooms/${roomCode}`), {
        lastActivity: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error removing song:", error);
      return { success: false, error: "Failed to remove song" };
    }
  }

  // Start game
  static async startGame(roomCode, songs) {
    try {
      // Shuffle songs
      const songsArray = Object.values(songs);
      const shuffledSongs = songsArray.sort(() => Math.random() - 0.5);

      const gameData = {
        currentSongIndex: 0,
        scores: {},
        startTime: serverTimestamp(),
        currentEmojis: "",
        gamePhase: "loading",
        timeLeft: 30,
        currentSongTitle: shuffledSongs[0]?.title || "",
        shuffledSongs: shuffledSongs,
      };

      await update(ref(database, `rooms/${roomCode}`), {
        gameState: "playing",
        currentGame: gameData,
        lastActivity: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error starting game:", error);
      return { success: false, error: "Failed to start game" };
    }
  }

  // Update game state
  static async updateGameState(roomCode, updates) {
    try {
      const updateData = {};
      Object.keys(updates).forEach((key) => {
        updateData[`currentGame/${key}`] = updates[key];
      });
      updateData.lastActivity = serverTimestamp();

      await update(ref(database, `rooms/${roomCode}`), updateData);
      return { success: true };
    } catch (error) {
      console.error("Error updating game state:", error);
      return { success: false, error: "Failed to update game state" };
    }
  }

  // Listen to room changes
  static subscribeToRoom(roomCode, callback) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  }

  // Leave room
  static async leaveRoom(roomCode, userId) {
    try {
      // Clean userId to ensure it's Firebase-safe
      const safeUserId = userId.replace(/[.#$\/\[\]]/g, "_");

      await remove(
        ref(database, `rooms/${roomCode}/participants/${safeUserId}`)
      );

      // Check if room is empty, if so delete it
      const roomSnapshot = await get(
        ref(database, `rooms/${roomCode}/participants`)
      );
      if (!roomSnapshot.exists()) {
        await remove(ref(database, `rooms/${roomCode}`));
      } else {
        await update(ref(database, `rooms/${roomCode}`), {
          lastActivity: serverTimestamp(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error leaving room:", error);
      return { success: false, error: "Failed to leave room" };
    }
  }

  // Submit guess
  static async submitGuess(roomCode, userId, userGuess, songTitle) {
    try {
      // Clean userId to ensure it's Firebase-safe
      const safeUserId = userId.replace(/[.#$\/\[\]]/g, "_");

      const isCorrect = userGuess.toLowerCase().trim() === songTitle.toLowerCase().trim();
      
      const guessData = {
        userId: safeUserId,
        guess: userGuess,
        timestamp: serverTimestamp(),
        correct: isCorrect,
      };

      // Get current guesses to determine attempt number
      const guessesRef = ref(database, `rooms/${roomCode}/currentGame/guesses`);
      const guessesSnapshot = await get(guessesRef);
      const existingGuesses = guessesSnapshot.exists() ? Object.values(guessesSnapshot.val()) : [];
      
      // Count user's previous attempts for this song
      const userAttempts = existingGuesses.filter(g => g.userId === safeUserId).length;
      const attemptNumber = userAttempts + 1;
      
      guessData.attemptNumber = attemptNumber;

      // If correct, calculate points based on attempt number
      if (isCorrect) {
        const points = this.calculatePoints(attemptNumber);
        guessData.points = points;
        
        // Update user's total score
        await this.updatePlayerScore(roomCode, safeUserId, points);
      }

      await push(ref(database, `rooms/${roomCode}/currentGame/guesses`), guessData);
      
      return { 
        success: true, 
        correct: isCorrect, 
        points: isCorrect ? guessData.points : 0,
        attemptNumber 
      };
    } catch (error) {
      console.error("Error submitting guess:", error);
      return { success: false, error: "Failed to submit guess" };
    }
  }

  // Calculate points based on attempt number
  static calculatePoints(attemptNumber) {
    switch (attemptNumber) {
      case 1: return 100; // First try
      case 2: return 75;  // Second try
      case 3: return 50;  // Third try
      case 4: return 25;  // Fourth try
      default: return 10; // Fifth try and beyond
    }
  }

  // Update player's total score
  static async updatePlayerScore(roomCode, userId, points) {
    try {
      const scoreRef = ref(database, `rooms/${roomCode}/currentGame/scores/${userId}`);
      const scoreSnapshot = await get(scoreRef);
      const currentScore = scoreSnapshot.exists() ? scoreSnapshot.val() : 0;
      
      await set(scoreRef, currentScore + points);
      return { success: true };
    } catch (error) {
      console.error("Error updating player score:", error);
      return { success: false, error: "Failed to update score" };
    }
  }

  // Get final scores for leaderboard
  static async getFinalScores(roomCode) {
    try {
      const scoresRef = ref(database, `rooms/${roomCode}/currentGame/scores`);
      const participantsRef = ref(database, `rooms/${roomCode}/participants`);
      
      const [scoresSnapshot, participantsSnapshot] = await Promise.all([
        get(scoresRef),
        get(participantsRef)
      ]);
      
      const scores = scoresSnapshot.exists() ? scoresSnapshot.val() : {};
      const participants = participantsSnapshot.exists() ? participantsSnapshot.val() : {};
      
      // Create leaderboard array
      const leaderboard = Object.keys(participants).map(userId => ({
        userId,
        name: participants[userId].name,
        score: scores[userId] || 0
      }));
      
      // Sort by score (highest first)
      leaderboard.sort((a, b) => b.score - a.score);
      
      return { success: true, leaderboard };
    } catch (error) {
      console.error("Error getting final scores:", error);
      return { success: false, error: "Failed to get final scores" };
    }
  }
}

export default FirebaseService;
