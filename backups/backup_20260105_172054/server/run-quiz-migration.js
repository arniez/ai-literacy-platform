require('dotenv').config({ path: './config/config.env' });
const { pool } = require('./config/db-postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running quiz system migration...\n');

  try {
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-quiz-system.sql'),
      'utf8'
    );

    // Execute migration
    await pool.query(migrationSQL);
    console.log('✅ Quiz tables created successfully!\n');

    // Insert sample quiz for AI Basiskennis module (module_id = 1)
    console.log('📝 Creating sample quiz for AI Basiskennis module...\n');

    const quizResult = await pool.query(`
      INSERT INTO quizzes (module_id, title, description, passing_score, time_limit)
      VALUES (1, 'AI Basiskennis Toets', 'Test je kennis over de basisconcepten van AI en machine learning', 70, 30)
      RETURNING id
    `);

    const quizId = quizResult.rows[0].id;
    console.log(`✅ Quiz created with ID: ${quizId}\n`);

    // Insert questions
    const questions = [
      {
        text: 'Wat is het verschil tussen AI en Machine Learning?',
        options: [
          { text: 'AI is een subset van Machine Learning', correct: false },
          { text: 'Machine Learning is een subset van AI', correct: true },
          { text: 'Ze zijn hetzelfde', correct: false },
          { text: 'Ze hebben geen relatie', correct: false }
        ]
      },
      {
        text: 'Wat is supervised learning?',
        options: [
          { text: 'Leren zonder gelabelde data', correct: false },
          { text: 'Leren met gelabelde voorbeelden', correct: true },
          { text: 'Leren door trial and error', correct: false },
          { text: 'Leren zonder feedback', correct: false }
        ]
      },
      {
        text: 'Wat is een neuraal netwerk?',
        options: [
          { text: 'Een netwerk van computers', correct: false },
          { text: 'Een biologisch brein', correct: false },
          { text: 'Een computermodel geïnspireerd door het menselijk brein', correct: true },
          { text: 'Een sociale media platform', correct: false }
        ]
      },
      {
        text: 'Wat is het doel van training data?',
        options: [
          { text: 'Het AI model te testen', correct: false },
          { text: 'Het AI model te leren patronen herkennen', correct: true },
          { text: 'Het AI model te verkopen', correct: false },
          { text: 'Het AI model te verwijderen', correct: false }
        ]
      },
      {
        text: 'Wat betekent "overfitting" in machine learning?',
        options: [
          { text: 'Het model werkt te goed', correct: false },
          { text: 'Het model is te groot', correct: false },
          { text: 'Het model past te veel op trainingsdata en generaliseert slecht', correct: true },
          { text: 'Het model traint te snel', correct: false }
        ]
      },
      {
        text: 'Welke van deze is GEEN type machine learning?',
        options: [
          { text: 'Supervised Learning', correct: false },
          { text: 'Unsupervised Learning', correct: false },
          { text: 'Reinforcement Learning', correct: false },
          { text: 'Quantum Learning', correct: true }
        ]
      },
      {
        text: 'Wat is natuurlijke taalverwerking (NLP)?',
        options: [
          { text: 'Het proces van het vertalen van talen', correct: false },
          { text: 'Het vermogen van computers om menselijke taal te begrijpen', correct: true },
          { text: 'Een programmeer taal', correct: false },
          { text: 'Een soort database', correct: false }
        ]
      },
      {
        text: 'Wat is deep learning?',
        options: [
          { text: 'Leren onder water', correct: false },
          { text: 'Een subset van machine learning met neurale netwerken met meerdere lagen', correct: true },
          { text: 'Zeer moeilijk leren', correct: false },
          { text: 'Leren in de diepte', correct: false }
        ]
      },
      {
        text: 'Wat is een algoritme?',
        options: [
          { text: 'Een soort computer', correct: false },
          { text: 'Een set instructies om een probleem op te lossen', correct: true },
          { text: 'Een programmeer taal', correct: false },
          { text: 'Een database', correct: false }
        ]
      },
      {
        text: 'Waarvoor wordt AI NIET gebruikt?',
        options: [
          { text: 'Spraakherkenning', correct: false },
          { text: 'Beeldherkenning', correct: false },
          { text: 'Voorspellingen maken', correct: false },
          { text: 'Koffie zetten zonder machine', correct: true }
        ]
      }
    ];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // Insert question
      const questionResult = await pool.query(`
        INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index)
        VALUES ($1, $2, 'multiple_choice', 1, $3)
        RETURNING id
      `, [quizId, q.text, i]);

      const questionId = questionResult.rows[0].id;

      // Insert options
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await pool.query(`
          INSERT INTO quiz_question_options (question_id, option_text, is_correct, order_index)
          VALUES ($1, $2, $3, $4)
        `, [questionId, opt.text, opt.correct, j]);
      }

      console.log(`  ✓ Question ${i + 1} added`);
    }

    console.log('\n✅ Sample quiz created with 10 questions!\n');
    console.log('📊 Summary:');
    console.log(`   - Quiz ID: ${quizId}`);
    console.log(`   - Module: AI Basiskennis`);
    console.log(`   - Questions: ${questions.length}`);
    console.log(`   - Passing score: 70%`);
    console.log(`   - Time limit: 30 minutes\n`);

    await pool.end();
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
