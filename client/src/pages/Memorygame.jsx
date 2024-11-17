import React, { useState, useEffect } from 'react';
import axios from 'axios';  // Import axios to send HTTP requests
import SingleCard from '../components/SingleCard';
import '../styles/MemoryGame.css';

const cardImages = [
  { src: '/img/helmet-1.png', matched: false },
  { src: '/img/potion-1.png', matched: false },
  { src: '/img/ring-1.png', matched: false },
  { src: '/img/scroll-1.png', matched: false },
  { src: '/img/shield-1.png', matched: false },
  { src: '/img/sword-1.png', matched: false },
];

function MemoryGame() {
  const [cards, setCards] = useState([]); // current state of cards after shuffling
  const [turns, setTurns] = useState(0); // track turns count
  const [choice1, setChoice1] = useState(null); // first card choice
  const [choice2, setChoice2] = useState(null); // second card choice
  const [disabled, setDisabled] = useState(false); // disable card clicks during comparison
  const [score, setScore] = useState(0); // Add a state for score
  const [userId, setUserId] = useState(localStorage.getItem('userId')); // Assuming userId is stored in localStorage
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId')); // Assuming sessionId is stored in localStorage

  // Shuffle cards and initialize the game
  const shuffleCards = () => {
    const shuffledCards = [...cardImages, ...cardImages]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ ...card, id: Math.random() }));
    setCards(shuffledCards);
    setTurns(0);
    setScore(0); // Reset score
    flipAllCardsTemporary(shuffledCards); // Show all cards for 5 seconds
  };

  // Flip all cards for 5 seconds when the game starts
  const flipAllCardsTemporary = (shuffledCards) => {
    setTimeout(() => {
      setCards(shuffledCards.map((card) => ({ ...card, flipped: false })));
    }, 5000); // Hide the cards after 5 seconds
    setCards(shuffledCards.map((card) => ({ ...card, flipped: true })));
  };

  // Handle a choice
  const handleChoice = (card) => {
    choice1 ? setChoice2(card) : setChoice1(card); // if choice1 has value then the card clicked is set to choice2
  };

  // Compare 2 selected cards
  useEffect(() => {
    if (choice1 && choice2) {
      setDisabled(true); // Disable further choices until cards are compared
      if (choice1.src === choice2.src) {
        setCards((prevCards) => {
          return prevCards.map((card) => {
            if (card.src === choice1.src) {
              return { ...card, matched: true };
            } else {
              return card;
            }
          });
        });
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choice1, choice2]);

  // Calculate score based on turns
  useEffect(() => {
    const matchedCards = cards.filter(card => card.matched).length;
    if (matchedCards === cardImages.length * 2) { // All cards are matched
      let finalScore = 10;
      if (turns > 9) {
        finalScore -= Math.floor((turns - 9) / 2); // Decrease score gradually for turns over 9
      }
      setScore(finalScore < 0 ? 0 : finalScore); // Ensure score doesn't go below 0
      submitScore(finalScore); // Call submitScore when the game is complete
    }
  }, [cards, turns]);

  // Reset the choices and increase the turn count
  const resetTurn = () => {
    setChoice1(null);
    setChoice2(null);
    setTurns((prevTurns) => prevTurns + 1);
    setDisabled(false);
  };

  // Submit score to the backend
  const submitScore = async (finalScore) => {
    try {
      const response = await axios.post('http://localhost:8000/add-score', {
        sessionId,
        score: finalScore,
        userId
      });
      console.log('Score saved successfully:', response.data);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Magic Match</h1>
        <button onClick={shuffleCards}>New Game</button>
        <div className="stats">
          <p className="turns">TURNS: {turns}</p>
          {score > 0 && <p className="score">SCORE: {score}</p>} {/* Display the score when the game is completed */}
        </div>
      </div>

      <div className="card-grid">
        {cards.map((card) => (
          <SingleCard
            key={card.id}
            card={card}
            handleChoice={handleChoice}
            flipped={card.flipped || card === choice1 || card === choice2 || card.matched}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export default MemoryGame;
