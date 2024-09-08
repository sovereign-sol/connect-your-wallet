import { ReactNode, useMemo } from 'react';
import React, { useEffect } from 'react';
import './App.css';

import {
  ConnectionProvider,
  WalletProvider,
  useConnection, useWallet
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  GlowWalletAdapter,
  //LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
  Coin98WalletAdapter,
  SafePalWalletAdapter,
  MathWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';

import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';

export const Wallet = ({ children }: { children: ReactNode }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;
  // console.log('Stake Button Network: ', network);

  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = React.useState<string | null>(null);

  // You can also provide a custom RPC endpoint.
  //const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  //const endpoint = 'https://marketa-1sh8m6-fast-mainnet.helius-rpc.com/';

  const endpoints = useMemo(() => [
    'https://marketa-1sh8m6-fast-mainnet.helius-rpc.com/',
    'https://misty-burned-hill.solana-mainnet.quiknode.pro/c3c44dab045d13ddf3a2094e47ec3682d0b87363/',
    'https://solana-api.projectserum.com/',
    'https://mainnet.rpcpool.com/',
    'https://solana-mainnet.rpc.extrnode.com',
    'https://rpc.ankr.com/solana',
    'https://try-rpc.mainnet.solana.blockdaemon.tech',
    'https://getblock.io/nodes/sol/',
    'https://api.mainnet-beta.solana.com',
  ], []);

  // Try to connect to the first RPC endopoint available, based on registered endpoints.
  useEffect(() => {
    const checkConnection = async () => {
      for (const endpoint of endpoints) {
        console.log('RPC Network: ', endpoint);
        try {
          const connection = new Connection(endpoint);
          await connection.getVersion();
          setActiveEndpoint(endpoint);
          setConnectionError(null); // Nessun errore
          return; // Esci dal ciclo se la connessione è riuscita
        } catch (error) {
          console.error(`Impossibile connettersi all'endpoint ${endpoint}:`, error);
        }
      }
      setConnectionError('Impossibile connettersi a nessun endpoint');
    };

    checkConnection();
  }, [endpoints]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      //new LedgerWalletAdapter(),
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new SolletWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new Coin98WalletAdapter(),
      new SafePalWalletAdapter(),
      new MathWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={activeEndpoint || 'https://api.mainnet-beta.solana.com'}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {connectionError ? (
            <div>{connectionError}</div>
          ) : (
            children
          )}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
