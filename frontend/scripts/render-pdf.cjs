/* Verify PDF rendering using the same component as the app */
const path = require('path');
const fs = require('fs');
require('@babel/register')({
  extensions: ['.tsx', '.ts'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  babelrc: false,
  configFile: false,
  cache: false,
});

const React = require('react');
const { renderToBuffer } = require('@react-pdf/renderer');
const PaperPdf = require('../src/components/PaperPdf').default;

const paper = {
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
};

(async () => {
  const out = process.argv[2] || './out.pdf';
  console.log('rendering...');
  const buf = await renderToBuffer(React.createElement(PaperPdf, { paper }));
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, buf.length, 'bytes');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
