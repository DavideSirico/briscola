import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import { socketService } from "../services/socketService";
import Pozzo from "./Pozzo";
import CardComponent from "./CardComponent";
import type { Card } from "../types";

export default function Game() {
  const { lobbyId, userName } = useParams<{lobbyId: string, userName: string}>();
  const [pozzoCards, setPozzoCards] = useState<{ player: string, card: Card }[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [briscola, setBriscola] = useState<Card | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playersCount, setPlayersCount] = useState<number>(0);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [roundInProgress, setRoundInProgress] = useState<boolean>(false);
  const [gameMessage, setGameMessage] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const [scorePoints, setScorePoints] = useState<{ name: string, score: number }[]>([]);

  useEffect(() => {
    const playerName = userName || localStorage.getItem('playerName');
    if (!playerName) {
      alert('Player name not found. Please go back to homepage.');
      return;
    }

    const initializeGame = async () => {
      try {
        // Use the shared socket service
        const socket = await socketService.connect();
        socketRef.current = socket;

        // Join the game room
        socket.emit('join-game', { gameId: Number(lobbyId), playerName });

        // Listen for initial game state
        socket.on('game-state', (data: {
          playerHand: Card[];
          briscola: Card;
          gameStarted: boolean;
          playersCount: number;
          currentPlayerName: string;
          playedCards: { player: string, card: Card }[];
          roundInProgress: boolean;
        }) => {
          console.log('Received initial game state:', data);
          setPlayerCards(data.playerHand || []);
          setBriscola(data.briscola);
          setGameStarted(data.gameStarted);
          setPlayersCount(data.playersCount);
          setIsMyTurn(data.currentPlayerName === playerName);
          setPozzoCards(data.playedCards || []);
          setRoundInProgress(data.roundInProgress);
          
          if (!data.gameStarted && data.playersCount < 2) {
            setGameMessage("Waiting for another player...");
          } else if (data.gameStarted) {
            setGameMessage(data.currentPlayerName === playerName ? "Your turn!" : "Opponent's turn");
          }
        });

        // Listen for real-time game state updates
        socket.on('game-state-update', (data: { playedCards: { player: string, card: Card }[], currentPlayerName: string, roundInProgress: boolean }) => {
          console.log('Received game state update:', data);
          setPozzoCards(data.playedCards || []);
          setIsMyTurn(data.currentPlayerName === playerName);
          setRoundInProgress(data.roundInProgress);
          setGameMessage(data.currentPlayerName === playerName ? "Your turn!" : "Opponent's turn");
        });

        // Listen for round completion
        socket.on('round-complete', (data: { playedCards: { player: string, card: Card }[], currentPlayerName: string, roundInProgress: boolean, winner?: string }) => {
          console.log('Round complete:', data);
          setPozzoCards(data.playedCards || []);
          setIsMyTurn(data.currentPlayerName === playerName);
          setRoundInProgress(data.roundInProgress);
          setGameMessage(data.currentPlayerName === playerName ? "Your turn!" : "Opponent's turn");
          
          // Show round winner message
           if (data.winner) {
            setTimeout(() => {
              
            }, 1000);
          }
            
        });

        // Listen for hand updates (when new cards are dealt)
        socket.on('hand-update', (data: { hand: Card[] }) => {
          console.log('Hand updated:', data);
          setPlayerCards(data.hand);
        });

        // Listen for player joins
        socket.on('player-joined', (data: { playersCount: number; gameStarted: boolean }) => {
          console.log('Player joined:', data);
          setPlayersCount(data.playersCount);
          setGameStarted(data.gameStarted);
          
          if (data.gameStarted) {
            setGameMessage("Game started! Your turn!");
          } else {
            setGameMessage("Waiting for another player...");
          }
        });

        socket.on('game-over', (data: { scores: { name: string, score: number }[] }) => {
          console.log('Game finished');
          console.log(data);
          setScorePoints(data.scores);
        }); 

        // Listen for card play confirmations
        socket.on('card-played', (data: { message: string }) => {
          console.log('Card played response:', data);
          setGameMessage(data.message);
        });

        // Listen for errors
        socket.on('error', (error: unknown) => {
          console.error('Socket error:', error);
          if (typeof error === 'object' && error !== null && 'message' in error) {
            alert((error as { message?: string }).message || "An error occurred");
          } else {
            alert("An error occurred");
          }
        });

      } catch (error) {
        console.error('Failed to connect to game:', error);
        alert('Failed to connect to game server');
      }
    };

    initializeGame();

    // Cleanup function - but don't disconnect the shared socket
    return () => {
      if (socketRef.current) {
        // Remove only our event listeners
        socketRef.current.off('game-state');
        socketRef.current.off('game-state-update');
        socketRef.current.off('round-complete');
        socketRef.current.off('hand-update');
        socketRef.current.off('player-joined');
        socketRef.current.off('card-played');
        socketRef.current.off('error');
      }
    };
  }, [lobbyId, userName]);

  const selectCard = (card: Card) => {
    if (!isMyTurn || !gameStarted) {
      alert("It's not your turn or the game hasn't started yet!");
      return;
    }

    const playerName = userName || localStorage.getItem('playerName');
    if (!playerName) {
      alert('Player name not found. Please go back to homepage.');
      return;
    }

    console.log("Playing card:", card);
    
    // Send card play through WebSocket
    if (socketRef.current) {
      socketRef.current.emit('play-card', {
        gameId: Number(lobbyId),
        playerName,
        card
      });

      // Remove card from hand immediately for better UX
      setPlayerCards(prevCards => prevCards.filter(handCard => 
        !(handCard.suit === card.suit && handCard.rank === card.rank)
      ));
    }
  };
  if(scorePoints.length !== 0) {
    console.log(scorePoints);
    
    // Determine the winner
    const winner = scorePoints.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );
    const isWinner = winner.name === (userName || localStorage.getItem('playerName'));
    
    return (
      <div className="game-over-container">
        <div className="game-over-card">
          <h1 className="game-over-title">🎉 Game Over! 🎉</h1>
          
          <div className="winner-announcement">
            <h2 className={`winner-text ${isWinner ? 'you-won' : 'you-lost'}`}>
              {isWinner ? '🏆 You Won!' : `🏆 ${winner.name} Wins!`}
            </h2>
            <p className="winner-score">Final Score: {winner.score} points</p>
          </div>

          <div className="scoreboard">
            <h3>Final Scoreboard</h3>
            <table className="score-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scorePoints
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => {
                    const currentPlayerName = userName || localStorage.getItem('playerName');
                    const isCurrentPlayer = player.name === currentPlayerName;
                    return (
                      <tr key={player.name} className={`score-row ${isCurrentPlayer ? 'current-player' : ''}`}>
                        <td className="rank">
                          {index === 0 ? '🥇' : '🥈'}
                        </td>
                        <td className="player-name">
                          {isCurrentPlayer ? `${player.name} (You)` : player.name}
                        </td>
                        <td className="player-score">{player.score}</td>
                        <td className="player-status">
                          {index === 0 ? 'Winner' : 'Runner-up'}
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>

          <div className="game-actions">
            <button 
              className="home-btn"
              onClick={() => window.location.href = '/'}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="game">
      <div className="game-info">
        <h2>Game {lobbyId ? `- Lobby: ${lobbyId}` : ""}</h2>
        <div className="game-status">
          <p>Players: {playersCount}/2</p>
          {briscola ? <CardComponent card={briscola} /> : <CardComponent />}
          <p>{gameMessage}</p>
          {roundInProgress && <p>Round in progress...</p>}
        </div>
      </div>
      
      <div className="top">
        <div className="cards-container">
          <CardComponent />
          <CardComponent />
          <CardComponent />
        </div>
      </div>
      
      <Pozzo cards={pozzoCards} />
      
      <div className="bottom">
        <div className="cards-container">
          <CardComponent
            card={playerCards[0]}
            selectCard={isMyTurn && gameStarted ? selectCard : undefined}
          />
          <CardComponent
            card={playerCards[1]}
            selectCard={isMyTurn && gameStarted ? selectCard : undefined}
          />
          <CardComponent
            card={playerCards[2]}
            selectCard={isMyTurn && gameStarted ? selectCard : undefined}
          />
        </div>
      </div>
    </div>
  );
}