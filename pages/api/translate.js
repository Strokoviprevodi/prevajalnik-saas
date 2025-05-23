import { IncomingForm } from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send('Napaka pri nalaganju datoteke');

    const file = files.dokument;
    if (!file) return res.status(400).send('Ni datoteke.');

    const filePath = file[0].filepath;
    const buffer = fs.readFileSync(filePath);
    const text = buffer.toString('utf-8');

    try {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Prevedi naslednje tehnično besedilo iz slovenščine v nemščino. Ohrani strukturo in ton.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      const translatedText = gptResponse.choices[0].message.content;

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

      const docBuffer = await Packer.toBuffer(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=prevod.docx');
      res.send(docBuffer);
    } catch (e) {
      console.error(e);
      res.status(500).send('Napaka pri prevajanju ali generiranju dokumenta.');
    }
  });
}
