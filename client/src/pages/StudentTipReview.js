import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowUpRight, FiBookOpen, FiCheckCircle, FiExternalLink, FiSearch, FiShield, FiUsers } from 'react-icons/fi';
import { Link, Navigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getStudentTipCardModel, translateStudentTipText } from '../utils/studentTips';
import { buildReviewPayload } from '../utils/studentTipReview';
import './StudentTipReview.css';

const statuses = [
  ['all', 'Alle statussen'],
  ['submitted', 'Ingediend'],
  ['in_review', 'In beoordeling'],
  ['published', 'Gedeeld met studenten'],
  ['added', 'Toegevoegd aan leermateriaal'],
  ['declined', 'Niet geselecteerd'],
  ['hidden', 'Niet meer zichtbaar']
];

function isAllowedToShare(value) {
  return value === true || value === 1 || value === '1';
}

function ReviewerRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const { language } = useLanguage();
  if (loading) return <main className="tip-review-page"><div className="container tip-review-state" role="status">{translateStudentTipText(language, 'Studenttips beoordelen')}</div></main>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['teacher', 'admin'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function TipReviewCard({ tip, modules, t, language, onUpdated }) {
  const model = getStudentTipCardModel(tip);
  const shared = isAllowedToShare(tip.share_with_students);
  const [displayTitle, setDisplayTitle] = useState(tip.display_title || tip.title || '');
  const [displaySummary, setDisplaySummary] = useState(tip.display_summary || tip.recommendation_reason || '');
  const [reviewerNote, setReviewerNote] = useState(tip.reviewer_note || '');
  const [moduleId, setModuleId] = useState(modules[0]?.id ? String(modules[0].id) : '');
  const [contentType, setContentType] = useState('video');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!moduleId && modules.length) setModuleId(String(modules[0].id));
  }, [moduleId, modules]);
  const submitAction = async (action) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = buildReviewPayload({
        action,
        currentStatus: tip.status,
        shareWithStudents: shared,
        reviewerNote,
        displayTitle,
        displaySummary,
        moduleId,
        contentType
      });
      await api.patch(`/student-tips/${tip.id}/review`, payload);
      setNotice(t(action === 'add_to_library' ? 'Studenttip is toegevoegd als verborgen concept.' : 'Studenttip bijgewerkt.'));
      onUpdated();
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(requestError.response ? t('De wijziging is niet opgeslagen. Controleer de gegevens en probeer opnieuw.') : t(message));
    } finally {
      setBusy(false);
    }
  };

  const author = [tip.first_name, tip.last_name].filter(Boolean).join(' ') || tip.email || t('Student');
  const submittedDate = tip.created_at
    ? new Date(tip.created_at).toLocaleDateString(language === 'en' ? 'en-GB' : 'nl-NL', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return <article className="tip-review-card">
    <header className="tip-review-card-header">
      <div className="tip-review-card-title"><span className={`tip-status tip-status-${tip.status}`}>{t(statuses.find(([value]) => value === tip.status)?.[1] || 'Ingediend')}</span><h2>{tip.display_title || tip.title}</h2></div>
      <div className="tip-review-date">{submittedDate && <span>{t('Ingediend op')} {submittedDate}</span>}<strong>{author}</strong></div>
    </header>

    {tip.duplicate_warning && <div className="tip-review-duplicate"><FiAlertTriangle aria-hidden="true" />{t('Mogelijke dubbele bron')}</div>}

    <div className="tip-review-source-row">
      <div className="tip-review-source-kind">{tip.content_id ? <><FiBookOpen aria-hidden="true" />{t('Interne leermaterialen')}</> : <><FiExternalLink aria-hidden="true" />{t('Externe bron')}</>}</div>
      {model.href ? (model.external
        ? <a href={model.href} target={model.target} rel={model.rel} className="tip-review-source">{tip.url}<FiArrowUpRight aria-hidden="true" /></a>
        : <Link to={model.href} className="tip-review-source">{tip.title}<FiArrowUpRight aria-hidden="true" /></Link>)
        : <span className="tip-review-source-text">{tip.url || t('Geen bronlink')}</span>}
    </div>

    <div className="tip-review-consent-row">
      <span className={shared ? 'consent-enabled' : 'consent-muted'}><FiUsers aria-hidden="true" />{shared ? t('De student wil deze tip delen') : t('De student wil geen openbare tip')}</span>
      {isAllowedToShare(tip.display_first_name) && <span className="consent-enabled"><FiCheckCircle aria-hidden="true" />{t('De student wil zijn voornaam tonen')}</span>}
    </div>

    <div className="tip-review-context-grid">
      <div><span>{t('Voor wie')}</span><p>{tip.audience}</p></div>
      <div><span>{t('Wat heeft de student geleerd?')}</span><p>{tip.learning_outcome}</p></div>
      <div><span>{t('Waarom beveelt de student dit aan?')}</span><p>{tip.recommendation_reason}</p></div>
      <div><span>{t('Wat moet kritisch worden gecontroleerd?')}</span><p>{tip.critical_check}</p></div>
    </div>

    {['in_review', 'hidden'].includes(tip.status) && <div className="tip-review-edit-fields">
      <label>{t('Zichtbare titel')}<input value={displayTitle} onChange={(event) => setDisplayTitle(event.target.value)} maxLength={200} /></label>
      <label>{t('Samenvatting voor studenten')}<textarea value={displaySummary} onChange={(event) => setDisplaySummary(event.target.value)} rows={3} maxLength={2000} /></label>
      <label>{t('Notitie voor de student')}<textarea value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} rows={2} maxLength={2000} /></label>
    </div>}

    {tip.status === 'in_review' && !tip.content_id && <div className="tip-review-convert-fields">
      <label>{t('Module voor nieuw concept')}<select value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
        <option value="">{t('Kies een module')}</option>
        {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
      </select></label>
      <label>{t('Type leermateriaal')}<select value={contentType} onChange={(event) => setContentType(event.target.value)}>
        {['video', 'artikel', 'podcast', 'cursus', 'game', 'praktijkvoorbeeld'].map((type) => <option key={type} value={type}>{t(type === 'artikel' ? 'Artikel' : type === 'praktijkvoorbeeld' ? 'Praktijkvoorbeeld' : type === 'cursus' ? 'Cursus' : type === 'video' ? 'Video' : type === 'podcast' ? 'Podcast' : 'Interactief')}</option>)}
      </select></label>
    </div>}

    {error && <div className="tip-review-error" role="alert">{error}</div>}
    {notice && <div className="tip-review-success" role="status"><FiCheckCircle aria-hidden="true" />{notice}</div>}

    <footer className="tip-review-actions">
      {tip.status === 'submitted' && <button className="btn btn-outline" disabled={busy} onClick={() => submitAction('start_review')}>{t('Start beoordeling')}</button>}
      {tip.status === 'in_review' && <>
        <button className="btn btn-primary" disabled={busy || !shared} title={!shared ? t('Deze tip mag zonder toestemming niet worden gedeeld.') : undefined} onClick={() => submitAction('publish')}>{t('Publiceer studenttip')}</button>
        {!shared && <span className="tip-review-action-hint"><FiShield aria-hidden="true" />{t('De student wil geen openbare tip')}</span>}
        {!tip.content_id && <button className="btn btn-outline" disabled={busy || modules.length === 0} onClick={() => submitAction('add_to_library')}>{t('Zet om in concept')}</button>}
        <button className="btn btn-text-danger" disabled={busy} onClick={() => submitAction('decline')}>{t('Wijs af')}</button>
      </>}
      {tip.status === 'published' && <button className="btn btn-outline" disabled={busy} onClick={() => submitAction('hide')}>{t('Verberg studenttip')}</button>}
      {tip.status === 'hidden' && <button className="btn btn-primary" disabled={busy || !shared} onClick={() => submitAction('publish')}>{t('Publiceer opnieuw')}</button>}
      {busy && <span className="tip-review-saving" role="status">{t('Opslaan…')}</span>}
    </footer>
  </article>;
}

