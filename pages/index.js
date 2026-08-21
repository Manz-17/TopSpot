import { useState } from 'react';
import Head from 'next/head';

const initialState = {
  games: [
    { id: 1, icon: '🕹️', name: 'Neon Drift', bid: 420 },
    { id: 2, icon: '⚔️', name: 'Shadowmere', bid: 180 },
    { id: 3, icon: '🧩', name: 'Puzzle Loop', bid: 40 },
  ],
  videos: [
    { id: 4, icon: '📹', name: 'How I Built This in a Week', bid: 300 },
    { id: 5, icon: '🎬', name: 'Ranking Every Boss Fight', bid: 95 },
  ],
};

export default function Home() {
  const [state, setState] = useState(initialState);
  const [nextId, setNextId] = useState(6);
  const [addModal, setAddModal] = useState(null); // 'games' | 'videos' | null
  const [bidModal, setBidModal] = useState(null); // { cat, id } | null
  const [addIcon, setAddIcon] = useState('');
  const [addName, setAddName] = useState('');
  const [addBid, setAddBid] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  const total = [...state.games, ...state.videos].reduce((s, x) => s + x.bid, 0);

  function sorted(cat) {
    return [...state[cat]].sort((a, b) => b.bid - a.bid);
  }

  function submitAdd() {
    const name = addName.trim();
    const bid = parseFloat(addBid);
    if (!name || !bid || bid <= 0) {
      alert('Add a title and a bid amount above $0.');
      return;
    }
    const icon = addIcon.trim() || '⭐';
    setState(prev => ({
      ...prev,
      [addModal]: [...prev[addModal], { id: nextId, icon, name, bid }],
    }));
    setNextId(nextId + 1);
    setAddModal(null);
    setAddIcon(''); setAddName(''); setAddBid('');
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
            onAdd={() => setAddModal('games')}
            onBid={(id) => setBidModal({ cat: 'games', id })}
          />
          <Board
            title="▶ Videos"
            className="videos"
            items={sorted('videos')}
            catLabel="Video"
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
            <div className="sub-h">Your starting bid sets your first rank.</div>
            <div className="field">
              <label>Icon (any emoji)</label>
              <input value={addIcon} onChange={e => setAddIcon(e.target.value)} placeholder="🚀" maxLength={4} />
            </div>
            <div className="field">
              <label>Title</label>
              <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. My Speedrun Video" />
            </div>
            <div className="field">
              <label>Starting bid ($)</label>
              <input type="number" value={addBid} onChange={e => setAddBid(e.target.value)} placeholder="10" min="1" />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setAddModal(null)}>Cancel</button>
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

function Board({ title, className, items, catLabel, onAdd, onBid }) {
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
            <div className="thumb">{item.icon}</div>
            <div className="info">
              <div className="name">{item.name}</div>
              <div className="sub">{catLabel}</div>
            </div>
            <div className="bid-amt">${item.bid.toLocaleString()}</div>
            <button className="bid-btn" onClick={() => onBid(item.id)}>Bid</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
