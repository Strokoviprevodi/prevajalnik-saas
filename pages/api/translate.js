export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  console.log('POST request received at /api/translate');
  res.status(200).json({ message: 'API deluje!' });
}
