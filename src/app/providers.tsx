"use client";

import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";
import { token2022Program } from "@solana-program/token-2022";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

export const solanaClient = createClient()
  .use(walletSigner({ chain: "solana:devnet" }))
  .use(solanaRpc({ rpcUrl }))
  .use(token2022Program());

export type AppSolanaClient = Awaited<typeof solanaClient>;

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider client={solanaClient}>
      {children}
    </ClientProvider>
  );
}