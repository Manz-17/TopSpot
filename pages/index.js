import { useState } from 'react';
import Head from 'next/head';

const initialItems = [
  { id: 1, name: 'Neon Drift', link: '#', thumbnail: null, bid: 420 },
  { id: 2, name: 'Shadowmere', link: '#', thumbnail: null, bid: 180 },
  { id: 3, name: 'Puzzle Loop', link: '#', thumbnail: null, bid: 40 },
];

export default function Home() {
  const [items, setItems] = useState(initialItems);
  const [nextId, setNextId] = useState(4);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLink, setAddLink] = useState('');
  const [addBid, setAddBid] = useState('');
  const [preview, setPreview] = useState(null); // { title, thumbnail } | null
  const [loadingPreview, setLoadingPreview] = useState(false);

  const total = items.reduce((s, x) => s + x.bid, 0);
  const sorted = [...items].sort((a, b) => b.bid - a.bid);

  async function fetchPreview() {
    const link = addLink.trim();
    if (!link) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/fetch-link-meta?url=${encodeURIComponent(link)}`);
      const data = await res.json();
      setPreview(data);
    } catch {
      setPreview({ title: link, thumbnail: null });
    }
    setLoadingPreview(false);
  }

  function submitAdd() {
    const bid = parseFloat(addBid);
    if (!addLink.trim() || !preview || !bid || bid <= 0) {
      alert('Paste a link, fetch the preview, and enter a bid above $0.');
      return;
    }
    setItems(prev => [...prev, {
      id: nextId,
      name: preview.title,
      thumbnail: preview.thumbnail,
      link: addLink.trim(),
      bid,
    }]);
    setNextId(nextId + 1);
    setAddModalOpen(false);
    setAddLink(''); setAddBid(''); setPreview(null);
  }

  return (
    <>
      <Head>
        <title>Topspot — Bid for the top</title>
      </Head>

      <header>
        <div className="brand">
          <div className="mark">T</div>
          <div>
            <h1>Topspot</h1>
            <div className="tag">Pay to rank. Highest bid wins the spot.</div>
          </div>
        </div>
        <div className="pot">
          <div className="label">Total staked</div>
          <div className="amount">${total.toLocaleString()}</div>
        </div>
      </header>

      <main>
        <div className="board" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="board-head games">
            <h2>🎮 Games</h2>
            <button className="add-btn" onClick={() => setAddModalOpen(true)}>+ Add</button>
          </div>
          <ul className="list">
            {sorted.length === 0 && <li className="empty">No listings yet — be the first to post.</li>}
            {sorted.map((item, i) => (
              <li className="entry" key={item.id}>
                <div className="rank">#{i + 1}</div>
                <div className="thumb">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  ) : '🔗'}
                </div>
                <div className="info">
                  <a className="name" href={item.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{item.name}</a>
                  <div className="sub">Game</div>
                </div>
                <div className="bid-amt">${item.bid.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer>Live on Vercel — bids are still in-memory for now, no real payments wired up yet.</footer>

      {addModalOpen && (
        <div className="overlay open">
          <div className="modal">
            <h3>Add your game</h3>
            <div className="sub-h">Paste any link — Steam, itch.io, or anywhere else. We'll pull the title and thumbnail.</div>
            <div className="field">
              <label>Game link</label>
              <input
                value={addLink}
                onChange={e => { setAddLink(e.target.value); setPreview(null); }}
                onBlur={fetchPreview}
                placeholder="https://store.steampowered.com/..."
              />
            </div>
            {loadingPreview && <div className="note">Fetching preview…</div>}
            {preview && (
              <div className="field">
                <label>Preview</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {preview.thumbnail && (
                    <img src={preview.thumbnail} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                  <div style={{ fontSize: 13 }}>{preview.title}</div>
                </div>
              </div>
            )}
            <div className="field">
              <label>Starting bid ($)</label>
              <input type="number" value={addBid} onChange={e => setAddBid(e.target.value)} placeholder="10" min="1" />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => { setAddModalOpen(false); setPreview(null); }}>Cancel</button>
              <button className="btn-primary" onClick={submitAdd}>Pay & post</button>
            </div>
            <div className="note">Checkout will run through Polar here — for now this adds it straight to the board.</div>
          </div>
        </div>
      )}
    </>
  );
}
