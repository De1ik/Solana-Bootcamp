import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from "@coral-xyz/anchor";

const IDL = require("../target/idl/voting.json");
import { Voting } from '../target/types/voting';

const VOTING_ID = new PublicKey("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");


// Load IDL dynamically

describe('Create a system account', () => {

  let context: any;
  let provider: any;
  let votingProgram: Program<Voting>;

  beforeAll( async () => {
    context = await startAnchor("", [{name: "voting", programId: VOTING_ID}], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  it("Initialize Poll", async () => {
    await votingProgram.methods.initializePoll(
        new anchor.BN(1),
        "What is your favourite color?",
        new anchor.BN(1659508293),
        new anchor.BN(1859508293),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingProgram.programId
    );

    const pollAccount = await votingProgram.account.poll.fetch(pollAddress);
    console.log(pollAccount);

    expect(pollAccount.pollId.toNumber()).toEqual(1);
    expect(pollAccount.description).toEqual("What is your favourite color?")
    expect(pollAccount.pollStart.toNumber()).toBeLessThan(pollAccount.pollEnd.toNumber())

  });

  it("Initialize candidate", async () => {
    await votingProgram.methods.initializeCandidate(
      new anchor.BN(1),
      "Blue"
    ).rpc()

    await votingProgram.methods.initializeCandidate(
      new anchor.BN(1),
      "Yellow"
    ).rpc()


    const [yellowAddress] = PublicKey.findProgramAddressSync(
      [
        new anchor.BN(1).toArrayLike(Buffer, "le", 8), 
        Buffer.from("Yellow")
      ],
      votingProgram.programId
    )

    const yellowCandidate = await votingProgram.account.candidate.fetch(yellowAddress);
    
    console.log(yellowCandidate)
    expect(yellowCandidate.candidateName).toEqual("Yellow")
    expect(yellowCandidate.candidateVotes.toNumber()).toEqual(0)

    
    const [blueAddress] = PublicKey.findProgramAddressSync(
      [
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from("Blue")
      ],
      votingProgram.programId
    )

    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress)
    
    console.log(blueCandidate)
    expect(blueCandidate.candidateName).toEqual("Blue")
    expect(blueCandidate.candidateVotes.toNumber()).toEqual(0)
  })

  it ("Vote", async () => {
  
    await votingProgram.methods
    .vote(
      new anchor.BN(1),
      "Blue"
    )
    .rpc()

    const [blueAddress] = PublicKey.findProgramAddressSync(
      [
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from("Blue")
       ],
      votingProgram.programId
    )

    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress)

    console.log(blueCandidate)

    expect(blueCandidate.candidateName).toEqual("Blue")
    expect(blueCandidate.candidateVotes.toNumber()).toEqual(1)

    const [yellowAddress] = PublicKey.findProgramAddressSync(
      [
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from("Yellow")
      ],
      votingProgram.programId
    )

    const yellowCandidate = await votingProgram.account.candidate.fetch(yellowAddress)

    console.log(yellowCandidate)

    expect(yellowCandidate.candidateName).toEqual("Yellow")
    expect(yellowCandidate.candidateVotes.toNumber()).toEqual(0)
    
  })

});


