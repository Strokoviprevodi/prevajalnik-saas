const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { OpenAI } = require('openai');


// 🔐 API ključ (zamenjaj z dejanskim)
require('dotenv').config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
});

const app = express();
const PORT = 3000;

const { Document, Packer, Paragraph, TextRun } = require('docx');
const fsPromises = require('fs').promises;

// 📂 Konfiguracija nalaganja
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// 🌐 Služi HTML stran
app.use(express.static('public'));
app.use('/prenesi', express.static(path.join(__dirname, 'uploads')));

// 📄 Sprejem dokumenta + prevod
app.post('/upload', upload.single('dokument'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Ni datoteke.');
  }

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();

  try {
    let extractedText = '';

    if (fileExt === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (fileExt === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else {
      return res.status(400).send('Podprti so le .pdf in .docx dokumenti.');
    }

    // 🔁 Pošlji besedilo GPT-ju
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Prevedi naslednje tehnično besedilo iz slovenščine v nemščino. Ohrani strokovni ton."
        },
        {
          role: "user",
          content: extractedText
        }
      ]
    });

    const translatedText = gptResponse.choices[0].message.content;
	// 📄 Ustvari .docx z prevedenim besedilom
	const doc = new Document({
	  sections: [
		{
		  children: translatedText.split('\n').map(line =>
			new Paragraph({
			  children: [new TextRun(line)],
			})
		  ),
		},
	  ],
	});

const buffer = await Packer.toBuffer(doc);
await fs.promises.writeFile('./uploads/translated.docx', buffer);
console.log('✅ Preveden dokument shranjen kot uploads/translated.docx');
	
	

    console.log('✅ Prevod v nemščino:\n' + translatedText);
    res.send('Prevod uspešno zaključen! Preveri terminal.');
	
	   
  } catch (err) {
    console.error('❌ Napaka pri prevodu:', err);
    res.status(500).send('Napaka pri obdelavi datoteke.');
  }
});

// ▶️ Zagon strežnika
app.listen(PORT, () => {
  console.log(`🚀 Strežnik teče na http://localhost:${PORT}`);
});
