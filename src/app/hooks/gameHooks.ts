'use client';

import { Dispatch, SetStateAction, useEffect } from 'react';
import { ethers } from 'ethers';

import { GameState } from '@/pb/game';

const usePeersFetcher = async (
  setPublicKey: Dispatch<SetStateAction<string>>,
  setProvider: Dispatch<SetStateAction<ethers.providers.Web3Provider | null>>,
) => {
  useEffect(() => {
    try {
      const fetchPeers = async () => {
        if (window.ethereum) {
          const p = new ethers.providers.Web3Provider(window.ethereum);

          setProvider(p);

          if (p) {
            await p.send('eth_requestAccounts', []);
            const signer = p.getSigner();
            const userAccount = await signer.getAddress();

            setPublicKey(userAccount);
          }
        } else {
          alert(
            'MetaMask is not installed. Please install MetaMask and try again.',
          );
        }
      };

      fetchPeers();
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  }, []);
};

const useGameStateFetcher = async ({
  setGameState,
  setResultModal,
  setIsWinner,
  client,
  publicKey,
  whitePlayer,
  blackPlayer,
}: {
  setGameState: Dispatch<SetStateAction<GameState>>;
  setResultModal: Dispatch<SetStateAction<boolean>>;
  setIsWinner: Dispatch<SetStateAction<boolean>>;
  publicKey: String;
  client: any;
  whitePlayer: String;
  blackPlayer: String;
}) => {
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await client.state({
          whitePlayer: whitePlayer,
          blackPlayer: blackPlayer,
        });

        if (response.state) {
          if (response.state.stopped) {
            setIsWinner(response.state.stopped !== publicKey);
            setResultModal(true);
          }

          setGameState(response.state);
        }
      } catch (e) {
        console.error('Error fetching game state:', e);
      }
    };

    const interval = setInterval(() => {
      fetchGameState();
    }, 2500);

    return () => clearInterval(interval);
  });
};

export { usePeersFetcher, useGameStateFetcher };
