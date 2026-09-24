import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowUpRight, FiBookOpen, FiCheckCircle, FiExternalLink, FiSend, FiShield, FiUsers } from 'react-icons/fi';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { buildStudentTipPayload, getStudentTipCardModel, localizeTipValidationErrors, translateStudentTipText } from '../utils/studentTips';
import './StudentTips.css';

const statusText = {
  submitted: 'Ingediend',
  in_review: 'In beoordeling',
  published: 'Gedeeld met studenten',
  added: 'Toegevoegd aan leermateriaal',
  declined: 'Niet geselecteerd',
  hidden: 'Niet meer zichtbaar'
};

function emptyForm(type = 'external', contentId = '') {
  return {
    type,
    contentId,
    title: '',
    url: '',
    audience: '',
    learningOutcome: '',
    recommendationReason: '',
    criticalCheck: '',
    shareWithStudents: false,
    displayFirstName: false
  };
}

function TipSource({ model, label }) {
  if (!model.href) return null;
  return model.external
    ? <a className="student-tip-source" href={model.href} target={model.target} rel={model.rel}>{label}<FiExternalLink aria-hidden="true" /></a>
    : <Link className="student-tip-source" to={model.href}>{label}<FiArrowUpRight aria-hidden="true" /></Link>;
}

function PublishedTipCard({ tip, t }) {
  const model = getStudentTipCardModel(tip);
  const title = model.title || t('Studenttip');
  return <article className="student-tip-card">
    <div className="student-tip-card-top"><span className="student-tip-kicker">{t('Studenttip')}</span>{tip.student_first_name && <span className="student-tip-author">{t('Aanbevolen door {name}', { name: tip.student_first_name })}</span>}</div>
    <h3>{title}</h3>
    {model.description && <p className="student-tip-summary">{model.description}</p>}
    {tip.audience && <div className="student-tip-detail"><span>{t('Voor wie')}</span><p>{tip.audience}</p></div>}
    {tip.learning_outcome && <div className="student-tip-detail"><span>{t('Wat je ervan leert')}</span><p>{tip.learning_outcome}</p></div>}
    {tip.critical_check && <div className="student-tip-detail"><span>{t('Blijf kritisch')}</span><p>{tip.critical_check}</p></div>}
    <TipSource model={model} label={model.external ? t('Open de bron') : t('Bekijk materiaal')} />
  </article>;
}

function MyTipCard({ tip, t }) {
  const model = getStudentTipCardModel(tip);
  return <article className="my-tip-card">
    <div className="my-tip-card-heading"><h3>{model.title || t('Mijn tip')}</h3><span className={`tip-status tip-status-${tip.status}`}>{t(statusText[tip.status] || 'Ingediend')}</span></div>
    <p>{model.description}</p>
    {tip.reviewer_note && <div className="reviewer-note"><strong>{t('Toelichting van de beoordelaar')}</strong><p>{tip.reviewer_note}</p></div>}
    {tip.converted_content_id && <Link to={`/content/${tip.converted_content_id}`} className="student-tip-source">{t('Bekijk het toegevoegde leermateriaal')}<FiArrowUpRight aria-hidden="true" /></Link>}
    {model.href && !tip.converted_content_id && <TipSource model={model} label={model.external ? t('Open de bron') : t('Bekijk materiaal')} />}
  </article>;
}

