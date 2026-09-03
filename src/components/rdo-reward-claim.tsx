"use client";

import { useState } from "react";
import { address } from "@solana/kit";
import {
  TOKEN_2022_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getMintToInstruction,
} from "@solana-program/token-2022";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import type { AppSolanaClient } from "@/app/providers";

const RDO_MINT_ADDRESS = "6XTX38gi4mUZ63SMqT4XUmi6CGk9zQY4hwAWFUuDmd9y";
const RDO_SCALE = BigInt(10) ** BigInt(6);

type Props = {
  claimableRdo: number;
  onClaimCompleted: (amount: number, signature: string, walletAddress: string) => void;
};

export function RdoRewardClaim({ claimableRdo, onClaimCompleted }: Props) {
  const client = useClient<AppSolanaClient>();
  const connected = useConnectedWallet(client);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const claimAmount = Math.min(1, Math.floor(Math.max(0, claimableRdo) * 100) / 100);

  async function handleClaim() {
    if (!connected?.signer || claiming || claimAmount <= 0) return;
    setClaiming(true);
    setMessage(null);
    setFailed(false);

    try {
      const mint = address(RDO_MINT_ADDRESS);
      const rawAmount = (BigInt(Math.round(claimAmount * 100)) * RDO_SCALE) / BigInt(100);

      const [ata] = await findAssociatedTokenPda({
        owner: connected.signer.address,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
        mint,
      });

      const createAta = await getCreateAssociatedTokenIdempotentInstructionAsync({
        payer: connected.signer,
        ata,
        owner: connected.signer.address,
        mint,
        tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
      });

      const mintTo = getMintToInstruction({
        mint,
        token: ata,
        mintAuthority: connected.signer,
        amount: rawAmount,
      });

      const result = await client.sendTransaction([createAta, mintTo]);
      const signature = String(result.context.signature);

      onClaimCompleted(claimAmount, signature, String(connected.signer.address));
      setMessage(`TX ${signature}`);
    } catch (cause) {
      console.error("RDO Devnet claim failed:", cause);
      setFailed(true);
      setMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setClaiming(false);
    }
  }

  if (!connected) {
    return (
      <button type="button" disabled className="w-full whitespace-nowrap rounded-lg border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-[9px] font-black text-slate-500">
        CONNECT WALLET
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={claiming || claimAmount <= 0}
        onClick={() => void handleClaim()}
        className="w-full whitespace-nowrap rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-[10px] font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {claiming ? "CLAIMING..." : claimAmount > 0 ? `CLAIM ${claimAmount.toFixed(2)} RDO` : "NO CLAIM"}
      </button>

      {message ? (
        <div className={["absolute right-0 top-full z-[120] mt-2 w-[320px] rounded-lg border bg-[#07111f] p-2 text-[8px] leading-4 shadow-2xl", failed ? "border-red-500/30 text-red-300" : "border-emerald-500/30 text-emerald-300"].join(" ")}>
          <div className="mb-1 font-black uppercase">{failed ? "CLAIM FAILED" : "CLAIM SUCCESS"}</div>
          <div className="break-all">{message}</div>
        </div>
      ) : null}
    </div>
  );
}