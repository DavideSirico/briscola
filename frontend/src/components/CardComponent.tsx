import type { Card } from "@shared/types";
import card_back_01 from "../assets/card_back_01.svg"

type CardProps = {
  card?: Card,
  selectCard?: (card: Card) => void
};

const getColor = (card: Card): string => {
  if(card == null || card == undefined) {
    return "white";
  }
  switch (card.suit) {
    case "Spade": return "#00DDFF";
    case "Bastoni": return "brown";
    case "Denari": return "yellow";
    case "Coppe": return "green";
    default: return "white";
  }
}

export default function CardComponent({ card, selectCard }: CardProps) {
  if(card == undefined) {
    return (
      <div>
        <img width="138px" height="200px" src={card_back_01}></img>
      </div>
    )
  }
  return (
    <div onClick={() => selectCard && selectCard(card)}>
      <svg>
        <rect
          x="10"
          y="10"
          width="138px"
          height="200px"
          rx="15"
          ry="15"
          fill={getColor(card)}
          stroke="black"
          strokeWidth="2"
        />
        <text x="10" y="10" fill="black">{card.rank}</text>
      </svg>
    </div>
  );
}