export default function StudentTips() {
  const { t: defaultTranslate, language } = useLanguage();
  const t = useCallback((key, values) => translateStudentTipText(language, key, values, defaultTranslate), [defaultTranslate, language]);
  const [searchParams] = useSearchParams();
  const requestedContentId = searchParams.get('contentId') || '';
  const [form, setForm] = useState(() => emptyForm(requestedContentId ? 'internal' : 'external', requestedContentId));
  const [materials, setMaterials] = useState([]);
  const [publishedTips, setPublishedTips] = useState([]);
  const [myTips, setMyTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const fieldErrors = useMemo(() => localizeTipValidationErrors(serverErrors, language), [serverErrors, language]);

  const refreshLists = useCallback(async () => {
    const [publishedResponse, mineResponse] = await Promise.all([
      api.get('/student-tips'),
      api.get('/student-tips/mine')
    ]);
    setPublishedTips(publishedResponse.data.data || []);
    setMyTips(mineResponse.data.data || []);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const [publishedResponse, mineResponse, materialsResponse] = await Promise.all([
          api.get('/student-tips'),
          api.get('/student-tips/mine'),
          api.get('/content?limit=100')
        ]);
        if (!active) return;
        const availableMaterials = materialsResponse.data.data || [];
        if (requestedContentId && !availableMaterials.some((item) => String(item.id) === requestedContentId)) {
          try {
            const selectedResponse = await api.get(`/content/${requestedContentId}`);
            if (selectedResponse.data.data) availableMaterials.unshift(selectedResponse.data.data);
          } catch {
            // The library selector remains available if the preselected item is no longer published.
          }
        }
        setPublishedTips(publishedResponse.data.data || []);
        setMyTips(mineResponse.data.data || []);
        setMaterials(availableMaterials);
        if (requestedContentId && availableMaterials.some((item) => String(item.id) === requestedContentId)) {
          setForm((current) => ({ ...current, type: 'internal', contentId: requestedContentId }));
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [requestedContentId, retry]);

  const selectedMaterial = materials.find((item) => String(item.id) === String(form.contentId));
  const translatedFieldError = (field) => {
    const index = serverErrors.findIndex((message) => message.startsWith(`${field} `));
    return index >= 0 ? fieldErrors[index] : '';
  };
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors([]);
    setSubmitError('');
    setNotice('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setServerErrors([]);
    setSubmitError('');
    setNotice('');
    setDuplicateWarning(false);
    try {
      const payload = buildStudentTipPayload(form);
      const response = await api.post('/student-tips', payload);
      setDuplicateWarning(Boolean(response.data.data?.duplicateWarning));
      setNotice(t('Je tip is verstuurd. Je vindt de status terug bij Mijn tips.'));
      setForm(emptyForm());
      try {
        await refreshLists();
      } catch {
        // Keep the confirmation visible even if refreshing the lists is temporarily unavailable.
      }
    } catch (error) {
      const validationMessages = error.response?.data?.errors;
      if (Array.isArray(validationMessages) && validationMessages.length) {
        setServerErrors(validationMessages);
      } else {
        setSubmitError(t('Je tip versturen lukt nu niet. Probeer het opnieuw.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="student-tips-page"><div className="container student-tips-state" role="status"><span className="student-tips-spinner" />{t('Studenttips laden…')}</div></main>;
  if (loadError) return <main className="student-tips-page"><div className="container student-tips-state" role="alert"><h1>{t('Je tips zijn even niet beschikbaar')}</h1><p>{t('Probeer het nog een keer.')}</p><button className="btn btn-primary" onClick={() => setRetry((value) => value + 1)}>{t('Opnieuw proberen')}</button></div></main>;

  return <main className="student-tips-page">
    <div className="container">
      <header className="student-tips-intro">
        <span className="eyebrow">{t('SAMEN LEREN')}</span>
        <h1>{t('Studenttips')}</h1>
        <p>{t('Vind iets dat jou helpt. Deel het met anderen.')}</p>
      </header>

      <section className="student-tips-submit-layout" aria-labelledby="student-tip-form-title">
        <div className="student-tip-panel">
          <div className="student-tip-panel-heading"><span className="student-tip-icon"><FiSend aria-hidden="true" /></span><div><span className="eyebrow">{t('JOUW BIJDRAGE')}</span><h2 id="student-tip-form-title">{t('Deel een tip')}</h2></div></div>
          <p className="student-tip-intro-copy">{t('Deel een les of bron die jou verder hielp. Vertel wat je leerde en wat een ander kritisch mag bekijken.')}</p>

          <form className="student-tip-form" onSubmit={handleSubmit}>
            <fieldset className="student-tip-type-picker">
              <legend>{t('Wat wil je aanbevelen?')}</legend>
              <label className={form.type === 'internal' ? 'selected' : ''}>
                <input type="radio" name="tip-type" value="internal" checked={form.type === 'internal'} onChange={() => updateField('type', 'internal')} />
                <FiBookOpen aria-hidden="true" /><span>{t('Leermateriaal uit de bibliotheek')}</span>
              </label>
              <label className={form.type === 'external' ? 'selected' : ''}>
                <input type="radio" name="tip-type" value="external" checked={form.type === 'external'} onChange={() => updateField('type', 'external')} />
                <FiExternalLink aria-hidden="true" /><span>{t('Een externe bron')}</span>
              </label>
            </fieldset>

            {form.type === 'internal' ? <div className="student-tip-field">
              <label htmlFor="tip-content">{t('Kies leermateriaal')}</label>
              <select id="tip-content" value={form.contentId} onChange={(event) => updateField('contentId', event.target.value)} required>
                <option value="">{t('Selecteer een onderdeel')}</option>
                {materials.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              {selectedMaterial && <div className="selected-material"><FiCheckCircle aria-hidden="true" /><span>{t('Je beveelt aan')}: <strong>{selectedMaterial.title}</strong></span></div>}
            </div> : <>
              <div className="student-tip-field">
                <label htmlFor="tip-title">{t('Titel van de tip')}</label>
                <input id="tip-title" type="text" value={form.title} onChange={(event) => updateField('title', event.target.value)} maxLength={200} required aria-invalid={Boolean(translatedFieldError('title'))} aria-describedby={translatedFieldError('title') ? 'tip-title-error' : undefined} />
                {translatedFieldError('title') && <small id="tip-title-error" className="student-tip-field-error">{translatedFieldError('title')}</small>}
              </div>
              <div className="student-tip-field">
                <label htmlFor="tip-url">{t('Bronlink')}</label>
                <input id="tip-url" type="url" value={form.url} onChange={(event) => updateField('url', event.target.value)} placeholder="https://" maxLength={500} required aria-invalid={Boolean(translatedFieldError('url'))} aria-describedby={translatedFieldError('url') ? 'tip-url-error' : undefined} />
                {translatedFieldError('url') && <small id="tip-url-error" className="student-tip-field-error">{translatedFieldError('url')}</small>}
              </div>
            </>}

            <div className="student-tip-field">
              <label htmlFor="tip-audience">{t('Voor wie is dit nuttig?')}</label>
              <input id="tip-audience" type="text" value={form.audience} onChange={(event) => updateField('audience', event.target.value)} maxLength={200} required aria-invalid={Boolean(translatedFieldError('audience'))} aria-describedby={translatedFieldError('audience') ? 'tip-audience-error' : undefined} />
              {translatedFieldError('audience') && <small id="tip-audience-error" className="student-tip-field-error">{translatedFieldError('audience')}</small>}
            </div>
            <div className="student-tip-field">
              <label htmlFor="tip-outcome">{t('Wat heb je ervan geleerd?')}</label>
              <textarea id="tip-outcome" value={form.learningOutcome} onChange={(event) => updateField('learningOutcome', event.target.value)} rows={3} maxLength={2000} required aria-invalid={Boolean(translatedFieldError('learningOutcome'))} aria-describedby={translatedFieldError('learningOutcome') ? 'tip-outcome-error' : undefined} />
              {translatedFieldError('learningOutcome') && <small id="tip-outcome-error" className="student-tip-field-error">{translatedFieldError('learningOutcome')}</small>}
            </div>
            <div className="student-tip-field">
              <label htmlFor="tip-reason">{t('Waarom raad je het aan?')}</label>
              <textarea id="tip-reason" value={form.recommendationReason} onChange={(event) => updateField('recommendationReason', event.target.value)} rows={3} maxLength={2000} required aria-invalid={Boolean(translatedFieldError('recommendationReason'))} aria-describedby={translatedFieldError('recommendationReason') ? 'tip-reason-error' : undefined} />
              {translatedFieldError('recommendationReason') && <small id="tip-reason-error" className="student-tip-field-error">{translatedFieldError('recommendationReason')}</small>}
            </div>
            <div className="student-tip-field">
              <label htmlFor="tip-critical">{t('Wat moet een ander controleren?')}</label>
              <textarea id="tip-critical" value={form.criticalCheck} onChange={(event) => updateField('criticalCheck', event.target.value)} rows={3} maxLength={2000} required aria-invalid={Boolean(translatedFieldError('criticalCheck'))} aria-describedby={translatedFieldError('criticalCheck') ? 'tip-critical-error' : undefined} />
              {translatedFieldError('criticalCheck') && <small id="tip-critical-error" className="student-tip-field-error">{translatedFieldError('criticalCheck')}</small>}
            </div>

            <fieldset className="student-tip-consent">
              <legend>{t('Jij bepaalt wie je tip te zien krijgt')}</legend>
              <label><input type="checkbox" checked={form.shareWithStudents} onChange={(event) => {
                setForm((current) => ({ ...current, shareWithStudents: event.target.checked, displayFirstName: event.target.checked && current.displayFirstName }));
                setServerErrors([]);
                setSubmitError('');
              }} /> <span><strong>{t('Na beoordeling delen met andere studenten')}</strong><small>{t('Je tip blijft privé totdat een docent hem beoordeelt.')}</small></span></label>
              <label className={!form.shareWithStudents ? 'disabled' : ''}><input type="checkbox" checked={form.displayFirstName} disabled={!form.shareWithStudents} onChange={(event) => updateField('displayFirstName', event.target.checked)} /> <span><strong>{t('Mijn voornaam erbij tonen')}</strong><small>{t('Dit kan alleen als je tip met studenten wordt gedeeld.')}</small></span></label>
            </fieldset>

            {submitError && <div className="student-tip-error" role="alert">{submitError}</div>}
            {notice && <div className="student-tip-success" role="status"><FiCheckCircle aria-hidden="true" />{notice}</div>}
            {duplicateWarning && <div className="student-tip-duplicate" role="status">{t('Deze bron lijkt al eerder gedeeld. Je kunt je tip toch versturen; een docent bekijkt hem.')}</div>}
            <button className="btn btn-primary student-tip-submit" type="submit" disabled={submitting}>{submitting ? t('Tip versturen…') : <>{t('Verstuur je tip')}<FiArrowUpRight aria-hidden="true" /></>}</button>
          </form>
        </div>

        <aside className="student-tip-aside">
          <div className="student-tip-aside-card">
            <span className="student-tip-aside-icon"><FiShield aria-hidden="true" /></span>
            <span className="eyebrow">{t('JOUW KEUZE')}</span>
            <h2>{t('Een goede tip helpt iemand verder.')}</h2>
            <p>{t('Beschrijf wat je eraan had. Een docent beoordeelt de bron en jouw tip voordat die zichtbaar wordt.')}</p>
            <div className="student-tip-aside-points"><span><FiCheckCircle />{t('Je voortgang blijft van jou')}</span><span><FiUsers />{t('Delen is altijd jouw keuze')}</span></div>
          </div>
          <a className="student-tip-aside-link" href="#student-tips-list">{t('Bekijk tips van studenten')}<FiArrowUpRight aria-hidden="true" /></a>
        </aside>
      </section>

      <section className="student-tips-section" id="student-tips-list" aria-labelledby="published-tips-title">
        <div className="student-tips-section-heading"><div><span className="eyebrow">{t('TIPS VAN STUDENTEN')}</span><h2 id="published-tips-title">{t('Wat anderen aanraden')}</h2></div><span className="student-tip-count">{publishedTips.length}</span></div>
        {publishedTips.length ? <div className="student-tip-grid">{publishedTips.map((tip) => <PublishedTipCard key={tip.id} tip={tip} t={t} />)}</div> : <div className="student-tips-empty"><FiUsers aria-hidden="true" /><p>{t('Er zijn nog geen tips gedeeld.')}</p><span>{t('Jouw tip kan de eerste zijn.')}</span></div>}
      </section>

      <section className="student-tips-section my-student-tips" aria-labelledby="my-tips-title">
        <div className="student-tips-section-heading"><div><span className="eyebrow">{t('ALLEEN VOOR JOU')}</span><h2 id="my-tips-title">{t('Mijn tips')}</h2><p>{t('Volg wat er met je inzendingen gebeurt.')}</p></div><span className="student-tip-count">{myTips.length}</span></div>
        {myTips.length ? <div className="my-tip-grid">{myTips.map((tip) => <MyTipCard key={tip.id} tip={tip} t={t} />)}</div> : <div className="student-tips-empty compact"><p>{t('Je hebt nog geen tips ingestuurd.')}</p><span>{t('Je inzendingen zijn privé. Alleen jij en bevoegde beoordelaars kunnen ze zien.')}</span></div>}
      </section>

      <footer className="student-tips-footnote">{t('Leren begrijpen. Zelf blijven denken.')}</footer>
    </div>
  </main>;
}
