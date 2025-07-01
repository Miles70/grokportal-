/* global BigInt */
import React, { useState, useEffect } from 'react';
import { useSwitchChain, useAccount, useChainId, useConnect } from 'wagmi';
import { ethers } from 'ethers';
import { metaMask } from '@wagmi/connectors';
import './WhitelistBox.css';

const DAY_MS = 24 * 60 * 60 * 1000;

const WhitelistBox = () => {
  // Sabit başlangıç ve bitiş tarihi (UTC tabanlı, global kitle için)
  const WHITELIST_START = new Date('2025-06-29T21:52:00Z').getTime(); // 30 Haziran 2025 00:52 +03:00 eşdeğeri
  const WHITELIST_END = new Date('2025-08-28T21:52:00Z').getTime(); // 29 Ağustos 2025 00:52 +03:00 eşdeğeri

  const [timeLeft, setTimeLeft] = useState('');
  const [joined, setJoined] = useState(3);
  const [currency, setCurrency] = useState('BNB');
  const [bnbAmount, setBnbAmount] = useState('0.008');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const { switchChainAsync } = useSwitchChain();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();

  const recipientAddress = '0x7cd14dd705f5e05d8b1b9853245cc60bd8251ff4';
  const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
  const USDT_ABI = [
    'function transfer(address to, uint amount) public returns (bool)',
    'function balanceOf(address account) public view returns (uint256)',
  ];

  // Dil desteği için mesajlar
  const messages = {
    en: {
      connectingWallet: 'Connecting wallet...',
      walletConnected: 'Wallet connected, checking network...',
      switchingNetwork: 'Switching to BSC network...',
      checkingBalance: 'Checking balance...',
      sendingBNB: (gasCost) => `Sending BNB (~${gasCost} BNB gas fee)`,
      sendingUSDT: (gasCost) => `Sending USDT (~${gasCost} BNB gas fee)`,
      awaitingConfirmation: 'Awaiting transaction confirmation...',
      paymentSuccessful: 'Payment successful!',
      noMetaMask: 'MetaMask not detected. Please install MetaMask and try again.',
      mobileRedirect: 'Redirecting to MetaMask app...',
      connectionRejected: 'Wallet connection rejected.',
      connectionError: (error) => `Connection error: ${error}`,
      networkSwitchRejected: 'Network switch rejected. Please switch to BSC in MetaMask.',
      networkSwitchError: (error) => `Network switch error: ${error}`,
      insufficientBNB: (required, available) => `Insufficient BNB balance. Required: ${required} BNB, Available: ${available} BNB.`,
      insufficientUSDT: (available) => `Insufficient USDT balance. Required: 5 USDT, Available: ${available} USDT.`,
      insufficientGas: (required) => `Insufficient BNB for gas fees. Required: ${required} BNB.`,
      transactionError: 'Transaction failed or was canceled. Please check your wallet.',
      apiError: 'Failed to fetch BNB price. Please try again later.',
    },
    tr: {
      connectingWallet: 'Cüzdan bağlanıyor...',
      walletConnected: 'Cüzdan bağlandı, ağ kontrol ediliyor...',
      switchingNetwork: 'BSC ağına geçiliyor...',
      checkingBalance: 'Bakiye kontrol ediliyor...',
      sendingBNB: (gasCost) => `BNB gönderiliyor (~${gasCost} BNB gas ücreti)`,
      sendingUSDT: (gasCost) => `USDT gönderiliyor (~${gasCost} BNB gas ücreti)`,
      awaitingConfirmation: 'İşlem onayı bekleniyor...',
      paymentSuccessful: 'Ödeme başarılı!',
      noMetaMask: 'MetaMask yüklü değil. Lütfen MetaMask kurun ve tekrar deneyin.',
      mobileRedirect: 'MetaMask uygulamasına yönlendiriliyor...',
      connectionRejected: 'Cüzdan bağlantısı reddedildi.',
      connectionError: (error) => `Bağlantı hatası: ${error}`,
      networkSwitchRejected: 'Ağ değiştirme reddedildi. Lütfen MetaMask’ten BSC ağına geçin.',
      networkSwitchError: (error) => `Ağ değiştirme hatası: ${error}`,
      insufficientBNB: (required, available) => `Yetersiz BNB bakiyesi. Gerekli: ${required} BNB, Mevcut: ${available} BNB.`,
      insufficientUSDT: (available) => `Yetersiz USDT bakiyesi. Gerekli: 5 USDT, Mevcut: ${available} USDT.`,
      insufficientGas: (required) => `Yetersiz BNB bakiyesi. Gas için ${required} BNB gerekli.`,
      transactionError: 'İşlem başarısız veya iptal edildi. Lütfen cüzdanınızı kontrol edin.',
      apiError: 'BNB fiyatı alınamadı. Lütfen daha sonra tekrar deneyin.',
    },
  };

  // Tarayıcı dilini tespit et (varsayılan: İngilizce)
  const userLanguage = navigator.language.startsWith('tr') ? 'tr' : 'en';

  /* ---------------- BNB fiyatını çek ---------------- */
  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        if (!res.ok) throw new Error('BNB fiyatı alınamadı.');
        const data = await res.json();
        const price = data.binancecoin.usd;
        setBnbAmount((5 / price).toFixed(6));
      } catch {
        alert(messages[userLanguage].apiError);
        setBnbAmount('--');
      }
    };
    fetchBnbPrice();
  }, [userLanguage]);

  /* ---------------- Geri sayım ---------------- */
  useEffect(() => {
    const getTimeLeft = () => {
      const now = Date.now();
      if (now >= WHITELIST_END) {
        return 'Whitelist has ended!';
      }

      const diff = Math.max(0, WHITELIST_END - now);
      const days = Math.floor(diff / DAY_MS);
      const hrs = Math.floor((diff % DAY_MS) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);

      return `${days}d ${hrs}h ${mins}m ${secs}s`;
    };

    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => {
      const newTimeLeft = getTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft === 'Whitelist has ended!') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- Confetti efekti ---------------- */
  useEffect(() => {
    const whitelistBox = document.querySelector('.whitelist-box');
    if (!whitelistBox) return;

    const colors = ['cyan', 'yellow', 'green', 'pink'];
    const interval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.classList.add(randomColor);
        const width = Math.random() * 8 + 8;
        const height = Math.random() * 4 + 2;
        confetti.style.width = `${width}px`;
        confetti.style.height = `${height}px`;
        const boxWidth = whitelistBox.offsetWidth;
        confetti.style.left = `${Math.random() * boxWidth}px`;
        confetti.style.top = '0px';
        confetti.style.animationDuration = `${Math.random() * 4 + 8}s`;
        whitelistBox.appendChild(confetti);
        confetti.addEventListener('animationend', () => confetti.remove());
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- Whitelist’e katıl ---------------- */
  const joinWhitelist = async () => {
    if (!window.ethereum) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        alert(messages[userLanguage].mobileRedirect);
        window.location.href = 'https://metamask.app.link/dapp/' + window.location.host;
      } else {
        alert(messages[userLanguage].noMetaMask);
      }
      return;
    }

    setLoading(true);
    setStatus(messages[userLanguage].connectingWallet);

    try {
      if (!isConnected || !address) {
        await connectAsync({ connector: metaMask() });
        setStatus(messages[userLanguage].walletConnected);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (chainId !== 56) {
        setStatus(messages[userLanguage].switchingNetwork);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
        let attempts = 0;
        let net = await provider.getNetwork();
        while (net.chainId !== 56n && attempts < 5) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          net = await provider.getNetwork();
          attempts++;
        }
        if (net.chainId !== 56n) throw new Error('Network switch failed');
      }

      setStatus(messages[userLanguage].checkingBalance);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? ethers.parseUnits('5', 'gwei');

      if (currency === 'BNB') {
        const balance = await provider.getBalance(address);
        const requiredAmount = ethers.parseEther(bnbAmount);
        const gasEstimate = await provider.estimateGas({
          to: recipientAddress,
          value: requiredAmount,
        });
        const gasCost = gasPrice * BigInt(gasEstimate);
        const totalRequired = requiredAmount + gasCost;

        if (balance < totalRequired) {
          throw new Error(messages[userLanguage].insufficientBNB(
            ethers.formatEther(totalRequired),
            ethers.formatEther(balance)
          ));
        }

        setStatus(messages[userLanguage].sendingBNB(ethers.formatEther(gasCost)));
        const tx = await signer.sendTransaction({
          to: recipientAddress,
          value: requiredAmount,
          gasLimit: gasEstimate,
          gasPrice,
        });
        setStatus(messages[userLanguage].awaitingConfirmation);
        await tx.wait();
      } else if (currency === 'USDT') {
        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
        const balance = await usdtContract.balanceOf(address);
        const requiredAmount = ethers.parseUnits('5', 18);
        const gasEstimate = await usdtContract.estimateGas.transfer(recipientAddress, requiredAmount);
        const gasCost = gasPrice * BigInt(gasEstimate);
        const bnbBalance = await provider.getBalance(address);

        if (balance < requiredAmount) {
          throw new Error(messages[userLanguage].insufficientUSDT(ethers.formatUnits(balance, 18)));
        }
        if (bnbBalance < gasCost) {
          throw new Error(messages[userLanguage].insufficientGas(ethers.formatEther(gasCost)));
        }

        setStatus(messages[userLanguage].sendingUSDT(ethers.formatEther(gasCost)));
        const transferTx = await usdtContract.transfer(recipientAddress, requiredAmount, {
          gasLimit: gasEstimate,
          gasPrice,
        });
        setStatus(messages[userLanguage].awaitingConfirmation);
        await transferTx.wait();
      }

      setJoined((prev) => prev + 1);
      setSuccess(true);
      setStatus(messages[userLanguage].paymentSuccessful);
      setTimeout(() => {
        setSuccess(false);
        setStatus('');
      }, 5000);
    } catch (error) {
      console.error('İşlem hatası:', error.message);
      if (error.code === 4001 && error.message.includes('wallet_switchEthereumChain')) {
        alert(messages[userLanguage].networkSwitchRejected);
      } else if (error.code === 4001) {
        alert(messages[userLanguage].connectionRejected);
      } else if (error.message.includes('Network switch failed')) {
        alert(messages[userLanguage].networkSwitchError(error.message));
      } else if (error.message.includes('Connection error')) {
        alert(messages[userLanguage].connectionError(error.message));
      } else {
        alert(messages[userLanguage].transactionError);
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="whitelist-box">
      <h2>WHITELIST IS LIVE</h2>
      <p>Unbelievable rewards await before presale begins! 🎁</p>
      <p className="fomo-message">Most will scroll past. A few will enter. And only they will understand. 🚀</p>
      {timeLeft === 'Whitelist has ended!' ? (
        <p className="time-left">Whitelist has ended!</p>
      ) : (
        <p className="time-left">
          <span className="time-numbers">{timeLeft}</span>
        </p>
      )}
      <div className="currency-selector">
        <button
          className={`bnb-button ${currency === 'BNB' ? 'bnb-active' : ''}`}
          onClick={() => setCurrency('BNB')}
          disabled={loading}
        >
          BNB
        </button>
        <button
          className={`usdt-button ${currency === 'USDT' ? 'usdt-active' : ''}`}
          onClick={() => setCurrency('USDT')}
          disabled={loading}
        >
          USDT
        </button>
      </div>
      <p className="price-info">{currency === 'BNB' ? `${bnbAmount} BNB - 5 USD` : '5 USDT - 5 USD'}</p>
      <button
        className="join-btn"
        onClick={joinWhitelist}
        disabled={loading || (currency === 'BNB' && bnbAmount === '--')}
      >
        {loading ? status : 'Join Now'}
      </button>
      <p className="join-fomo-message">
        Whitelist participants get early access to airdrops and discounted presale. Entries will close when the countdown
        ends – and the presale begins immediately. 📄
      </p>
      {success && <p style={{ color: 'limegreen', fontWeight: 'bold', marginTop: '10px' }}>Successful transaction!</p>}
    </div>
  );
};

export default WhitelistBox;
