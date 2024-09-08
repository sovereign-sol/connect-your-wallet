import React, { useEffect } from 'react';
import './App.css';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal  } from '@solana/wallet-adapter-react-ui';
import { getInitCreateDelegateTX } from './stake';
import { LAMPORTS_PER_SOL, VersionedTransaction, SimulateTransactionConfig, VersionedMessage } from '@solana/web3.js';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { clusterApiUrl, Connection } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

const APP_IDENTITY = {
  name: 'Stake Solana with YontaLabs',
  uri: 'https://www.yontalabs.io',
  /*icon: 'https://www.yontalabs.io/favicon.ico',*/
};

async function connectMobileWallet() {
  console.log('Connecting to native App wallet...');
  try {
    /*const callbackUrl = `${window.location.origin}/callback?authorized=true`*/
    const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
      console.log("Authorizing wallet...");
      return await wallet.authorize({
        chain: 'solana:mainnet',
        identity: APP_IDENTITY,
      });
    });
    console.log('Wallet connected:', authorizationResult);
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
}

export default function App() {

  // Clear any previous hanging sessions 
  useEffect(() => {
    localStorage.removeItem('walletName');
    localStorage.removeItem('walletPublicKey');

    if (!sessionStorage.getItem('reloaded')) {
      sessionStorage.clear();
      sessionStorage.setItem('reloaded', 'true');
      window.location.reload();
    }
  }, []);

  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    let isMob = false;
    if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
      setIsMobile(true);
      isMob = true;
    } else if ("ontouchstart" in document.documentElement) {
      setIsMobile(true);
      isMob = true;
    } else if (window.matchMedia("(pointer:coarse)").matches) {
      setIsMobile(true);
      isMob = true;
    }

    console.log('isMobile ' + isMob);

    if (isMob) {
      setTimeout(() => {
        connectMobileWallet();
        }, 1000); // Ritardo di 1 secondo
    } else {
      // Per i wallet in-browser, il WalletMultiButton gestisce la connessione
      console.log('Connecting to in-browser wallet...');
    }
  }, []);

  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = React.useState(0);

  const [solToStake, setSolToStake] = React.useState(0);

  const fee = 0.001;

  const [stakeButton, setStakeButton] = React.useState<HTMLButtonElement | null>(null);

  const stakeButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const { setVisible } = useWalletModal();

  // Read the balance and propose the whole stakable amount 
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.connected && wallet.publicKey) {
        const bal = await connection.getBalance(wallet.publicKey);

        const solBalance = bal / LAMPORTS_PER_SOL;
        const solToStakeValue = solBalance - fee;

        setBalance(solBalance);
        setSolToStake(solToStakeValue); // Imposta il massimo stakabile

        if (stakeButtonRef.current) {
          if (solToStakeValue > 0) {
            console.log('maggiore di zero ' + solToStakeValue);
            stakeButtonRef.current.classList.add('stake-button-fading');
            stakeButtonRef.current.disabled = false;
          } else {
            console.log('minore uguale a zero ' + solToStakeValue);
            stakeButtonRef.current.classList.remove('stake-button-fading');
            stakeButtonRef.current.disabled = true;
          }
        }
      }
    };

    fetchBalance();
  }, [wallet.connected, wallet.publicKey, connection]);

  // AutoClick effect from external link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoClick') === 'true') {
      const walletButton = document.querySelector('.wallet-adapter-button') as HTMLElement;
      if (walletButton) {
        walletButton.click();
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(',', '.') || '');
    setSolToStake(value);

    if (stakeButtonRef.current) {
      if (value > 0) {
        stakeButtonRef.current.classList.add('stake-button-fading');
        stakeButtonRef.current.disabled = false;
      } else {
        stakeButtonRef.current.classList.remove('stake-button-fading');
        stakeButtonRef.current.disabled = true;
      }
    }
  };

  const handleSuggestedValueClick = () => {
    const suggestedValue = balance - fee;
    setSolToStake(suggestedValue);

    if (stakeButtonRef.current) {
      if (suggestedValue > 0) {
        stakeButtonRef.current.classList.add('stake-button-fading');
        stakeButtonRef.current.disabled = false;
      } else {
        stakeButtonRef.current.classList.remove('stake-button-fading');
        stakeButtonRef.current.disabled = true;
        alert('Ops! Your balance is ' + balance + ' SOL. Please acquire some SOL first!');
      }
    }
  };

  const onSendClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    setStakeButton(button);
    button.classList.remove('stake-button-fading');
    // Forza un reflow del DOM
    void button.offsetWidth;
    if (wallet?.publicKey && wallet?.signTransaction) {
      try {
        const { createTX, stakeAccount } = await getInitCreateDelegateTX({
          connection,
          ownerPubkey: wallet.publicKey,
          totalSol: solToStake,
        });

        createTX.feePayer = wallet.publicKey;

        // Simulate Transaction
        const simulationResult = await connection.simulateTransaction(createTX);
        console.log('Simulation result:', simulationResult);

        if (!simulationResult.value.err) {
          const sig = await wallet.sendTransaction(createTX, connection, {
            signers: [stakeAccount],
          });
          console.log('sig', sig);
          const success = await connection.confirmTransaction(sig);
          console.log('success', success);
        } else {
          console.log('Simulation error:', simulationResult.value.err);
          const bal = await connection.getBalance(wallet.publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
          if (balance <= solToStake)
            alert('Transaction not possible: You requested ' + solToStake + ' SOL to stake, but you only have ' + balance + ' SOL');
          else
            alert('Ops! Something went wrong. Please check balance and/or permissions')
        }
      } catch (e) {
        console.log('ERROR', e);
      }
    }
    else
      console.log('caso sconosciuto');
  };

  const handleConnectWallet = React.useCallback(() => {
    console.log("Button clicked");
    if (isMobile) {
      connectMobileWallet();
    } else {
      // Per i wallet in-browser, il WalletMultiButton gestisce la connessione
      console.log('Connecting to in-browser wallet...');
    }
    setVisible(true);
  }, []);

  return (
    <div className="App">
      <div>
        <div className="top-bar">
          <WalletMultiButton />
        </div>
        <div className="stake-container">
          {wallet.connected && (
            <React.Fragment>
              <div className="input-group">
                <input
                  type="number"
                  lang="en"
                  step="0.01"
                  className="stake-button-input"
                  id="stake-button-input"
                  disabled={!wallet.connected}
                  onChange={handleInputChange}
                  value={solToStake}
                  max={solToStake}
                />
                <button
                  type="button"
                  className="suggested-value-button"
                  onClick={handleSuggestedValueClick}
                >
                  Best Amount
                </button>
              </div>
              <p />
              <button
                ref={stakeButtonRef}
                className="stake-button"
                id="stake-button"
                onClick={onSendClick}
                disabled={!wallet.connected || solToStake <= 0}
              >
                Stake with <img src="/images/Yonta_Labs_logomark_color.png" alt="YL" className="stake-button-image" />
              </button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
