import {
  Connection,
  Keypair,
  StakeProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Authorized,
  Transaction,
} from '@solana/web3.js';

const YONTALABS_VALIDATOR_VOTE_ACCOUNT = 'BeSov1og3sEYyH9JY3ap7QcQDvVX8f4sugfNPf9YLkcV';

export async function getInitCreateDelegateTX({
  ownerPubkey,
  connection,
  totalSol,
}: {
  ownerPubkey: PublicKey;
  connection: Connection;
  totalSol: number;
}) {
  const soladexPubKey = new PublicKey(YONTALABS_VALIDATOR_VOTE_ACCOUNT);
  const stakeAccount = new Keypair();

  const totalLamports = totalSol * LAMPORTS_PER_SOL;

  let createStakeAccountIX = StakeProgram.createAccount({
    fromPubkey: ownerPubkey,
    stakePubkey: stakeAccount.publicKey,
    lamports: totalLamports,
    authorized: new Authorized(ownerPubkey, ownerPubkey),
  });

  let delegateStakeTX = StakeProgram.delegate({
    authorizedPubkey: ownerPubkey,
    stakePubkey: stakeAccount.publicKey,
    votePubkey: soladexPubKey,
  });

  let createTX = new Transaction()
    .add(createStakeAccountIX)
    .add(delegateStakeTX);

  const recentBlockhash = await (
    await connection.getLatestBlockhash()
  ).blockhash;

  createTX.recentBlockhash = recentBlockhash;

  return { createTX, stakeAccount };
}
