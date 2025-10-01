import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

import type { Card, Game, Player } from "./types.ts";
import { getDeck, dealInitialHands, determineRoundWinner, dealNewCards } from "./utils.js"

const app = express();
app.use(cors());
app.use(express.json());
const server = createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: ["http://localhost:3001", "http://server1:5173", "https://briscola.sirico.dev"], // frontend URLs
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});


let games: Game[] = [];

const socketPlayerMap = new Map<string, { gameId: number, playerName: string }>();


io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);
  
  // Create new lobby
  socket.on('create-lobby', (data: { playerName: string }) => {
    const { playerName } = data;
    
    console.log(`${playerName} is creating a new lobby...`);
    
    if (!playerName) {
      socket.emit('error', { message: "Player name is required" });
      return;
    }
    
    const newId = games.length > 0 ? games[games.length - 1]!.id + 1 : 1;
    const deck = getDeck();
    const briscola: Card = deck[0]!;
    
    const newPlayer: Player = {
      name: playerName,
      hand: [],
      wonCards: []
    };
    
    const newGame: Game = {
      id: newId,
      players: [newPlayer],
      playerTurn: 0,
      deck,
      briscola,
      started: false,
      playedCards: [],
      roundInProgress: false
    };
    
    dealInitialHands(newGame);
    games.push(newGame);
    
    console.log(`Lobby ${newId} created successfully by ${playerName}`);
    
    socket.emit('lobby-created', { lobbyId: newId });
  });
  
  // Join existing lobby
  socket.on('join-lobby', (data: { lobbyId: number, playerName: string }) => {
    const { lobbyId, playerName } = data;
    
    console.log(`${playerName} is trying to join lobby ${lobbyId}...`);
    
    const game = games.find(g => g.id === lobbyId);
    if (!game) {
      console.log(`Lobby ${lobbyId} not found`);
      socket.emit('error', { message: "Game not found" });
      return;
    }
    
    if (game.players.length >= 2) {
      console.log(`Lobby ${lobbyId} is full`);
      socket.emit('error', { message: "Game is full" });
      return;
    }
    
    if (!playerName) {
      socket.emit('error', { message: "Player name is required" });
      return;
    }
    
    const newPlayer: Player = {
      name: playerName,
      hand: [],
      wonCards: []
    };
    
    game.players.push(newPlayer);
    
    // Deal cards to the new player
    if (game.players.length === 2) {
      for (let i = 0; i < 3; i++) {
        const card = game.deck.pop();
        if (card) {
          newPlayer.hand.push(card);
        }
      }
      game.started = true;
      console.log(`Game ${lobbyId} is now ready to start! Both players joined.`);
    }
    
    console.log(`${playerName} successfully joined lobby ${lobbyId} (${game.players.length}/2 players)`);
    
    // Join the game room
    socket.join(`game-${lobbyId}`);
    
    // Store the socket-to-player mapping
    socketPlayerMap.set(socket.id, { gameId: lobbyId, playerName });
    
    // Notify all players in the game
    io.to(`game-${lobbyId}`).emit('player-joined', {
      playersCount: game.players.length,
      gameStarted: game.started
    });
    
    socket.emit('lobby-joined', { 
      success: true, 
      playersCount: game.players.length,
      gameStarted: game.started 
    });
  });
  
  // Join game room for existing players
  socket.on('join-game', (data: { gameId: number, playerName: string }) => {
    const { gameId, playerName } = data;
    console.log(`${playerName} is joining game room ${gameId} for real-time updates...`);
    
    socket.join(`game-${gameId}`);
    
    // Store the socket-to-player mapping
    socketPlayerMap.set(socket.id, { gameId, playerName });
    
    // Send current game state to the player
    const game = games.find(g => g.id === gameId);
    if (game) {
      const player = game.players.find(p => p.name === playerName);
      if (player) {
        console.log(`Sending current game state to ${playerName}`);
        socket.emit('game-state', {
          playerHand: player.hand,
          briscola: game.briscola,
          gameStarted: game.started,
          playersCount: game.players.length,
          currentTurn: game.playerTurn,
          currentPlayerName: game.players[game.playerTurn]?.name,
          roundInProgress: game.roundInProgress,
          playedCards: game.playedCards
        });
      } else {
        console.log(`Player ${playerName} not found in game ${gameId}`);
        socket.emit('error', { message: "Player not found in this game" });
      }
    } else {
      console.log(`Game ${gameId} not found`);
      socket.emit('error', { message: "Game not found" });
    }
  });
  
  // Handle card play
  socket.on('play-card', (data: { gameId: number, playerName: string, card: Card }) => {
    const { gameId, playerName, card } = data;
    
    const game = games.find(g => g.id === gameId);
    if (!game) {
      socket.emit('error', { message: "Game not found" });
      return;
    }
    
    const player = game.players.find(p => p.name === playerName);
    if (!player) {
      socket.emit('error', { message: "Player not found in this game" });
      return;
    }
    
    if (!game.started || game.players.length < 2) {
      socket.emit('error', { message: "Game not ready" });
      return;
    }
    
    // Check if it's the player's turn
    const currentPlayer = game.players[game.playerTurn];
    if (currentPlayer?.name !== playerName) {
      socket.emit('error', { message: "Not your turn" });
      return;
    }
    
    // Check if player has the card
    const cardIndex = player.hand.findIndex(c => 
      c.suit === card.suit && c.rank === card.rank
    );
    if (cardIndex === -1) {
      socket.emit('error', { message: "Card not in hand" });
      return;
    }
    
    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);
    
    // Add card to played cards
    game.playedCards.push({ player: playerName, card });
    
    console.log(`${playerName} played ${card.rank} of ${card.suit}`);
    
    // Broadcast the updated game state to all players in the room
    io.to(`game-${gameId}`).emit('game-state-update', {
      playedCards: game.playedCards,
      roundInProgress: game.roundInProgress,
      currentTurn: game.playerTurn,
      currentPlayerName: game.players[game.playerTurn]?.name
    });
    
    // If this is the first card of the round
    if (game.playedCards.length === 1) {
      // Switch to next player's turn
      game.playerTurn = (game.playerTurn + 1) % 2;
      game.roundInProgress = true;
      
      // Broadcast turn change
      io.to(`game-${gameId}`).emit('game-state-update', {
        playedCards: game.playedCards,
        roundInProgress: game.roundInProgress,
        currentTurn: game.playerTurn,
        currentPlayerName: game.players[game.playerTurn]?.name
      });
      
      socket.emit('card-played', {
        message: "Card played, waiting for other player",
        playedCards: game.playedCards
      });
      return;
    }
    
    // If both players have played (round complete)
    if (game.playedCards.length === 2) {
      // Determine winner
      const winner = determineRoundWinner(game);
      
      // Give won cards to winner
      winner.wonCards.push(...game.playedCards.map(pc => pc.card));
      
      console.log(`Round winner: ${winner.name}`);


      // check if every player has no cards left
      if (game.players.every(p => p.hand.length === 0)) {
        console.log(`Game ${gameId} over. Final scores:`);
        game.players.forEach(p => {
          const score = p.wonCards.reduce((sum, c) => sum + c.point, 0);
          console.log(`${p.name}: ${score} points`);

        });
        // Optionally, you could emit a 'game-over' event here
        io.to(`game-${gameId}`).emit('game-over', {
          scores: game.players.map(p => ({
            name: p.name,
            score: p.wonCards.reduce((sum, c) => sum + c.point, 0)
          }))
        });
        return; // End the function to prevent dealing new cards
      }


      // Deal new cards to both players
      dealNewCards(game);
      
      // Winner starts next round
      game.playerTurn = game.players.findIndex(p => p.name === winner.name);
      
      // Reset round state
      game.playedCards = [];
      game.roundInProgress = false;
      
      // Broadcast round completion to all players
      io.to(`game-${gameId}`).emit('round-complete', {
        winner: winner.name,
        newCardsDealt: game.deck.length > 0,
        playedCards: game.playedCards,
        currentTurn: game.playerTurn,
        currentPlayerName: game.players[game.playerTurn]?.name,
        roundInProgress: game.roundInProgress
      });
      
      // Send updated hands to each player individually
      game.players.forEach(gamePlayer => {
        // Find socket by player name and game ID
        const playerSocketId = [...socketPlayerMap.entries()].find(([socketId, data]) => 
          data.gameId === gameId && data.playerName === gamePlayer.name
        )?.[0];
        
        if (playerSocketId) {
          const playerSocket = io.sockets.sockets.get(playerSocketId);
          if (playerSocket) {
            console.log(`Sending updated hand to ${gamePlayer.name}`);
            playerSocket.emit('hand-update', { hand: gamePlayer.hand });
          }
        } else {
          console.log(`Socket not found for player ${gamePlayer.name} in game ${gameId}`);
        }
      });
      
      socket.emit('card-played', {
        message: "Round complete",
        winner: winner.name,
        newCardsDealt: game.deck.length > 0
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up the socket-to-player mapping
    socketPlayerMap.delete(socket.id);
  });
});

// Simple health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Server is running", gamesCount: games.length });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
