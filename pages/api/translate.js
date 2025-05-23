import formidable from 'formidable';
import fs from 'fs/promises';
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

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Napaka pri nalaganju datoteke');
    }

    const file = files.dokument?.[0];
    if (!file) return res.status(400).send('Ni datoteke.');

    try {
      const buffer = await fs.readFile(file.filepath);
      const besedilo = buffer.toString('utf-8');

      const gpt = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Prevedi naslednje tehnično besedilo iz slovenščine v nemščino. Ohrani strukturo in ton.',
          },
          {
            role: 'user',
            content: besedilo,
          },
        ],
      });

      const prevod = gpt.choices[0].message.content;

      const doc = new Document({
        sections: [
          {
            children: prevod.split('\n').map(line =>
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
