import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quiz.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function Quiz() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime] = useState(Date.now());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [requiredCompletion, setRequiredCompletion] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [moduleId]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/quiz/module/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQuiz(response.data.data.quiz);
      setQuestions(response.data.data.questions);
      setIsUnlocked(response.data.data.isUnlocked);
      setRequiredCompletion(response.data.data.requiredCompletion);

      if (response.data.data.hasCompleted) {
        // User already passed, show success message
        setResult({ passed: true, alreadyPassed: true });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Je hebt nog ${unanswered.length} vraag/vragen niet beantwoord.`);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const answersArray = questions.map(q => ({
        questionId: q.id,
        optionId: answers[q.id]
      }));

      const response = await axios.post(
        `${API_URL}/quiz/${quiz.id}/submit`,
        { answers: answersArray, timeSpent },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setResult(response.data.data);
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setSubmitting(false);
      alert('Er is een fout opgetreden bij het indienen van de toets.');
    }
  };

  if (loading) {
    return <div className="quiz-container"><div className="loading">Laden...</div></div>;
  }

  if (!isUnlocked) {
    return (
      <div className="quiz-container">
        <div className="quiz-locked">
          <h1>🔒 Toets Vergrendeld</h1>
          <p>Deze toets is nog niet beschikbaar.</p>
          <p>Voltooi eerst alle leermaterialen in deze module om de toets te ontgrendelen.</p>
          <div className="completion-status">
            <div className="progress-info">
              <span>{requiredCompletion?.completed || 0} / {requiredCompletion?.total || 0}</span>
              <span>items voltooid</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${((requiredCompletion?.completed || 0) / (requiredCompletion?.total || 1)) * 100}%` }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/leermaterialen')}>
            Ga naar Leermaterialen
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="quiz-container">
        <div className={`quiz-result ${result.passed ? 'passed' : 'failed'}`}>
          <div className="result-icon">{result.passed ? '🎉' : '😞'}</div>
          <h1>{result.alreadyPassed ? 'Toets al Afgerond!' : result.passed ? 'Gefeliciteerd!' : 'Helaas...'}</h1>
          {!result.alreadyPassed && (
            <>
              <div className="result-score">
                <div className="score-circle">
                  <span className="score-percentage">{result.percentage}%</span>
                  <span className="score-label">{result.score}/{result.maxScore} correct</span>
                </div>
              </div>
              <p className="result-message">
                {result.passed
                  ? `Je hebt de toets gehaald! Je hebt ${result.pointsAwarded} punten verdiend en een badge ontvangen! 🏆`
                  : `Je hebt minimaal ${result.passingScore}% nodig om te slagen. Probeer het opnieuw!`}
              </p>
            </>
          )}
          <div className="result-actions">
            {result.passed ? (
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Ga naar Dashboard
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Probeer Opnieuw
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <p className="quiz-description">{quiz.description}</p>
        <div className="quiz-info">
          <span>📝 {quiz.total_questions} vragen</span>
          <span>⏱️ {quiz.time_limit} minuten</span>
          <span>✅ {quiz.passing_score}% om te slagen</span>
        </div>
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">Vraag {currentQuestion + 1} van {questions.length}</span>
        </div>
      </div>

      <div className="quiz-question">
        <h2>Vraag {currentQuestion + 1}</h2>
        <p className="question-text">{currentQ.question_text}</p>

        <div className="question-options">
          {currentQ.options.map(option => (
            <button
              key={option.id}
              className={`option-button ${answers[currentQ.id] === option.id ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(currentQ.id, option.id)}
            >
              <span className="option-radio">{answers[currentQ.id] === option.id ? '●' : '○'}</span>
              <span className="option-text">{option.option_text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-navigation">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          ← Vorige
        </button>

        {currentQuestion === questions.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Indienen...' : 'Indienen'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleNext}
          >
            Volgende →
          </button>
        )}
      </div>

      <div className="quiz-overview">
        <p>Voortgang:</p>
        <div className="question-dots">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`question-dot ${answers[q.id] ? 'answered' : ''} ${idx === currentQuestion ? 'current' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
              title={`Vraag ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Quiz;
