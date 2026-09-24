import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { buildPublicationChange } from '../../utils/aiStudentIntegration';
import { translateAiStudent } from '../../utils/aiStudentTranslations';
import './AIStudentIntegrationAdmin.css';

const isPublished = (lesson) => lesson.is_published === true || lesson.is_published === 1 || lesson.is_published === '1';
const lessonStatus = (lesson) => lesson.availability_status === 'available' ? (isPublished(lesson) ? 'published' : 'hidden') : lesson.availability_status;

function AIStudentIntegrationAdmin() {
  const { language } = useLanguage();
  const label = useCallback((key) => translateAiStudent(key, language), [language]);
  const [version, setVersion] = useState('2025');
  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [busyLessonId, setBusyLessonId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewId, setPreviewId] = useState(null);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/integrations/ai-students', { params: { version } });
      setLessons([...(response.data.data || [])].sort((left, right) => left.external_id.localeCompare(right.external_id, undefined, { numeric: true })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || label('reloadError'));
    } finally {
      setLoading(false);
    }
  }, [version, label]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  const filteredLessons = useMemo(() => lessons.filter((lesson) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${lesson.title} ${lesson.external_id}`.toLowerCase().includes(query);
    const status = lessonStatus(lesson);
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'available' && lesson.availability_status === 'available')
      || status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [lessons, search, statusFilter]);

  const availableCount = lessons.filter((lesson) => lesson.availability_status === 'available').length;
  const offeredCount = lessons.filter(isPublished).length;

  const handleImport = async () => {
    setImporting(true);
    setError('');
    setNotice('');
    try {
      await api.post('/integrations/ai-students/import');
      await loadLessons();
      setNotice(label('importSuccess'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || label('importError'));
    } finally { setImporting(false); }
  };

  const handlePublicationChange = async (lesson) => {
    const nextValue = !isPublished(lesson);
    setBusyLessonId(lesson.id);
    setError('');
    setNotice('');
    try {
      const payload = buildPublicationChange(lesson, nextValue, language);
      await api.patch(`/integrations/ai-students/${lesson.id}/publication`, payload);
      await loadLessons();
      setNotice(nextValue ? label('publish') : label('hide'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || label('importError'));
    } finally { setBusyLessonId(null); }
  };

  const statusLabel = (lesson) => {
    const status = lessonStatus(lesson);
    if (status === 'published') return label('published');
    if (status === 'hidden') return label('hidden');
    return label(status === 'upcoming' ? 'upcoming' : 'noVideo');
  };

  return (
    <section className="ai-student-admin" aria-labelledby="ai-student-admin-title">
      <div className="ai-student-admin__hero">
        <div>
          <p className="ai-student-admin__eyebrow">{label('eyebrow')}</p>
          <h2 id="ai-student-admin-title">{label('title')}</h2>
          <p className="ai-student-admin__subtitle">{label('subtitle')}</p>
        </div>
        <button className="ai-student-admin__import" type="button" onClick={handleImport} disabled={importing}>
          <span aria-hidden="true">↻</span> {importing ? label('importing') : label('import')}
        </button>
      </div>

      <div className="ai-student-admin__summary" aria-live="polite">
        <span><strong>{lessons.length}</strong> {label('lessonCount')}</span>
        <span><strong>{availableCount}</strong> {label('availableCount')}</span>
        <span><strong>{offeredCount}</strong> {label('offeredCount')}</span>
      </div>

      {error && <div className="ai-student-admin__alert ai-student-admin__alert--error" role="alert">{error}</div>}
      {notice && <div className="ai-student-admin__alert ai-student-admin__alert--success" role="status">{notice}</div>}

      <div className="ai-student-admin__filters">
        <label className="ai-student-admin__field">
          <span>{label('version')}</span>
          <select value={version} onChange={(event) => setVersion(event.target.value)}>
            <option value="2025">E-learning 2025</option><option value="2026">Cursus 2026</option>
          </select>
        </label>
        <label className="ai-student-admin__field ai-student-admin__field--search">
          <span>{label('search')}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={label('searchPlaceholder')} />
        </label>
        <label className="ai-student-admin__field">
          <span>{label('status')}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{label('all')}</option><option value="available">{label('available')}</option>
            <option value="published">{label('filterPublished')}</option><option value="hidden">{label('filterHidden')}</option>
            <option value="upcoming">{label('upcoming')}</option><option value="no_video">{label('noVideo')}</option>
          </select>
        </label>
      </div>

      {loading ? <div className="ai-student-admin__empty" role="status">{label('loading')}</div> : lessons.length === 0 ? (
        <div className="ai-student-admin__empty"><span className="ai-student-admin__empty-icon" aria-hidden="true">↗</span><h3>{label('noCatalog')}</h3><p>{label('noCatalogHint')}</p></div>
      ) : filteredLessons.length === 0 ? (
        <div className="ai-student-admin__empty"><h3>{label('empty')}</h3><p>{label('emptyHint')}</p></div>
      ) : (
        <div className="ai-student-admin__list">
          {filteredLessons.map((lesson) => {
            const published = isPublished(lesson);
            const available = lesson.availability_status === 'available' && Boolean(lesson.content_id);
            const previewOpen = previewId === lesson.id;
            return (
              <article className={`ai-student-lesson ${published ? 'is-published' : ''}`} key={lesson.id}>
                <div className="ai-student-lesson__main">
                  <div className="ai-student-lesson__number" aria-label={`${label('lesson')} ${lesson.external_id}`}>{lesson.external_id}</div>
                  <div className="ai-student-lesson__details">
                    <div className="ai-student-lesson__heading"><h3>{lesson.title}</h3><span className={`ai-student-lesson__status ai-student-lesson__status--${lessonStatus(lesson)}`}>{statusLabel(lesson)}</span></div>
                    <div className="ai-student-lesson__meta">
                      {lesson.video_duration_minutes && <span>{lesson.video_duration_minutes} {label('minutes')}</span>}
                      <a href={lesson.lesson_url} target="_blank" rel="noreferrer">{label('source')} ↗</a>
                    </div>
                    <p className={`ai-student-lesson__reason ${available ? '' : 'ai-student-lesson__reason--muted'}`}>
                      {available ? label('readyReason') : lesson.unavailable_reason || label(lesson.availability_status === 'upcoming' ? 'upcomingReason' : 'noVideoReason')}
                    </p>
                  </div>
                  <div className="ai-student-lesson__actions">
                    <button className="ai-student-lesson__preview" type="button" onClick={() => setPreviewId(previewOpen ? null : lesson.id)} disabled={!lesson.video_url} aria-expanded={previewOpen}>
                      {previewOpen ? label('closePreview') : label('preview')}
                    </button>
                    <button type="button" role="switch" className="ai-student-lesson__switch" aria-checked={published} aria-label={published ? label('hide') : label('publish')} disabled={!available || busyLessonId === lesson.id} onClick={() => handlePublicationChange(lesson)}>
                      <span className="ai-student-lesson__switch-track"><span /></span><span className="ai-student-lesson__switch-label">{published ? label('published') : label('hidden')}</span>
                    </button>
                  </div>
                </div>
                {previewOpen && lesson.video_url && (
                  <div className="ai-student-lesson__player">
                    <div className="ai-student-lesson__player-heading"><span>{label('videoPreviewTitle')}</span><button type="button" onClick={() => setPreviewId(null)} aria-label={label('closePreview')}>×</button></div>
                    <iframe src={lesson.video_url} title={`${lesson.title} — ${label('videoPreviewTitle')}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AIStudentIntegrationAdmin;
