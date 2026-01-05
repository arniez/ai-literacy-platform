require('dotenv').config({ path: './config/config.env' });
const { pool } = require('./config/db-postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running content quiz system migration...\n');

  try {
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-content-quiz.sql'),
      'utf8'
    );

    // Execute migration
    await pool.query(migrationSQL);
    console.log('✅ Content quiz tables created successfully!\n');

    // Get all "basis" content items
    const basisContent = await pool.query(`
      SELECT id, title, content_type
      FROM content
      WHERE tags::text LIKE '%basis%'
      ORDER BY id
    `);

    console.log(`📝 Found ${basisContent.rows.length} basis content items\n`);
    console.log('Creating sample quiz questions for basis content...\n');

    // Sample questions for different content types
    const sampleQuestions = {
      'Elements of AI': [
        {
          question: 'Wat is het belangrijkste doel van kunstmatige intelligentie?',
          correct: 'B',
          options: {
            A: 'Computers vervangen door robots',
            B: 'Computers laten taken uitvoeren die menselijke intelligentie vereisen',
            C: 'Nieuwe programmeertalen ontwikkelen',
            D: 'Alleen games maken'
          },
          explanation: 'AI heeft als doel om computers taken te laten uitvoeren die normaal menselijke intelligentie vereisen.'
        },
        {
          question: 'Wat is machine learning?',
          correct: 'A',
          options: {
            A: 'Een methode waarbij computers leren van data zonder expliciet geprogrammeerd te worden',
            B: 'Het handmatig programmeren van alle mogelijke scenario\'s',
            C: 'Een manier om computers sneller te maken',
            D: 'Een nieuwe programmeertaal'
          },
          explanation: 'Machine learning stelt computers in staat om te leren van data en patronen te herkennen.'
        },
        {
          question: 'Wat is een neuraal netwerk geïnspireerd door?',
          correct: 'C',
          options: {
            A: 'Computers',
            B: 'Internet',
            C: 'Het menselijk brein',
            D: 'Robots'
          },
          explanation: 'Neurale netwerken zijn geïnspireerd door de manier waarop het menselijk brein werkt.'
        }
      ],
      'default': [
        {
          question: 'Wat heb je geleerd in deze les?',
          correct: 'A',
          options: {
            A: 'Belangrijke concepten over AI',
            B: 'Niets',
            C: 'Alleen technische details',
            D: 'Geen van bovenstaande'
          },
          explanation: 'Deze les behandelt belangrijke AI concepten.'
        },
        {
          question: 'Waarom is dit onderwerp belangrijk?',
          correct: 'A',
          options: {
            A: 'Het helpt AI beter te begrijpen',
            B: 'Het is niet belangrijk',
            C: 'Alleen voor programmeurs',
            D: 'Voor examens'
          },
          explanation: 'AI begrip is essentieel in de moderne wereld.'
        },
        {
          question: 'Hoe kun je deze kennis toepassen?',
          correct: 'A',
          options: {
            A: 'In dagelijks leven en werk',
            B: 'Helemaal niet',
            C: 'Alleen in schoolprojecten',
            D: 'Alleen theoretisch'
          },
          explanation: 'AI kennis is praktisch toepasbaar in vele situaties.'
        }
      ]
    };

    // Insert questions for each basis content
    for (const content of basisContent.rows) {
      const questions = content.title.includes('Elements')
        ? sampleQuestions['Elements of AI']
        : sampleQuestions['default'];

      console.log(`  Adding questions for: ${content.title}`);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        await pool.query(`
          INSERT INTO content_quiz_questions
          (content_id, question_text, correct_answer, option_a, option_b, option_c, option_d, explanation, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          content.id,
          q.question,
          q.correct,
          q.options.A,
          q.options.B,
          q.options.C,
          q.options.D || null,
          q.explanation,
          i
        ]);
      }

      console.log(`    ✓ ${questions.length} questions added`);
    }

    console.log('\n✅ Sample quiz questions created!\n');
    console.log('📊 Summary:');
    console.log(`   - Content items with quizzes: ${basisContent.rows.length}`);
    console.log(`   - Questions per content: 3`);
    console.log(`   - Total questions created: ${basisContent.rows.length * 3}\n`);

    await pool.end();
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
