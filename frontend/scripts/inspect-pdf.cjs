const fs = require('fs');
const { PDFParse } = require('pdf-parse');
(async () => {
  const data = fs.readFileSync(process.argv[2]);
  const parser = new PDFParse({ data });
  const text = await parser.getText();
  console.log('---TEXT---');
  console.log(text.text);
})();
