import type { Card } from "../types"

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
      <svg>
        <rect
          x="100"
          y="20"
          width="100"
          height="60"
          rx="15"
          ry="15"
          fill="white"
          stroke="black"
          strokeWidth="2"
        />
      </svg>
    </div>
    )
  }
  return (
    <div onClick={() => selectCard && selectCard(card)}>
      <svg>
        <rect
          x="100"
          y="20"
          width="100"
          height="60"
          rx="15"
          ry="15"
          fill={getColor(card)}
          stroke="black"
          strokeWidth="2"
        />
        <text x="150" y="50" fill="black">{card.rank}</text>
      </svg>
    </div>
  );
}
