import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti'; // Import canvas-confetti
import SingleCard from '../components/SingleCard';
import '../styles/MemoryGame.css';

const cardImages = [
  { src: '/img/a.png', matched: false },
  { src: '/img/b.png', matched: false },
  { src: '/img/c.png', matched: false },
  { src: '/img/1.png', matched: false },
  { src: '/img/2.png', matched: false },
  { src: '/img/3.png', matched: false },
];

function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choice1, setChoice1] = useState(null);
  const [choice2, setChoice2] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100); // Timer state
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId'));

  // Shuffle cards and initialize the game
  const shuffleCards = () => {
    const shuffledCards = [...cardImages, ...cardImages]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ ...card, id: Math.random() }));
    setCards(shuffledCards);
    setTurns(0);
    setScore(0);
    setGameCompleted(false);
    setGameStarted(true);
    setTimeLeft(100); // Reset timer
    flipAllCardsTemporary(shuffledCards);
  };

  // Timer countdown
  useEffect(() => {
    let timer;
    if (gameStarted && !gameCompleted) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setGameCompleted(true);
            submitScore(3);
            setDisabled(true); // Disable further gameplay
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted]);

  // Flip all cards temporarily when the game starts
  const flipAllCardsTemporary = (shuffledCards) => {
    setTimeout(() => {
      setCards(shuffledCards.map((card) => ({ ...card, flipped: false })));
    }, 5000);
    setCards(shuffledCards.map((card) => ({ ...card, flipped: true })));
  };

  // Handle a choice
  const handleChoice = (card) => {
    if (!disabled) {
      choice1 ? setChoice2(card) : setChoice1(card);
    }
  };

  // Compare 2 selected cards
  useEffect(() => {
    if (choice1 && choice2) {
      setDisabled(true);
      if (choice1.src === choice2.src) {
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.src === choice1.src ? { ...card, matched: true } : card
          )
        );
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choice1, choice2]);

  // Calculate score and check for game completion
  useEffect(() => {
    const matchedCards = cards.filter((card) => card.matched).length;
    if (matchedCards === cardImages.length * 2) {
      let finalScore = 10;
      if (turns > 9) {
        finalScore -= Math.floor((turns - 9) / 2);
      }
      setScore(finalScore < 0 ? 0 : finalScore);
      setGameCompleted(true);
      launchConfetti();
      submitScore(finalScore);
    }
  }, [cards, turns]);

  // Reset the choices and increase the turn count
  const resetTurn = () => {
    setChoice1(null);
    setChoice2(null);
    setTurns((prevTurns) => {
      if (prevTurns + 1 >= 30) {
        setGameCompleted(true); 
        submitScore(3);// Set score to 3 if moves exceed 30
        setDisabled(true); // Disable further gameplay
        return prevTurns + 1;
      }
      return prevTurns + 1;
    });
    setDisabled(false);
  };

  // Submit score to the backend
  const submitScore = async (score) => {
    try {
      await axios.post('http://localhost:8000/api/save-score', {
        sessionId,
        score,
        userId,
      });
      console.log('Score saved successfully');
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  // Launch confetti when the game is completed
  const launchConfetti = () => {
    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        startVelocity: 30,
        spread: 360,
        gravity: 0.5,
        scalar: 1.5,
        colors: ['#FF5733', '#33FF57', '#3357FF', '#FF33A5', '#FFD700'],
        origin: { y: 0.6 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Magic Match</h1>
        {!gameStarted && !gameCompleted && (
          <button onClick={shuffleCards}>Start Game</button>
        )}
        <div className="stats">
          <p className="turns">TURNS: {turns}</p>
          {score > 0 && <p className="score">SCORE: {score}</p>}
          <p className="timer">TIME LEFT: {timeLeft}s</p>
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

      {gameCompleted && !score && (
        <div className="message">Time's up! Try again later.</div>
      )}
      {gameCompleted && score === 3 && (
        <div className="message">Maximum moves reached! Try again later.</div>
      )}
      {gameCompleted && score > 3 && (
        <div className="message">Congratulations! You completed the game!</div>
      )}
    </div>
  );
}

export default MemoryGame;
