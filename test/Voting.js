const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Voting", accounts => {
  const owner = accounts[0];
  let votingInstance;
  describe("Test Voting smart contract to Alyra", function () {

    before(async () => {
      votingInstance = await Voting.new({from:owner});
      await votingInstance.addVoter(owner, {from: owner});
    });

    // onlyOwner : je ne teste pas ce modifier vu qu'il vient d'une société reconnu par l'échosystème et est utilisé par de nombreux projet
    // onlyVoters : je pense qu'il n'est pas nécessaire de faire ce test pour chaque méthode qui utilise ce modifier
    it('no voter cannot use onlyVoters method', async function () {
      await expectRevert(
        votingInstance.getVoter(accounts[2], { from: accounts[2] }),
        "You're not a voter",
      );
    });

    // getVoter
    it("...should get exist voter.", async () => {
      await votingInstance.addVoter(accounts[1], {from: owner});
      let voter = await votingInstance.getVoter.call(accounts[1], {from: owner});
      expect(voter).exist;
    });
    
    // addVoter
    it("...bad workflow status.", async () => {
      expectRevert(
        votingInstance.addVoter(accounts[3], { from: accounts[2] }),
        "Ownable: caller is not the owner",
      );
    });
    
    it("...voter already registed.", async () => {
      expectRevert(
        votingInstance.addVoter(owner, { from: owner }),
        "Already registered",
      );
    });

    it("...voter is registered.", async () => {
      await votingInstance.addVoter(accounts[2], {from: owner});
      let voter = await votingInstance.getVoter.call(accounts[2], {from: owner});
      expect(voter.isRegistered).equal(true);
    });

    it("...emit VoterRegisted", async () => {
      expectEvent(
        await votingInstance.addVoter(accounts[3], {from: owner}),
        "VoterRegistered",
        {voterAddress: accounts[3]}
      );
    });

    // addProposal
    it("...bad workflow status.", async () => {
      expectRevert(
        votingInstance.addProposal('proposition 1', {from: owner}),
        "Proposals are not allowed yet",
      );
    });

    it("...owner start proposal registering workflow.", async () => {
      expectEvent(
        await votingInstance.startProposalsRegistering({from: owner}),
        'WorkflowStatusChange',
        {
          previousStatus: new BN(votingInstance.workflowStatus.RegisteringVoters),
          newStatus:      new BN(1)
        }
      );
    });

    it("...new proposal saved.", async () => {
      expectEvent(
        await votingInstance.addProposal('proposition2', {from: owner}),
        "ProposalRegistered",
        {proposalId: new BN(0)}
      );
    });

    it("...should get exist proposal.", async () => {
      let proposal = await votingInstance.getOneProposal.call(0, {from: owner});
      expect(proposal.description).to.be.equal('proposition2');
    })

    it("...proposal cant be empty.", async () => {
      expectRevert(
        votingInstance.addProposal('', {from: owner}),
        "Vous ne pouvez pas ne rien proposer",
      )
    });

    it("...add proposal to test.", async () => {
      await votingInstance.addProposal('proposition3', {from: owner});
      await votingInstance.addProposal('proposition4', {from: owner});
      await votingInstance.addProposal('proposition5', {from: owner});
      await votingInstance.addProposal('proposition6', {from: owner});
    });

    // setVote
    it("...bad workflow status.", async () => {
      expectRevert(
        votingInstance.setVote(1, {from: accounts[1]}),
        'Voting session havent started yet',
      );
    });
    
    it("...start vote session.", async () => {
      expectEvent(
        await votingInstance.endProposalsRegistering({from: owner}),
        'WorkflowStatusChange',
        {
          previousStatus: new BN(1),
          newStatus:      new BN(2)
        }
      );

      expectEvent(
        await votingInstance.startVotingSession({from: owner}),
        'WorkflowStatusChange',
        {
          previousStatus: new BN(2),
          newStatus:      new BN(3)
        }
      );
    });

    it("...voter has voted.", async () => {
      expectEvent(
        await votingInstance.setVote(3, {from: accounts[1]}),
        "Voted",
        {voter: accounts[1], proposalId: new BN(3)}
      );

      let vote = await votingInstance.getVoter(accounts[1]);
      expect(vote.hasVoted).to.equal(true);
      expect(new BN(vote.votedProposalId)).to.be.bignumber.equal(new BN(3));
    });

    it("...user already voted.", async () => {
      expectRevert(
        votingInstance.setVote(0, {from: accounts[1]}),
        'You have already voted',
      )
    });

    it("...proposal vote growth up.", async () => {
      await votingInstance.setVote(3, {from: accounts[2]});
      let proposal = await votingInstance.getOneProposal(3, {from: owner});
      expect(new BN(proposal.voteCount)).to.be.bignumber.equal(new BN(2));
    });
  
    // tallyVotes
    it("...voting session is not finished.", async () => {
      expectRevert(
        votingInstance.tallyVotes({from: owner}),
        'Current status is not voting session ended',
      )
    });

    it("...workflow status change to votes tallied", async () => {
      expectEvent(
        await votingInstance.endVotingSession({from: owner}),
        'WorkflowStatusChange',
        {
          previousStatus: new BN(3),
          newStatus:      new BN(4)
        }
      );
    });

    it("...tally votes is log.", async () => {
      expectEvent(
        await votingInstance.tallyVotes({from: owner}),
        'WorkflowStatusChange',
        {
          previousStatus: new BN(4),
          newStatus:      new BN(5)
        }
      );
      const winningProposalID = await votingInstance.winningProposalID();
      expect(new BN(winningProposalID)).to.be.bignumber.equal(new BN(3));
    });
  
  //const status = await votingInstance.workflowStatus();
  // console.log(status.toString());
  // end describe  
  });
// end contracts  
});
