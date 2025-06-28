/* global BigInt */
import React, { useState, useEffect } from 'react';
import { useSwitchChain, useAccount, useChainId, useConnect } from 'wagmi';
import { ethers } from 'ethers';
import { metaMask } from '@wagmi/connectors';
import './WhitelistBox.css';

const WhitelistBox = () => {
  const [timeLeft, setTimeLeft] = useState('');
  const [joined, setJoined] = useState(3);
  const [currency, setCurrency] = useState('BNB');
  const [bnbAmount, setBnbAmount] = useState('0.008');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { switchChainAsync } = useSwitchChain();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();

  const recipientAddress = '0x7cd14dd705f5e05d8b1b9853245cc60bd8251ff4';
  const whitelistStart = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).getTime();
  const whitelistEnd = whitelistStart + 30 * 24 * 60 * 60 * 1000;

  const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
  const USDT_ABI = [
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function transfer(address to, uint amount) public returns (bool)',
    'function balanceOf(address account) public view returns (uint256)',
  ];

  // Fetch BNB price
  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'
        );
        const data = await res.json();
        const price = data.binancecoin.usd;
        const amount = (5 / price).toFixed(6);
        setBnbAmount(amount);
      } catch {
        setBnbAmount('0.008');
      }
    };
    fetchBnbPrice();
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now < whitelistStart) {
        const diff = whitelistStart - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (now >= whitelistStart && now <= whitelistEnd) {
        const diff = whitelistEnd - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [whitelistStart, whitelistEnd]);

  // Confetti effect (runs continuously)
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
        confetti.style.top = `0px`; // Start from the very top
        confetti.style.animationDuration = `${Math.random() * 4 + 8}s`;
        whitelistBox.appendChild(confetti);
        confetti.addEventListener('animationend', () => confetti.remove());
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Join whitelist function
  const joinWhitelist = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask and try again.');
      return;
    }

    console.log('joinWhitelist called:', { isConnected, address, chainId });
    if (!isConnected || !address) {
      try {
        console.log('Attempting to connect MetaMask');
        await connectAsync({ connector: metaMask() });
        console.log('MetaMask connected successfully');
        // Removed return to continue flow
      } catch (err) {
        console.error('MetaMask connection error:', err);
        alert('Failed to connect MetaMask. Please ensure MetaMask is installed and try again.');
        return;
      }
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log('Signer obtained:', await signer.getAddress());

      if (chainId !== 56) {
        console.log('Switching to BSC (chainId: 56)');
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'Binance Smart Chain',
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
          await switchChainAsync({ chainId: 56 });
          console.log('Switched to BSC');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError) {
          console.error('Chain switch error:', switchError);
          alert('Please manually switch to Binance Smart Chain (BSC) in MetaMask and try again.');
          return;
        }
      }

      if (currency === 'BNB') {
        const balance = await provider.getBalance(address);
        const requiredAmount = ethers.parseEther(bnbAmount);
        const gasPrice = await provider.getFeeData().then(data => data.gasPrice || ethers.parseUnits('5', 'gwei'));
        const gasEstimate = await provider.estimateGas({
          to: recipientAddress,
          value: ethers.parseEther(bnbAmount),
        });
        // eslint-disable-next-line no-undef
        const gasCost = gasPrice * BigInt(gasEstimate);
        const totalRequired = requiredAmount + gasCost;

        console.log('BNB balance check:', {
          balance: ethers.formatEther(balance),
          requiredAmount: ethers.formatEther(requiredAmount),
          gasCost: ethers.formatEther(gasCost),
          totalRequired: ethers.formatEther(totalRequired),
        });

        if (balance < totalRequired) {
          throw new Error(`Insufficient BNB balance. Need ${ethers.formatEther(totalRequired)} BNB, have ${ethers.formatEther(balance)} BNB.`);
        }

        console.log('Sending BNB:', bnbAmount);
        const tx = await signer.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(bnbAmount),
          gasLimit: gasEstimate,
        });
        console.log('BNB transaction sent:', tx.hash);
        await tx.wait();
        console.log('BNB transaction confirmed');
      } else if (currency === 'USDT') {
        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
        const balance = await usdtContract.balanceOf(address);
        const requiredAmount = ethers.parseUnits('5', 18);
        const gasPrice = await provider.getFeeData().then(data => data.gasPrice || ethers.parseUnits('5', 'gwei'));
        const gasEstimate = await usdtContract.estimateGas.transfer(recipientAddress, requiredAmount);
        // eslint-disable-next-line no-undef
        const gasCost = gasPrice * BigInt(gasEstimate);
        const bnbBalance = await provider.getBalance(address);

        console.log('USDT balance check:', {
          usdtBalance: ethers.formatUnits(balance, 18),
          requiredAmount: ethers.formatUnits(requiredAmount, 18),
          bnbBalance: ethers.formatEther(bnbBalance),
          gasCost: ethers.formatEther(gasCost),
        });

        if (balance < requiredAmount) {
          throw new Error(`Insufficient USDT balance. Need 5 USDT, have ${ethers.formatUnits(balance, 18)} USDT.`);
        }
        if (bnbBalance < gasCost) {
          throw new Error(`Insufficient BNB for gas fees. Need ${ethers.formatEther(gasCost)} BNB, have ${ethers.formatEther(bnbBalance)} BNB.`);
        }

        console.log('Approving USDT:', requiredAmount.toString());
        const approveGasEstimate = await usdtContract.estimateGas.approve(recipientAddress, requiredAmount);
        const approveTx = await usdtContract.approve(recipientAddress, requiredAmount, { gasLimit: approveGasEstimate });
        console.log('Approve transaction sent:', approveTx.hash);
        await approveTx.wait();
        console.log('Approve transaction confirmed');

        console.log('Transferring USDT:', requiredAmount.toString());
        const transferTx = await usdtContract.transfer(recipientAddress, requiredAmount, { gasLimit: gasEstimate });
        console.log('Transfer transaction sent:', transferTx.hash);
        await transferTx.wait();
        console.log('Transfer transaction confirmed');
      }

      setJoined((prev) => prev + 1);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Transaction error:', error.message, error);
      alert(error.message || 'Transaction failed or was canceled. Please check your wallet and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="whitelist-box">
      <h2>WHITELIST IS LIVE</h2>
      <p className="fomo-message">
        Most will scroll past. A few will enter. And only they will understand. 🚀

      </p>
      <p className="time-left"><span className="time-numbers">{timeLeft}</span></p>
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
      <p className="price-info">
        {currency === 'BNB' ? `${bnbAmount} BNB - 5 USD` : '5 USDT - 5 USD'}
      </p>
      <button className="join-btn" onClick={joinWhitelist} disabled={loading}>
        {loading ? 'Processing...' : 'Join Now'}
      </button>
      <p className="join-fomo-message">
Whitelist participants get early access to airdrops and discounted presale.
Entries will close when the countdown ends – and the presale begins immediately.. 📄     </p>
      {success && <p style={{ color: 'limegreen', fontWeight: 'bold', marginTop: '10px' }}>Successful transaction!</p>}
    </div>
  );
};

export default WhitelistBox;