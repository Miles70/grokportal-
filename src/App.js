import React, { useState, useEffect, useRef } from 'react';
import { WagmiProvider, createConfig, useConnect, useDisconnect, useAccount } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { metaMask } from '@wagmi/connectors';
import { http } from 'wagmi';
import { getAIResponse } from './grokPrompts';
import StarsBackground from './StarsBackground';
import WhitelistBox from './WhitelistBox';
import './App.css';

const config = createConfig({
  chains: [bsc],
  connectors: [metaMask()],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
  },
});

function App() {
  const [messages, setMessages] = useState([
    { from: 'ai', text: "Hello 👋 I'm XGROK AI. How can I assist you today?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address, status } = useAccount();
  const chatBodyRef = useRef(null);

  useEffect(() => {
    console.log('Account status:', { isConnected, address, status });
  }, [isConnected, address, status]);

  // Yeni mesajda otomatik alta kaydırma
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    const newMessages = [...messages, { from: 'user', text: input }];
    setMessages(newMessages);

    const aiResponse = await getAIResponse(input);
    newMessages.push({ from: 'ai', text: aiResponse });
    setMessages([...newMessages]);
    setInput('');
    setIsLoading(false);
  };

  const roadmapData = [
    {
      icon: '🪐',
      title: 'Phase 0 – The Awakening',
      desc: 'The chain is broken. A light leaks from the shadow. The seed of XGROK is planted.',
      points: ['🔸 Project birth', '🔸 Commander Miles awakens', '🔸 Manifesto written'],
      percent: 100,
    },
    {
      icon: '🚗',
      title: 'Phase 1 – Initialization',
      desc: 'The chain is lit.',
      points: ['🌐 Website', '🤖 AI chat', '💬 Community'],
      percent: 100,
    },
    {
      icon: '🔥',
      title: 'Phase 2 – Presale Madness',
      desc: 'Crowds awaken. The tower lights up.',
      points: ['🔗 Token', '👥 Community', '📈 Presale', '💰 Sales'],
      percent: 70,
    },
    {
      icon: '🎯',
      title: 'Phase 3 – Airdrop & Engagement',
      desc: 'Reward time. Only those who move, win.',
      points: ['🔸 Airdrop missions', '🔸 X/Twitter engagement', '🔸 Telegram mini tasks'],
      percent: 80,
    },
    {
      icon: '💥',
      title: 'Phase 3.5 – Operation Viralstorm',
      desc: 'XGROK memes everywhere. We are the trend.',
      points: ['🔸 Meme waves', '🔸 AI-powered viral content', '🔸 Tweetstorms, TikToks, Reels'],
      percent: 10,
    },
    {
      icon: '🌌',
      title: 'Phase 4 – Market Expansion',
      desc: 'Markets open. The storm spreads.',
      points: ['🔸 Influencer collaborations', '🔸 Mini-game integrations', '🔸 Token utility expansion'],
      percent: 20,
    },
    {
      icon: '🤝',
      title: 'Phase 4.5 – Alliance Protocol',
      desc: 'We are not alone. Kingdoms unite.',
      points: ['🔸 Partnerships', '🔸 Launchpad meetings', '🔸 Partner CEX/DEX connections'],
      percent: 0,
    },
    {
      icon: '🏛️',
      title: 'Phase 5 – CEX Quest',
      desc: 'They who ignored the throne, will now face it.',
      points: ['🔸 Medium-large CEX listings', '🔸 Liquidity boost', '🔸 Trust wave'],
      percent: 0,
    },
    {
      icon: '🧬',
      title: 'Phase 6 – Memevolution',
      desc: 'Not a token... a memetic organism.',
      points: ['🔸 Community governance', '🔸 AI-powered meme generator', '🔸 DAO system'],
      percent: 0,
    },
    {
      icon: '👑',
      title: 'Phase 6.5 – The Crown',
      desc: 'XGROK is no longer a kingdom... it’s a civilization.',
      points: ['🔸 DAO voting', '🔸 Commander Council'],
      percent: 0,
    },
    {
      icon: '🌠',
      title: 'Phase 7 – Holographic AI R&D',
      desc: 'The Meme King takes form with immersive holographic technology.',
      points: ['🔬 Holographic Research', '🤖 AR/VR integration', '💡 Interactive AI'],
      percent: 0,
    },
  ];

  const handleConnect = async () => {
    try {
      await connectAsync({ connector: connectors[0] });
      console.log('Connection successful');
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const handleWhitepaperClick = (e) => {
    e.preventDefault();
    window.open('/assets/xgrok_whitepaper_v1.1.pdf', '_blank');
  };

  return (
    <WagmiProvider config={config}>
      <div className="app-container">
        <StarsBackground />
        <div className="connect-wallet-container">
          {isConnected ? (
            <div className="wallet-address-container">
              <button
                className="connect-btn disconnect-btn"
                onClick={() => {
                  disconnect();
                  setTimeout(() => window.location.reload(), 300);
                }}
              >
                Disconnect
              </button>
              <div className="wallet-address-text">
                🦊 {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
          ) : (
            <button className="connect-btn" onClick={handleConnect}>
              Connect Wallet
            </button>
          )}
        </div>

        <div className="whitepaper-header">
          <button
            className="whitepaper-btn"
            onClick={handleWhitepaperClick}
          >
            📄 Whitepaper
          </button>
        </div>

        <WhitelistBox account={address} />

        <div className="container">
          <img src="/xgrok_logo.png" alt="XGROK Logo" className="xgrok-logo" />
          <div className="xgrok-ai-chat-window">
            <div className="chat-header">
              <img src="/xgrok_ai_logo.png" alt="XGROK AI" className="chat-logo" />
              <span>XGROK AI</span>
            </div>
            <div className="chat-body" ref={chatBodyRef}>
              {messages.map((msg, i) => (
                <p key={i} className={msg.from}>{msg.text}</p>
              ))}
              {isLoading && <div className="loading">Yükleniyor... <span className="spinner"></span></div>}
            </div>
            <div className="chat-input">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Mesajını yaz kanka..."
              />
              <button onClick={sendMessage} disabled={isLoading}>
                {isLoading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>

        <div className="section-box tasks-section">
          <div className="task-card">🦊 <span>Connect Wallet</span>: Use MetaMask or WalletConnect</div>
          <div className="task-card">💳 <span>Buy BNB/USDT</span>: Transfer BNB or USDT to your wallet</div>
          <div className="task-card">🌐 <span>Join Presale</span>: Swap BNB/USDT for $XGROK via the presale portal</div>
        </div>

        <div className="section-box info-section roadmap-section">
          <h2 className="glowing-title">🚀 XGROK ROADMAP – FULL REFORGED VERSION</h2>
          <p className="roadmap-sub">“This is not a plan. It’s a prophecy.”</p>
          {roadmapData.map((phase, index) => (
            <div className="roadmap-card" key={index}>
              <h3>{phase.icon} {phase.title}</h3>
              <p className="roadmap-desc">{phase.desc}</p>
              <ul>{phase.points.map((pt, idx) => <li key={idx}>{pt}</li>)}</ul>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${phase.percent}%` }}></div>
              </div>
              <div className="progress-label">{phase.percent}%</div>
            </div>
          ))}
        </div>

        <div className="section-box info-section">
          <h2>📊 Tokenomics</h2>
          <div className="tokenomics-breakdown">
            <div className="tokenomics-row">👥 Presale — <b>33%</b>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '33%' }}></div></div>
            </div>
            <div className="tokenomics-row">💧 Liquidity Pool — <b>25%</b>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '25%' }}></div></div>
            </div>
            <div className="tokenomics-row">🛡️ Team Reserve — <b>10%</b>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '10%' }}></div></div>
            </div>
            <div className="tokenomics-row">📢 Marketing & Community — <b>15%</b>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '15%' }}></div></div>
            </div>
            <div className="tokenomics-row">🌍 Ecosystem Development — <b>17%</b>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '17%' }}></div></div>
            </div>
            <div className="tokenomics-row">🔥 Burn — <b>200T+ tokens</b> will be burned over phases</div>
          </div>
          <div className="tokenomics-utility">
            <h3 style={{ color: 'gold', marginTop: '24px' }}>🛠️ Utility</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 0 }}>
              <li>🔄 <b>Staking:</b> Earn rewards by holding</li>
              <li>🗳️ <b>Governance:</b> Vote on community decisions</li>
              <li>💎 <b>Holder Perks:</b> Surprise airdrops & raffles</li>
              <li>🌊 <b>Liquidity Mining:</b> Get rewards as LP provider</li>
              <li>🔥 <b>Burn:</b> 200T+ tokens will be gradually burned to increase scarcity</li>
            </ul>
          </div>
          <div style={{ marginTop: '18px', fontWeight: 'bold', color: 'gold' }}>
            Total Supply: 666,000,000,000,000 $XGROK
          </div>
        </div>

        <div className="partners">
          <div className="partners-title">🤝 Our Partners</div>
          <div className="section-box">
            <div className="partners-slider">
              <img src="/partners/binance.png" alt="binance" />
              <img src="/partners/uniswap.png" alt="uniswap" />
              <img src="/partners/solana.png" alt="solana" />
              <img src="/partners/ethereum.png" alt="ethereum" />
              <img src="/partners/openai.png" alt="openai" className="openai-logo" />
            </div>
          </div>
        </div>

        <div className="audit-certik">
          <img
            src="/audit/audit-logo.png"
            alt="Audit Logo"
            className="certik-logo"
          />
        </div>

        <div className="floating-social-links">
          <a href="https://t.me/Xgrokkk" target="_blank" rel="noopener noreferrer">
            <img src="/icons/telegram.png" alt="Telegram" />
          </a>
          <a href="https://twitter.com/Xgrokkk" target="_blank" rel="noopener noreferrer">
            <img src="/icons/twitter.png" alt="Twitter" />
          </a>
          <a href="https://instagram.com/xgrokkk" target="_blank" rel="noopener noreferrer">
            <img src="/icons/instagram.png" alt="Instagram" />
          </a>
        </div>
      </div>
    </WagmiProvider>
  );
}

export default App;
