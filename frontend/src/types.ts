/*
Rifare grafica
Fare pagina fine partita
Aggiungere piú di 2 player in una lobby
*/

export type Card = {
    suit: Suit,
    rank: number,
    point: number
};

export type Suit = "Bastoni" | "Coppe" | "Denari" | "Spade";