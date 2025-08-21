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

      const roomData = {
        code: roomCode,
        host: hostName,
        hostId: userId,
        participants: {
          [userId]: {
            id: userId,
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
        roomData,
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

      // Add participant to room
      await update(ref(database, `rooms/${roomCode}/participants/${userId}`), {
        id: userId,
        name: playerName,
        joinedAt: serverTimestamp(),
      });

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
            [userId]: {
              id: userId,
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
      const songId = `song_${Date.now()}_${Math.random()}`;
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
      await remove(ref(database, `rooms/${roomCode}/participants/${userId}`));

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
      const guessData = {
        userId,
        guess: userGuess,
        timestamp: serverTimestamp(),
        correct:
          userGuess.toLowerCase().trim() === songTitle.toLowerCase().trim(),
      };

      await push(
        ref(database, `rooms/${roomCode}/currentGame/guesses`),
        guessData
      );
      return { success: true, correct: guessData.correct };
    } catch (error) {
      console.error("Error submitting guess:", error);
      return { success: false, error: "Failed to submit guess" };
    }
  }
}

export default FirebaseService;
