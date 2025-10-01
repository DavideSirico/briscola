import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { socketService } from "../services/socketService";

export default function Homepage() {
  const [playerName, setPlayerName] = useState<string>("");
  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  const createLobby = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name!");
      return;
    }

    if (isConnecting) return;
    setIsConnecting(true);

    try {
      // Use the shared socket service
      const socket = await socketService.connect();
      socketRef.current = socket;

      // Set up event listeners
      const onLobbyCreated = (data: { lobbyId: number }) => {
        console.log('Lobby created:', data);
        localStorage.setItem('playerName', playerName);
        setIsConnecting(false);

        // Clean up listeners
        socket.off('lobby-created', onLobbyCreated);
        socket.off('error', onError);

        navigate(`/game/${data.lobbyId}/${encodeURIComponent(playerName)}`);
      };

      const onError = (error: { message: string }) => {
        console.error('Error creating lobby:', error);
        alert(error.message || "Failed to create lobby");
        setIsConnecting(false);

        // Clean up listeners
        socket.off('lobby-created', onLobbyCreated);
        socket.off('error', onError);
      };

      socket.on('lobby-created', onLobbyCreated);
      socket.on('error', onError);

      // Create the lobby
      socket.emit('create-lobby', { playerName });
    } catch (error) {
      console.error('Failed to connect:', error);
      alert("Failed to connect to server");
      setIsConnecting(false);
    }
  };

  const joinLobby = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name!");
      return;
    }

    if (!lobbyCode.trim()) {
      alert("Please enter a lobby code!");
      return;
    }

    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const socket = await socketService.connect();
      socketRef.current = socket;

      // Set up event listeners
      const onLobbyJoined = (data: { success: boolean; playersCount: number; gameStarted: boolean }) => {
        console.log('Joined lobby:', data);
        localStorage.setItem('playerName', playerName);
        setIsConnecting(false);

        // Clean up listeners
        socket.off('lobby-joined', onLobbyJoined);
        socket.off('error', onError);

        navigate(`/game/${lobbyCode}/${encodeURIComponent(playerName)}`);
      };

      const onError = (error: { message: string }) => {
        console.error('Error joining lobby:', error);
        let errorMessage = "Failed to join lobby";

        if (error.message === "Game not found") {
          errorMessage = "Lobby not found. Please check the lobby code.";
        } else if (error.message === "Game is full") {
          errorMessage = "This lobby is already full (2/2 players).";
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert(errorMessage);
        setIsConnecting(false);

        // Clean up listeners
        socket.off('lobby-joined', onLobbyJoined);
        socket.off('error', onError);
      };

      socket.on('lobby-joined', onLobbyJoined);
      socket.on('error', onError);

      // Join the lobby
      socket.emit('join-lobby', {
        lobbyId: Number(lobbyCode),
        playerName
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      alert("Failed to connect to server");
      setIsConnecting(false);
    }
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <h1>Briscola</h1>
        <div className="player-setup">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            id="playerName"
            onChange={(e) => setPlayerName(e.target.value)}
            className="player-input"
          />
          <button
            onClick={createLobby}
            className="create-lobby-btn"
            disabled={!playerName.trim() || isConnecting}
          >
            {isConnecting ? "Creating..." : "Create Lobby"}
          </button>
          <div
          className="lobby-container"
          >

            <input
              type="text"
              placeholder="Enter lobby code"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              className="player-input"
              id="lobbyCode"
              disabled={isConnecting}
            />
            <button
              onClick={joinLobby}
              className="join-lobby-btn"
              disabled={!playerName.trim() || !lobbyCode.trim() || isConnecting}
            >
              {isConnecting ? "Joining..." : "Join Lobby"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}