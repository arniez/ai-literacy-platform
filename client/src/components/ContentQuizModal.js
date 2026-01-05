import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './ContentQuizModal.css';

const ContentQuizModal = ({ contentId, contentTitle, isOpen, onClose, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen && contentId) {
      fetchQuiz();
    }
  }, [isOpen, contentId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/content-quiz/${contentId}`);
      setQuestions(response.data.data.questions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Fout bij het laden van de quiz');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
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
    // Check if all questions are answered
    const allAnswered = questions.every(q => answers[q.id]);

    if (!allAnswered) {
      toast.warning('Beantwoord alle vragen voordat je de quiz indient');
      return;
    }

    try {
      setSubmitting(true);

      const answersArray = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id]
      }));

      const response = await api.post(`/content-quiz/${contentId}/submit`, {
        answers: answersArray
      });

      setResult(response.data.data);
      setSubmitting(false);

      if (response.data.data.passed) {
        toast.success('🎉 Quiz voltooid! Content is afgerond.');
        setTimeout(() => {
          onComplete();
          handleClose();
        }, 2000);
      } else {
        toast.error('Niet alle antwoorden zijn correct. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Fout bij het indienen van de quiz');
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    onClose();
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <div className="quiz-loading">
            <div className="spinner"></div>
            <p>Quiz laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal quiz-result-modal">
          <div className={`quiz-result ${result.passed ? 'passed' : 'failed'}`}>
            <div className="result-icon">
              {result.passed ? '✅' : '❌'}
            </div>
            <h2>{result.passed ? 'Gefeliciteerd!' : 'Helaas...'}</h2>
            <div className="result-score">
              <span className="score">{result.score}</span>
              <span className="divider">/</span>
              <span className="total">{result.total}</span>
            </div>
            <p className="result-message">{result.message}</p>

            {result.passed ? (
              <button className="btn btn-primary" onClick={handleClose}>
                Sluiten
              </button>
            ) : (
              <div className="result-actions">
                <button className="btn btn-secondary" onClick={handleClose}>
                  Later opnieuw
                </button>
                <button className="btn btn-primary" onClick={handleRetry}>
                  Opnieuw proberen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check if questions exist
  if (!questions || questions.length === 0) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <div className="quiz-loading">
            <p>Geen quiz vragen beschikbaar</p>
            <button className="btn btn-primary" onClick={handleClose}>Sluiten</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  if (!currentQ) return null;

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        {/* Header */}
        <div className="quiz-modal-header">
          <div>
            <h3>Quiz</h3>
            <p className="quiz-title">{contentTitle}</p>
          </div>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        {/* Progress */}
        <div className="quiz-progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            Vraag {currentQuestion + 1} van {questions.length}
          </div>
        </div>

        {/* Question */}
        <div className="quiz-question-section">
          <h4 className="question-text">{currentQ.question_text}</h4>

          <div className="quiz-options">
            {['A', 'B', 'C', 'D'].map(option => {
              const optionKey = `option_${option.toLowerCase()}`;
              const optionText = currentQ[optionKey];

              if (!optionText) return null;

              const isSelected = answers[currentQ.id] === option;

              return (
                <button
                  key={option}
                  className={`quiz-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQ.id, option)}
                >
                  <span className="option-letter">{option}</span>
                  <span className="option-text">{optionText}</span>
                  {isSelected && <span className="check-mark">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="quiz-modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ← Vorige
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
            >
              Volgende →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !answers[currentQ.id]}
            >
              {submitting ? 'Indienen...' : 'Quiz Indienen'}
            </button>
          )}
        </div>

        {/* Question Indicators */}
        <div className="question-indicators">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`indicator ${index === currentQuestion ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentQuizModal;
