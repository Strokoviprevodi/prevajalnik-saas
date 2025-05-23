export default function Home() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/translate', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Naloži dokument za prevod</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit">Preveri API</button>
      </form>
    </div>
  );
}
