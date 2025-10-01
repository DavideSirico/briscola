import CardComponent from "./CardComponent";
import type { Card } from '@shared/types';

type PlayedCard = {
  player: string;
  card: Card;
};

type PozzoProps = {
  cards: PlayedCard[];
};

export default function Pozzo({ cards }: PozzoProps) {
  return (
    <div
      className="pozzo"
      style={{
        border: "2px dashed black",
        textAlign: "center",
        height: "30%",
        width: "30%"
      }}
    >
      <p>Pozzo (Played Cards)</p>
      <div className="cards-container">
        {cards.map((playedCard, i) => (
          <div key={i} style={{ position: "relative", margin: "5px" }}>
            <CardComponent card={playedCard.card} />
            <div style={{ 
                fontSize: "12px", 
                fontWeight: "bold", 
                marginTop: "5px",
                color: "#333"
              }}>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
