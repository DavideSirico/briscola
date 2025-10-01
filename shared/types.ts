export type Card = {
    suit: Suit,
    rank: number,
    point: number
};

export type Suit = "Bastoni" | "Coppe" | "Denari" | "Spade";

export type Player = {
  name: string,
  hand: Card[],
  wonCards: Card[]
}

export type Game = {
  id: number,
  players: Player[],
  playerTurn: number,
  deck: Card[],
  briscola: Card,
  started: boolean,
  playedCards: { player: string, card: Card }[], // Cards played in current round
  roundInProgress: boolean
}
