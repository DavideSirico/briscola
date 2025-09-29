import type { Card, Suit, Game, Player } from "./types.ts"

function createDeck(): Card[] {
  const suits: Suit[] = ["Bastoni", "Coppe", "Denari", "Spade"];
  let deck: Card[] = [];

  for (const suit of suits) {
    for (let rank = 1; rank <= 10; rank++) {
      let point;
      switch (rank) {
        case 1: point = 11; break;
        case 3: point = 10; break;
        case 8: point = 2; break;
        case 9: point = 3; break;
        case 10: point = 4; break;
        default: point = 0; break;
      }
      deck.push({ suit, rank, point });
    }
  }

  deck = [
    {
      suit: "Bastoni",
      rank: 1,
      point: 11
    },
    {
      suit: "Bastoni",
      rank: 2,
      point: 0
    },
    {
      suit: "Bastoni",
      rank: 3,
      point: 10
    },
    {
      suit: "Spade",
      rank: 1,
      point: 11
    },
    {
      suit: "Spade",
      rank: 2,
      point: 0
    },
    {
      suit: "Spade",
      rank: 3,
      point: 10
    }
  ]

  return deck;
}

function shuffleArray<T extends {}>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function getDeck() {
  return shuffleArray(createDeck());
}

export function dealInitialHands(game: Game): void {
  const cardsPerPlayer = 3;
  
  // Deal 3 cards to each player
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (const player of game.players) {
      const card = game.deck.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  }
}

export function determineRoundWinner(game: Game): Player {
  if (game.playedCards.length !== 2) {
    throw new Error("Round must have exactly 2 played cards");
  }
  
  const firstCard = game.playedCards[0]!;
  const secondCard = game.playedCards[1]!;
  
  // Check if either card is briscola (trump)
  const firstIsBriscola = firstCard.card.suit === game.briscola.suit;
  const secondIsBriscola = secondCard.card.suit === game.briscola.suit;
  
  // If one is briscola and other isn't, briscola wins
  if (firstIsBriscola && !secondIsBriscola) {
    return game.players.find(p => p.name === firstCard.player)!;
  }
  if (secondIsBriscola && !firstIsBriscola) {
    return game.players.find(p => p.name === secondCard.player)!;
  }
  
  // If both are briscola or neither, higher rank wins
  if (firstCard.card.suit == secondCard.card.suit) {
    if (firstCard.card.point > secondCard.card.point) {
        return game.players.find(p => p.name === firstCard.player)!;
    } else {
        return game.players.find(p => p.name === secondCard.player)!;
    }
  }

  return game.players.find(p => p.name === firstCard.player)!;
}

export function dealNewCards(game: Game): void {
  // Only deal if there are cards left in deck
  if (game.deck.length === 0) return;
  
  // Deal one card to each player (winner first, then other player)
  for (const player of game.players) {
    if (game.deck.length > 0 && player.hand.length < 3) {
      const newCard = game.deck.pop();
      if (newCard) {
        player.hand.push(newCard);
      }
    }
  }
}