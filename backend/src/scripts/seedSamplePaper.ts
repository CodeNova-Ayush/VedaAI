import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo } from '../config/db';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await connectMongo(uri);

  const assignment = await Assignment.create({
    title: 'Sample Electricity Paper',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    questionTypes: [{ type: 'Short Answer Questions', count: 10, marks: 2 }],
    additionalInstructions: 'Seeded sample for verification.',
    status: 'pending',
  });

  const paper = await GeneratedPaper.create({
    assignmentId: assignment._id,
    schoolName: 'Delhi Public School, Sector-4, Bokaro',
    subject: 'English',
    className: '5th',
    timeAllowed: 45,
    totalMarks: 20,
    sections: [
      {
        title: 'Section A',
        questionType: 'Short Answer Questions',
        instruction: 'Attempt all questions. Each question carries 2 marks',
        questions: [
          { number: 1, difficulty: 'easy', marks: 2, text: 'Define electroplating. Explain its purpose.' },
          { number: 2, difficulty: 'moderate', marks: 2, text: 'What is the role of a conductor in the process of electrolysis?' },
          { number: 3, difficulty: 'easy', marks: 2, text: 'Why does a solution of copper sulfate conduct electricity?' },
          { number: 4, difficulty: 'moderate', marks: 2, text: 'Describe one example of the chemical effect of electric current in daily life.' },
          { number: 5, difficulty: 'moderate', marks: 2, text: 'Explain why electric current is said to have chemical effects.' },
          { number: 6, difficulty: 'challenging', marks: 2, text: 'How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.' },
          { number: 7, difficulty: 'challenging', marks: 2, text: 'What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.' },
          { number: 8, difficulty: 'easy', marks: 2, text: 'Mention the type of current used in electroplating and justify why it is used.' },
          { number: 9, difficulty: 'moderate', marks: 2, text: 'What is the importance of electric current in the field of metallurgy?' },
          { number: 10, difficulty: 'challenging', marks: 2, text: 'Explain with a chemical equation how copper is deposited during the electroplating of an object.' },
        ],
      },
    ],
    answerKey: [
      { number: 1, answer: 'Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.' },
      { number: 2, answer: 'A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.' },
      { number: 3, answer: 'Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity.' },
      { number: 4, answer: 'An example is the electroplating of silver on jewelry to prevent tarnishing.' },
      { number: 5, answer: 'Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.' },
      { number: 6, answer: 'Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons:\n2H2O + 2e- -> H2 + 2OH-\nNa+ + OH- -> NaOH (in solution)' },
      { number: 7, answer: 'At the cathode: water is reduced to hydrogen gas and hydroxide ions.\nAt the anode: water is oxidized to oxygen gas and hydrogen ions.' },
      { number: 8, answer: 'Direct current is used because it allows controlled and uniform deposition of metal.' },
      { number: 9, answer: 'Electric current is used to extract metals through electrolysis and to refine impure metals.' },
      { number: 10, answer: 'Cu2+ + 2e- -> Cu. Copper ions in solution gain electrons at the cathode (the object) and deposit as a copper layer.' },
    ],
  });

  assignment.resultId = paper._id;
  assignment.status = 'complete';
  await assignment.save();

  console.log('Seeded assignment:', assignment._id.toString());
  console.log('Open this in your browser:');
  console.log('  http://localhost:3000/assignments/' + assignment._id.toString() + '/output');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
