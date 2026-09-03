"use client";

import { useState } from "react";
import { address, generateKeyPairSigner } from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  TOKEN_2022_PROGRAM_ADDRESS,
  getInitializeMintInstruction,
  getMintSize,
} from "@solana-program/token-2022";
import { useClient } from "@solana/react";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { getCreateV1InstructionAsync, TokenStandard } from "@metaplex-foundation/mpl-token-metadata-kit";

import type { AppSolanaClient } from "@/app/providers";

const RDO_DECIMALS = 6;

const RDO_MINT_ADDRESS =
  "6XTX38gi4mUZ63SMqT4XUmi6CGk9zQY4hwAWFUuDmd9y";

const RDO_METADATA_URI =
  "https://radas-oil.vercel.app/rdo-token.json";

export function RdoDevnetMint() {
  const client = useClient<AppSolanaClient>();
  const connected = useConnectedWallet(client);

  const [creating, setCreating] = useState(false);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registeringMetadata, setRegisteringMetadata] = useState(false);
  const [metadataSignature, setMetadataSignature] = useState<string | null>(null);

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

  async function registerRdoMetadata() {
    if (!connected?.signer || registeringMetadata || metadataSignature) {
      return;
    }

    setRegisteringMetadata(true);
    setError(null);

    try {
      const metadataInstruction =
        await getCreateV1InstructionAsync({
          mint: address(RDO_MINT_ADDRESS),
          authority: connected.signer,
          payer: connected.signer,
          updateAuthority: connected.signer,
          splTokenProgram: TOKEN_2022_PROGRAM_ADDRESS,

          name: "RADAS Oil",
          symbol: "RDO",
          uri: RDO_METADATA_URI,

          sellerFeeBasisPoints: 0,
          creators: null,
          primarySaleHappened: false,
          isMutable: true,
          tokenStandard: TokenStandard.Fungible,
          collection: null,
          uses: null,
          collectionDetails: null,
          ruleSet: null,
          decimals: RDO_DECIMALS,
          printSupply: null,
        });

      const result = await client.sendTransaction([
        metadataInstruction,
      ]);

      setMetadataSignature(String(result.context.signature));
    } catch (cause) {
      console.error("RDO metadata registration failed:", cause);

      let current: unknown = cause;

      for (let depth = 0; depth < 8 && current; depth += 1) {
        console.error(`RDO metadata cause ${depth}:`, current);

        if (
          typeof current === "object" &&
          current !== null &&
          "cause" in current
        ) {
          current = (current as { cause?: unknown }).cause;
        } else {
          break;
        }
      }

      setError(
        cause instanceof Error
          ? cause.message
          : String(cause),
      );
    } finally {
      setRegisteringMetadata(false);
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

      <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="mb-2">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
            RDO Metadata
          </p>

          <p className="mt-1 break-all font-mono text-[9px] leading-4 text-slate-500">
            Mint: {RDO_MINT_ADDRESS}
          </p>
        </div>

        {metadataSignature ? (
          <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
              Metadata Registered
            </p>

            <p className="mt-2 break-all font-mono text-[9px] leading-4 text-slate-500">
              TX: {metadataSignature}
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={registeringMetadata}
            onClick={() => {
              void registerRdoMetadata();
            }}
            className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registeringMetadata
              ? "REGISTERING METADATA..."
              : "REGISTER RDO METADATA"}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-2 break-words rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-[10px] leading-4 text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}