function StudentTipReviewPage() {
  const { t: defaultTranslate, language } = useLanguage();
  const t = useCallback((key, values) => translateStudentTipText(language, key, values, defaultTranslate), [defaultTranslate, language]);
  const [status, setStatus] = useState('submitted');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [tips, setTips] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [retry, setRetry] = useState(0);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (appliedSearch) params.set('search', appliedSearch);
    try {
      const response = await api.get(`/student-tips/review?${params.toString()}`);
      setTips(response.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [status, appliedSearch]);

  useEffect(() => { loadQueue(); }, [loadQueue, retry]);
  useEffect(() => {
    let active = true;
    api.get('/content/modules')
      .then((response) => { if (active) setModules(response.data.data || []); })
      .catch(() => { if (active) setModuleError(true); });
    return () => { active = false; };
  }, []);

  function applySearch(event) {
    event.preventDefault();
    setAppliedSearch(search.trim());
  }

  return <main className="tip-review-page"><div className="container">
    <header className="tip-review-intro"><span className="eyebrow">{t('BEOORDELAARSINBOX')}</span><h1>{t('Studenttips beoordelen')}</h1><p>{t('Bekijk wat studenten aanbevelen en help bepalen welke tips anderen verder brengen.')}</p></header>
    <section className="tip-review-toolbar" aria-label={t('Filters')}>
      <label>{t('Filter op status')}<select value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
      </select></label>
      <form className="tip-review-search" onSubmit={applySearch} role="search"><FiSearch aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Zoek op titel of bronlink')} aria-label={t('Zoek op titel of bronlink')} /><button type="submit">{t('Zoeken')}</button></form>
      <span className="tip-review-count">{tips.length} {t('tips')}</span>
    </section>

    {moduleError && <div className="tip-review-module-warning" role="status">{t('Modules konden niet worden geladen. Omzetten naar een concept is tijdelijk niet beschikbaar.')}</div>}
      {loading ? <div className="tip-review-state" role="status"><span className="student-tips-spinner" />{t('Beoordelaarsinbox laden…')}</div> : error ? <div className="tip-review-state" role="alert"><h2>{t('De inbox is even niet beschikbaar')}</h2><button className="btn btn-primary" onClick={() => setRetry((value) => value + 1)}>{t('Opnieuw ophalen')}</button></div> : tips.length ? <div className="tip-review-list">{tips.map((tip) => <TipReviewCard key={tip.id} tip={tip} modules={modules} t={t} language={language} onUpdated={loadQueue} />)}</div> : <div className="tip-review-empty"><FiUsers aria-hidden="true" /><h2>{t('Er staan nog geen tips in deze selectie.')}</h2><p>{t('Kies een andere status of zoek op een titel.')}</p></div>}
    <footer className="student-tips-footnote">{t('Beoordeel de bron, context en privacykeuze voordat je een tip publiceert.')}</footer>
  </div></main>;
}

export default function StudentTipReview() {
  return <ReviewerRoute><StudentTipReviewPage /></ReviewerRoute>;
}
