import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function Admin() {
  const [modules, setModules] = useState([]);
  const [content, setContent] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showQuizSection, setShowQuizSection] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'cursus',
    url: '',
    thumbnail_url: '',
    duration: '',
    difficulty: 'beginner',
    points_reward: '',
    tags: '',
    source: 'internal',
    is_featured: false,
    is_published: true
  });

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchContent(selectedModule);
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/content/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedModule(response.data.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      setError('Fout bij laden van modules');
      setLoading(false);
    }
  };

  const fetchContent = async (moduleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/content?moduleId=${moduleId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent(response.data.data || []);
    } catch (err) {
      setError('Fout bij laden van content');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Check if tags field changed and contains "basis"
    if (name === 'tags' && editingContent) {
      const hasBasisTag = value.toLowerCase().includes('basis');
      if (hasBasisTag && !showQuizSection) {
        // User added basis tag, load quiz questions
        fetchQuizQuestions(editingContent.id);
        setShowQuizSection(true);
      } else if (!hasBasisTag && showQuizSection) {
        // User removed basis tag, hide quiz section
        setShowQuizSection(false);
        setQuizQuestions([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      // Prepare data
      const data = {
        ...formData,
        module_id: selectedModule,
        duration: parseInt(formData.duration) || 0,
        points_reward: parseInt(formData.points_reward) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      let contentId;

      if (editingContent) {
        // Update existing content
        await axios.put(`${API_URL}/content/${editingContent.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        contentId = editingContent.id;

        // If this is basis content with quiz questions, save them
        if (showQuizSection && quizQuestions.length > 0) {
          await saveQuizQuestions(contentId);
        }

        setSuccess('Content en quiz vragen succesvol bijgewerkt!');
      } else {
        // Create new content
        const response = await axios.post(`${API_URL}/content`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        contentId = response.data.data.id;
        setSuccess('Content succesvol toegevoegd!');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        content_type: 'cursus',
        url: '',
        thumbnail_url: '',
        duration: '',
        difficulty: 'beginner',
        points_reward: '',
        tags: '',
        source: 'internal',
        is_featured: false,
        is_published: true
      });
      setShowAddForm(false);
      setEditingContent(null);
      setQuizQuestions([]);
      setShowQuizSection(false);
      fetchContent(selectedModule);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Fout bij opslaan van content');
    }
  };

  const handleEdit = async (item) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      description: item.description,
      content_type: item.content_type,
      url: item.url,
      thumbnail_url: item.thumbnail_url || '',
      duration: item.duration || '',
      difficulty: item.difficulty,
      points_reward: item.points_reward || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      source: item.source || 'internal',
      is_featured: item.is_featured || false,
      is_published: item.is_published !== false
    });
    setShowAddForm(true);

    // Check if content has 'basis' tag and load quiz questions
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const hasBasisTag = tags.includes('basis') || (typeof item.tags === 'string' && item.tags.includes('basis'));

    if (hasBasisTag) {
      await fetchQuizQuestions(item.id);
      setShowQuizSection(true);
    } else {
      setShowQuizSection(false);
      setQuizQuestions([]);
    }
  };

  const fetchQuizQuestions = async (contentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/content-quiz/admin/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const questions = response.data.data || [];

      // Initialize with 3 empty questions if none exist
      if (questions.length === 0) {
        setQuizQuestions([
          { question_text: '', correct_answer: 'A', option_a: '', option_b: '', option_c: '', option_d: '', explanation: '', order_index: 0 },
          { question_text: '', correct_answer: 'A', option_a: '', option_b: '', option_c: '', option_d: '', explanation: '', order_index: 1 },
          { question_text: '', correct_answer: 'A', option_a: '', option_b: '', option_c: '', option_d: '', explanation: '', order_index: 2 }
        ]);
      } else {
        setQuizQuestions(questions);
      }
    } catch (err) {
      console.error('Error fetching quiz questions:', err);
      // Initialize with empty questions on error
      setQuizQuestions([
        { question_text: '', correct_answer: 'A', option_a: '', option_b: '', option_c: '', option_d: '', explanation: '', order_index: 0 },
        { question_text: '', correct_answer: 'A', option_a: '', option_b: '', option_c: '', option_d: '', explanation: '', order_index: 1 },
        { question_text: '', correct_answer: 'A', option_a: '', option_b: '', option_c: '', option_d: '', explanation: '', order_index: 2 }
      ]);
    }
  };

  const handleQuizQuestionChange = (index, field, value) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const saveQuizQuestions = async (contentId) => {
    try {
      const token = localStorage.getItem('token');

      for (const question of quizQuestions) {
        if (!question.question_text || !question.option_a || !question.option_b || !question.option_c) {
          continue; // Skip empty questions
        }

        await axios.post(`${API_URL}/content-quiz/admin/${contentId}`, {
          id: question.id,
          questionText: question.question_text,
          correctAnswer: question.correct_answer,
          optionA: question.option_a,
          optionB: question.option_b,
          optionC: question.option_c,
          optionD: question.option_d || '',
          explanation: question.explanation || '',
          orderIndex: question.order_index
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      return true;
    } catch (err) {
      console.error('Error saving quiz questions:', err);
      throw new Error('Fout bij opslaan van quiz vragen');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze content wilt verwijderen?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/content/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Content verwijderd!');
      fetchContent(selectedModule);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Fout bij verwijderen van content');
    }
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingContent(null);
    setFormData({
      title: '',
      description: '',
      content_type: 'cursus',
      url: '',
      thumbnail_url: '',
      duration: '',
      difficulty: 'beginner',
      points_reward: '',
      tags: '',
      source: 'internal',
      is_featured: false,
      is_published: true
    });
  };

  const getContentTypeIcon = (type) => {
    const icons = {
      cursus: '📚',
      video: '🎥',
      podcast: '🎧',
      game: '🎮',
      praktijkvoorbeeld: '💼',
      artikel: '📰'
    };
    return icons[type] || '📄';
  };

  if (loading) {
    return <div className="admin-container"><div className="loading">Laden...</div></div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🛠️ Content Beheer</h1>
        <p>Beheer leermaterialen voor de AI Literacy cursus</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-content">
        {/* Module selector */}
        <div className="module-selector">
          <h2>Selecteer Module</h2>
          <div className="module-tabs">
            {modules.map(module => (
              <button
                key={module.id}
                className={`module-tab ${selectedModule === module.id ? 'active' : ''}`}
                onClick={() => setSelectedModule(module.id)}
              >
                <span className="module-icon">{module.icon}</span>
                <span className="module-name">{module.title}</span>
                <span className="module-count">
                  {content.filter(c => c.module_id === module.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="content-form-container">
            <div className="form-header">
              <h3>{editingContent ? '✏️ Bewerk Content' : '➕ Nieuwe Content Toevoegen'}</h3>
              <button className="btn-close" onClick={cancelEdit}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="content-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Titel *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Bijv. Introductie tot Machine Learning"
                  />
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="cursus">📚 Cursus</option>
                    <option value="video">🎥 Video</option>
                    <option value="podcast">🎧 Podcast</option>
                    <option value="game">🎮 Game</option>
                    <option value="praktijkvoorbeeld">💼 Praktijkvoorbeeld</option>
                    <option value="artikel">📰 Artikel</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Beschrijving *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Korte beschrijving van de content..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>URL *</label>
                  <input
                    type="text"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    required
                    placeholder="https://... of /internal-path"
                  />
                </div>

                <div className="form-group">
                  <label>Thumbnail URL</label>
                  <input
                    type="text"
                    name="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duur (minuten)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="30"
                  />
                </div>

                <div className="form-group">
                  <label>Moeilijkheidsgraad *</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Punten</label>
                  <input
                    type="number"
                    name="points_reward"
                    value={formData.points_reward}
                    onChange={handleInputChange}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tags (komma gescheiden)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="basis, ml, AI"
                  />
                </div>

                <div className="form-group">
                  <label>Bron</label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="internal, youtube, coursera..."
                  />
                </div>
              </div>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                  />
                  <span>⭐ Featured (uitgelicht)</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                  />
                  <span>✅ Gepubliceerd</span>
                </label>
              </div>

              {/* Quiz Questions Section - Only for basis content */}
              {showQuizSection && editingContent && (
                <div className="quiz-section">
                  <h4>📝 Quiz Vragen (3 verplichte vragen voor basis content)</h4>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                    Voeg 3 meerkeuzevragen toe die gebruikers moeten beantwoorden na het bekijken van deze content.
                  </p>

                  {quizQuestions.map((question, index) => (
                    <div key={index} className="quiz-question-item">
                      <h5>Vraag {index + 1}</h5>

                      <div className="form-group">
                        <label>Vraag *</label>
                        <input
                          type="text"
                          value={question.question_text || ''}
                          onChange={(e) => handleQuizQuestionChange(index, 'question_text', e.target.value)}
                          placeholder="Bijv: Wat is het belangrijkste doel van AI?"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Optie A *</label>
                          <input
                            type="text"
                            value={question.option_a || ''}
                            onChange={(e) => handleQuizQuestionChange(index, 'option_a', e.target.value)}
                            placeholder="Antwoord optie A"
                          />
                        </div>

                        <div className="form-group">
                          <label>Optie B *</label>
                          <input
                            type="text"
                            value={question.option_b || ''}
                            onChange={(e) => handleQuizQuestionChange(index, 'option_b', e.target.value)}
                            placeholder="Antwoord optie B"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Optie C *</label>
                          <input
                            type="text"
                            value={question.option_c || ''}
                            onChange={(e) => handleQuizQuestionChange(index, 'option_c', e.target.value)}
                            placeholder="Antwoord optie C"
                          />
                        </div>

                        <div className="form-group">
                          <label>Optie D (optioneel)</label>
                          <input
                            type="text"
                            value={question.option_d || ''}
                            onChange={(e) => handleQuizQuestionChange(index, 'option_d', e.target.value)}
                            placeholder="Antwoord optie D"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Correct Antwoord *</label>
                        <select
                          value={question.correct_answer || 'A'}
                          onChange={(e) => handleQuizQuestionChange(index, 'correct_answer', e.target.value)}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          {question.option_d && <option value="D">D</option>}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Uitleg (optioneel)</label>
                        <textarea
                          value={question.explanation || ''}
                          onChange={(e) => handleQuizQuestionChange(index, 'explanation', e.target.value)}
                          placeholder="Uitleg waarom dit het juiste antwoord is"
                          rows="2"
                        />
                      </div>
                    </div>
                  ))}

                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#28a745', fontStyle: 'italic' }}>
                    💡 Quiz vragen worden automatisch opgeslagen wanneer je op "Bijwerken" klikt
                  </p>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Annuleren
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContent ? 'Bijwerken' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content List */}
        <div className="content-list-section">
          <div className="section-header">
            <h3>
              Content Items ({content.length})
            </h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowAddForm(true);
                setEditingContent(null);
              }}
            >
              ➕ Nieuwe Content
            </button>
          </div>

          <div className="content-list">
            {content.length === 0 ? (
              <div className="empty-state">
                <p>Nog geen content items in deze module.</p>
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                  Voeg eerste item toe
                </button>
              </div>
            ) : (
              content.map(item => (
                <div key={item.id} className="content-item">
                  <div className="content-item-icon">
                    {getContentTypeIcon(item.content_type)}
                  </div>
                  <div className="content-item-info">
                    <h4>{item.title}</h4>
                    <p className="content-description">{item.description}</p>
                    <div className="content-meta">
                      <span className="meta-badge">{item.content_type}</span>
                      <span className="meta-badge">{item.difficulty}</span>
                      {item.duration && <span className="meta-badge">⏱️ {item.duration} min</span>}
                      {item.points_reward && <span className="meta-badge">🏆 {item.points_reward} punten</span>}
                      {item.is_featured && <span className="meta-badge featured">⭐ Featured</span>}
                      {!item.is_published && <span className="meta-badge draft">📝 Concept</span>}
                    </div>
                  </div>
                  <div className="content-item-actions">
                    <button className="btn-icon" onClick={() => handleEdit(item)} title="Bewerken">
                      ✏️
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(item.id)} title="Verwijderen">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
