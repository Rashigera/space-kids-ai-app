import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import './App.css';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const webcamRef = useRef(null);
  const [user, setUser] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState(null);
  const [stage, setStage] = useState('start');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    signInAnonymously(auth).then((cred) => {
      setUser(cred.user);
    });

    // Ask for location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const requestWebcam = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamPermission(true);
      setShowWebcam(true);
      setStage('lesson');
    } catch (err) {
      setWebcamPermission(false);
      alert('Webcam permission is required to proceed.');
    }
  };

  const handleAnswer = (questionId, answer) => {
    setQuizAnswers({ ...quizAnswers, [questionId]: answer });
  };

  const finishQuiz = async () => {
    const correct = {
      q1: '2024',
      q2: 'Europa Clipper',
      q3: 'SpaceX Starship',
    };

    let total = 0;
    Object.keys(correct).forEach((key) => {
      if (quizAnswers[key] === correct[key]) total++;
    });

    setScore(total);
    setStage('result');

    if (user) {
      await setDoc(doc(db, 'progress', user.uid), {
        lesson: 'What’s New in Space Exploration',
        score: total,
        timestamp: new Date(),
        location: location ? `${location.lat}, ${location.lon}` : 'Not available',
      });
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 What’s New in Space Exploration</h1>
      </header>

      {showWebcam && webcamPermission && (
        <div className="webcam-container">
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
        </div>
      )}

      {stage === 'start' && (
        <div className="intro-card">
          <p>Hi, I’m Nova, your guide to the stars! Ready to learn what’s new beyond Earth’s orbit?</p>
          {location && (
            <p>Your location: 🌍 Lat {location.lat.toFixed(2)}, Lon {location.lon.toFixed(2)}</p>
          )}
          {locationError && (
            <p style={{ color: 'red' }}>⚠️ Location error: {locationError}</p>
          )}
          <button onClick={requestWebcam}>Start Lesson</button>
        </div>
      )}

      {stage === 'lesson' && (
        <div className="lesson-card">
          <p>In 2024, space exploration is taking giant leaps. NASA is preparing the Artemis II mission to take humans around the Moon again. The Europa Clipper is set to explore Jupiter’s icy moon, Europa, to search for signs of life. Meanwhile, SpaceX is testing Starship, the most powerful rocket ever built, aiming to take us to Mars and beyond.</p>
          <button onClick={() => setStage('quiz')}>Take Quiz</button>
        </div>
      )}

      {stage === 'quiz' && (
        <div className="quiz-card">
          <h3>Quick Quiz</h3>
          <p>1. What year is Artemis II expected to launch?</p>
          <button onClick={() => handleAnswer('q1', '2024')}>2024</button>
          <button onClick={() => handleAnswer('q1', '2026')}>2026</button>

          <p>2. What is the name of the NASA mission to Jupiter’s moon?</p>
          <button onClick={() => handleAnswer('q2', 'Europa Clipper')}>Europa Clipper</button>
          <button onClick={() => handleAnswer('q2', 'Lunar Gateway')}>Lunar Gateway</button>

          <p>3. What rocket is SpaceX developing?</p>
          <button onClick={() => handleAnswer('q3', 'Falcon 9')}>Falcon 9</button>
          <button onClick={() => handleAnswer('q3', 'SpaceX Starship')}>SpaceX Starship</button>

          <button onClick={finishQuiz}>Submit</button>
        </div>
      )}

      {stage === 'result' && (
        <div className="result-card">
          <h2>{score === 3 ? '🌟 Excellent!' : '👍 Good Try!'}</h2>
          <p>You scored {score} out of 3.</p>
          {score === 3 && <p>🏅 You’ve earned the Nova Explorer Badge!</p>}
        </div>
      )}
    </div>
  );
};

export default App;