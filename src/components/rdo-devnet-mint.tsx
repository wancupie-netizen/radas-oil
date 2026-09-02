"use client";

import { useState } from "react";
import { generateKeyPairSigner } from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  TOKEN_2022_PROGRAM_ADDRESS,
  getInitializeMintInstruction,
  getMintSize,
} from "@solana-program/token-2022";
import { useClient } from "@solana/react";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";

import type { AppSolanaClient } from "@/app/providers";

const RDO_DECIMALS = 6;

export function RdoDevnetMint() {
  const client = useClient<AppSolanaClient>();
  const connected = useConnectedWallet(client);

  const [creating, setCreating] = useState(false);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createRdoMint() {
    if (!connected?.signer || creating || mintAddress) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const mint = await generateKeyPairSigner();

      const space = BigInt(getMintSize());

      const rent = await client.rpc
        .getMinimumBalanceForRentExemption(space)
        .send();

      const createAccountInstruction = getCreateAccountInstruction({
        payer: connected.signer,
        newAccount: mint,
        space,
        lamports: rent,
        programAddress: TOKEN_2022_PROGRAM_ADDRESS,
      });

      const initializeMintInstruction = getInitializeMintInstruction({
        mint: mint.address,
        decimals: RDO_DECIMALS,
        mintAuthority: connected.signer.address,
        freezeAuthority: null,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
      });

      const result = await client.sendTransaction([
        createAccountInstruction,
        initializeMintInstruction,
      ]);

      setMintAddress(String(mint.address));
      setSignature(String(result.context.signature));
    } catch (cause) {
      console.error("RDO Devnet mint creation failed:", cause);

      setError(
        cause instanceof Error
          ? cause.message
          : String(cause),
      );
    } finally {
      setCreating(false);
    }
  }

  if (!connected) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-400">
            RDO Devnet
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Token-2022 | 6 decimals | supply 0
          </p>
        </div>

        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-300">
          DEV ONLY
        </span>
      </div>

      {mintAddress ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
            RDO Mint Created
          </p>

          <p className="mt-2 break-all font-mono text-[10px] leading-4 text-slate-200">
            {mintAddress}
          </p>

          {signature ? (
            <p className="mt-2 break-all font-mono text-[9px] leading-4 text-slate-500">
              TX: {signature}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={creating}
          onClick={() => {
            void createRdoMint();
          }}
          className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating
            ? "CREATING RDO MINT..."
            : "CREATE RDO DEVNET MINT"}
        </button>
      )}

      {error ? (
        <p className="mt-2 break-words rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-[10px] leading-4 text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}