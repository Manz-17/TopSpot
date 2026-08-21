import { useState, useEffect } from 'react';
import Head from 'next/head';

const initialState = {
  games: [
    { id: 1, name: 'Neon Drift', link: '#', thumbnail: null, bid: 420 },
    { id: 2, name: 'Shadowmere', link: '#', thumbnail: null, bid: 180 },
    { id: 3, name: 'Puzzle Loop', link: '#', thumbnail: null, bid: 40 },
  ],
  videos: [
    { id: 4, name: 'How I Built This in a Week', link: '#', thumbnail: null, bid: 300 },
    { id: 5, name: 'Ranking Every Boss Fight', link: '#', thumbnail: null, bid: 95 },
  ],
};

export default function Home() {
  const [state, setState] = useState(initialState);
  const [nextId, setNextId] = useState(6);
  const [myId, setMyId] = useState(null);
  const [addModal, setAddModal] = useState(null); // 'games' | 'videos' | null
  const [bidModal, setBidModal] = useState(null); // { cat, id } | null
  const [addLink, setAddLink] = useState('');
  const [addBid, setAddBid] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [preview, setPreview] = useState(null); // { title, thumbnail } | null
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    let id = window.localStorage.getItem('topspot_owner_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem('topspot_owner_id', id);
    }
    setMyId(id);
  }, []);

  const total = [...state.games, ...state.videos].reduce((s, x) => s + x.bid, 0);

  function sorted(cat) {
    return [...state[cat]].sort((a, b) => b.bid - a.bid);
  }

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
    setState(prev => ({
      ...prev,
      [addModal]: [...prev[addModal], {
        id: nextId,
        name: preview.title,
        thumbnail: preview.thumbnail,
        link: addLink.trim(),
        bid,
        ownerId: myId,
      }],
    }));
    setNextId(nextId + 1);
    setAddModal(null);
    setAddLink(''); setAddBid(''); setPreview(null);
  }

  function submitBid() {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      alert('Enter an amount above $0.');
      return;
    }
    setState(prev => ({
      ...prev,
      [bidModal.cat]: prev[bidModal.cat].map(item =>
        item.id === bidModal.id ? { ...item, bid: item.bid + amount } : item
      ),
    }));
    setBidModal(null);
    setBidAmount('');
  }

  const bidTargetItem = bidModal ? state[bidModal.cat].find(x => x.id === bidModal.id) : null;

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
        <div className="boards">
          <Board
            title="🎮 Games"
            className="games"
            items={sorted('games')}
            catLabel="Game"
            myId={myId}
            onAdd={() => setAddModal('games')}
            onBid={(id) => setBidModal({ cat: 'games', id })}
          />
          <Board
            title="▶ Videos"
            className="videos"
            items={sorted('videos')}
            catLabel="Video"
            myId={myId}
            onAdd={() => setAddModal('videos')}
            onBid={(id) => setBidModal({ cat: 'videos', id })}
          />
        </div>
      </main>

      <footer>Live on Vercel — bids are still in-memory for now, no real payments wired up yet.</footer>

      {addModal && (
        <div className="overlay open">
          <div className="modal">
            <h3>Add to the board</h3>
            <div className="sub-h">Paste a link — we'll pull the title and thumbnail.</div>
            <div className="field">
              <label>Link (game page or YouTube video)</label>
              <input
                value={addLink}
                onChange={e => { setAddLink(e.target.value); setPreview(null); }}
                onBlur={fetchPreview}
                placeholder="https://..."
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
              <button className="btn-ghost" onClick={() => { setAddModal(null); setPreview(null); }}>Cancel</button>
              <button className="btn-primary" onClick={submitAdd}>Pay & post</button>
            </div>
            <div className="note">Checkout will run through Polar here — for now this adds it straight to the board.</div>
          </div>
        </div>
      )}

      {bidModal && bidTargetItem && (
        <div className="overlay open">
          <div className="modal">
            <h3>Add to your bid</h3>
            <div className="sub-h">{bidTargetItem.name} — current bid ${bidTargetItem.bid.toLocaleString()}</div>
            <div className="field">
              <label>Amount to add ($)</label>
              <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="10" min="1" />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setBidModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitBid}>Pay & boost</button>
            </div>
            <div className="note">This tops up the existing bid — total goes up, rank re-sorts.</div>
          </div>
        </div>
      )}
    </>
  );
}

function Board({ title, className, items, catLabel, myId, onAdd, onBid }) {
  return (
    <div className="board">
      <div className={`board-head ${className}`}>
        <h2>{title}</h2>
        <button className="add-btn" onClick={onAdd}>+ Add</button>
      </div>
      <ul className="list">
        {items.length === 0 && <li className="empty">No listings yet — be the first to post.</li>}
        {items.map((item, i) => (
          <li className="entry" key={item.id}>
            <div className="rank">#{i + 1}</div>
            <div className="thumb">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              ) : '🔗'}
            </div>
            <div className="info">
              <a className="name" href={item.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{item.name}</a>
              <div className="sub">{catLabel}</div>
            </div>
            <div className="bid-amt">${item.bid.toLocaleString()}</div>
            {item.ownerId && item.ownerId === myId && (
              <button className="bid-btn" onClick={() => onBid(item.id)}>Bid</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
