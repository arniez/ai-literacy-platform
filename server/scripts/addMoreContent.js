const { pool } = require('../config/db');
require('dotenv').config({ path: './config/config.env' });

const addMoreContent = async () => {
  try {
    console.log('Adding more learning content...\n');

    // Insert additional content
    await pool.query(`
      INSERT INTO content (module_id, title, description, content_type, url, thumbnail_url, duration, difficulty, points_reward, tags, source, is_featured, rating_avg, rating_count)
      VALUES

      -- AI Basiskennis Module (Module 1) - More Content
      (1, 'Neural Networks Explained', 'Visuele uitleg over hoe neurale netwerken werken, van input tot output. Begrijp de basis van deep learning.', 'video', 'https://www.youtube.com/watch?v=aircAruvnKk', 'https://images.unsplash.com/photo-1620825937374-87fc7d6bddc2?w=500', 19, 'beginner', 40, '["neural-networks", "deep-learning", "youtube"]', 'youtube', true, 4.8, 567),

      (1, 'AI vs Machine Learning vs Deep Learning', 'Begrijp de verschillen tussen AI, Machine Learning en Deep Learning met praktische voorbeelden.', 'artikel', '/articles/ai-ml-dl-differences', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500', 15, 'beginner', 30, '["fundamentals", "concepts"]', 'internal', false, 4.3, 234),

      (1, 'Hoe ChatGPT Werkt', 'Een toegankelijke podcast over de technologie achter ChatGPT en andere taalmodellen.', 'podcast', 'https://open.spotify.com/episode/chatgpt-explained', 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500', 35, 'beginner', 35, '["chatgpt", "llm", "spotify"]', 'spotify', false, 4.6, 445),

      (1, 'Interactive AI Playground', 'Experimenteer met verschillende AI-modellen en zie direct de resultaten. Leer door te doen!', 'game', '/games/ai-playground', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', 45, 'intermediate', 50, '["interactive", "hands-on"]', 'internal', true, 4.7, 312),

      -- AI Toepassingen Module (Module 2) - More Content
      (2, 'AI in de Retail: Bol.com Aanbevelingssysteem', 'Case study: Hoe Bol.com machine learning gebruikt om producten aan te bevelen aan klanten.', 'praktijkvoorbeeld', '/cases/bolcom-recommendations', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500', 30, 'intermediate', 45, '["internal", "retail", "recommendations"]', 'internal', true, 4.5, 178),

      (2, 'Computer Vision: Objectherkenning', 'Leer hoe computers afbeeldingen kunnen analyseren en objecten kunnen herkennen met behulp van AI.', 'video', 'https://www.youtube.com/watch?v=computer-vision', 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=500', 22, 'intermediate', 40, '["computer-vision", "image-recognition"]', 'youtube', false, 4.4, 289),

      (2, 'Spraakherkenning en NLP', 'Ontdek hoe AI menselijke taal begrijpt via Natural Language Processing en spraakherkenning.', 'cursus', 'https://www.coursera.org/learn/nlp-basics', 'https://images.unsplash.com/photo-1589254066213-a0c9dc853511?w=500', 120, 'intermediate', 60, '["nlp", "speech-recognition", "coursera"]', 'coursera', false, 4.6, 401),

      (2, 'AI in de Landbouw: Precisielandbouw', 'Praktijkvoorbeeld: Hoe Nederlandse boeren AI en drones gebruiken voor precisielandbouw en opbrengstoptimalisatie.', 'praktijkvoorbeeld', '/cases/precision-farming', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500', 35, 'intermediate', 45, '["internal", "agriculture", "sustainability"]', 'internal', false, 4.2, 156),

      (2, 'Robotica en AI', 'Video over hoe AI robots slimmer maakt en autonome systemen mogelijk maakt.', 'video', 'https://www.youtube.com/watch?v=robotics-ai', 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=500', 18, 'beginner', 35, '["robotics", "automation"]', 'youtube', false, 4.3, 267),

      -- Kritisch Denken Module (Module 3) - More Content
      (3, 'AI Bias en Discriminatie', 'Begrijp hoe AI-systemen vooroordelen kunnen hebben en wat we eraan kunnen doen.', 'artikel', '/articles/ai-bias', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500', 20, 'intermediate', 40, '["ethics", "bias", "fairness"]', 'internal', true, 4.7, 334),

      (3, 'Privacy in het AI-tijdperk', 'Podcast over privacy-uitdagingen bij AI en hoe we onze data kunnen beschermen.', 'podcast', 'https://open.spotify.com/episode/ai-privacy', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500', 40, 'intermediate', 40, '["privacy", "data-protection", "spotify"]', 'spotify', false, 4.5, 267),

      (3, 'Deepfakes Herkennen', 'Interactief spel waarbij je leert onderscheid te maken tussen echte en AI-gegenereerde content.', 'game', '/games/deepfake-detector', 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=500', 25, 'intermediate', 40, '["deepfakes", "media-literacy"]', 'internal', true, 4.6, 445),

      (3, 'AI Governance en Wetgeving', 'Cursus over AI-regelgeving, de EU AI Act en ethische richtlijnen voor AI-ontwikkeling.', 'cursus', '/courses/ai-governance', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500', 90, 'advanced', 70, '["governance", "regulation", "ai-act"]', 'internal', false, 4.4, 189),

      (3, 'Explainable AI (XAI)', 'Leer waarom transparantie in AI belangrijk is en hoe Explainable AI werkt.', 'video', 'https://www.youtube.com/watch?v=explainable-ai', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500', 28, 'advanced', 50, '["xai", "transparency", "interpretability"]', 'youtube', false, 4.5, 223),

      -- Praktische Vaardigheden Module (Module 4) - More Content
      (4, 'Prompt Engineering Masterclass', 'Leer geavanceerde technieken voor het schrijven van effectieve prompts voor ChatGPT en andere AI-tools.', 'cursus', '/courses/prompt-engineering-advanced', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500', 150, 'intermediate', 80, '["prompting", "chatgpt", "hands-on"]', 'internal', true, 4.8, 678),

      (4, 'AI Tools voor Onderzoek', 'Ontdek AI-tools die je kunnen helpen bij literatuuronderzoek, data-analyse en rapportage.', 'video', 'https://www.youtube.com/watch?v=ai-research-tools', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500', 32, 'intermediate', 45, '["research", "productivity", "tools"]', 'youtube', false, 4.6, 389),

      (4, 'AI Beeldgenerator Workshop', 'Hands-on workshop met DALL-E, Midjourney en Stable Diffusion. Creëer je eigen AI-kunstwerken.', 'praktijkvoorbeeld', '/workshops/ai-image-generation', 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=500', 120, 'intermediate', 75, '["internal", "image-generation", "creative", "workshop"]', 'internal', true, 4.9, 534),

      (4, 'Data Science Basics', 'Leer de fundamenten van data science en hoe je data voorbereidt voor machine learning.', 'cursus', 'https://www.datacamp.com/courses/intro-to-data-science', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500', 180, 'intermediate', 90, '["data-science", "python", "datacamp"]', 'datacamp', false, 4.7, 456),

      (4, 'AI Coding Assistant: GitHub Copilot', 'Praktische tutorial over het gebruik van AI als programmeerassistent met GitHub Copilot.', 'video', 'https://www.youtube.com/watch?v=github-copilot', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500', 25, 'intermediate', 40, '["coding", "copilot", "development"]', 'youtube', false, 4.5, 312),

      (4, 'AI Voice Cloning Experiment', 'Experimenteer met voice cloning technologie en leer over de mogelijkheden en risicos.', 'game', '/experiments/voice-cloning', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500', 35, 'advanced', 50, '["voice", "audio", "experiment"]', 'internal', false, 4.3, 234),

      -- Extra Praktijkvoorbeelden voor verschillende sectoren
      (2, 'AI in de Zorg: Diagnostische Ondersteuning', 'Case study: Hoe Amsterdam UMC AI inzet voor medische beeldanalyse en vroegdiagnostiek.', 'praktijkvoorbeeld', '/cases/amc-diagnostics', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500', 40, 'intermediate', 50, '["internal", "healthcare", "diagnostics"]', 'internal', false, 4.6, 201),

      (2, 'KLM: AI voor Vliegtuigonderhoud', 'Praktijkvoorbeeld: Predictive maintenance bij KLM om vliegtuigdefecten te voorspellen en downtime te minimaliseren.', 'praktijkvoorbeeld', '/cases/klm-predictive-maintenance', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500', 35, 'intermediate', 45, '["internal", "aviation", "maintenance"]', 'internal', false, 4.4, 167),

      (2, 'AI in Financiële Dienstverlening', 'Hoe banken AI gebruiken voor kredietbeoordeling, fraudedetectie en klantenservice.', 'video', 'https://www.youtube.com/watch?v=ai-finance', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', 28, 'intermediate', 40, '["finance", "banking", "fintech"]', 'youtube', false, 4.3, 278),

      -- Extra podcasts
      (1, 'AI Mythes Ontkracht', 'Podcast waarin veelvoorkomende misvattingen over AI worden rechtgezet door experts.', 'podcast', 'https://open.spotify.com/episode/ai-myths', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500', 42, 'beginner', 35, '["myths", "facts", "spotify"]', 'spotify', false, 4.4, 356),

      (3, 'AI en Duurzaamheid', 'Podcast over hoe AI kan bijdragen aan klimaatdoelen en duurzame ontwikkeling.', 'podcast', 'https://open.spotify.com/episode/ai-sustainability', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=500', 38, 'intermediate', 40, '["sustainability", "climate", "spotify"]', 'spotify', true, 4.7, 423),

      -- Extra games/interactive content
      (4, 'AI Decision Making Simulator', 'Simuleer AI-beslissingen in verschillende scenario''s en begrijp de consequenties.', 'game', '/games/ai-decision-simulator', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500', 40, 'intermediate', 50, '["decision-making", "simulation", "interactive"]', 'internal', false, 4.5, 289),

      (3, 'Algoritme Bias Test', 'Test je eigen vooroordelen en leer hoe deze in AI-systemen kunnen sluipen.', 'game', '/games/bias-test', 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=500', 20, 'beginner', 30, '["bias", "awareness", "self-test"]', 'internal', false, 4.6, 501)
    `);

    console.log('✅ Added 30+ new learning materials!\n');

    // Get updated counts
    const [counts] = await pool.query(`
      SELECT
        content_type,
        COUNT(*) as count,
        AVG(rating_avg) as avg_rating
      FROM content
      WHERE is_published = true
      GROUP BY content_type
      ORDER BY count DESC
    `);

    console.log('📊 Content Overview:\n');
    counts.forEach(row => {
      console.log(`   ${row.content_type.padEnd(20)} ${String(row.count).padStart(3)} items   ⭐ ${parseFloat(row.avg_rating).toFixed(2)}`);
    });

    const [total] = await pool.query('SELECT COUNT(*) as total FROM content WHERE is_published = true');
    console.log(`\n   📚 Total: ${total[0].total} learning materials\n`);

    console.log('🎉 Content library is ready!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error adding content:', error);
    process.exit(1);
  }
};

addMoreContent();
