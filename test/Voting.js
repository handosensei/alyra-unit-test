const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { exit } = require('process');

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
    
    it("...new proposal saved.", async () => {
      await votingInstance.startProposalsRegistering({from: owner});
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
    
    // setVote
    it("...bad workflow status.", async () => {
      expectRevert(
        votingInstance.setVote(1, {from: accounts[1]}),
        'Voting session havent started yet',
      );
    });
    
    it("...voter has voted.", async () => {
      await votingInstance.endProposalsRegistering({from: owner});
      await votingInstance.startVotingSession({from: owner});
      
      expectEvent(
        await votingInstance.setVote(0, {from: accounts[1]}),
        "Voted",
        {voter: accounts[1], proposalId: new BN(0)}
      );
    });

    it("...user already voted.", async () => {
      expectRevert(
        votingInstance.setVote(0, {from: accounts[1]}),
        'You have already voted',
      )
    });
    /*  
    
    it("...proposal vote not found.", async () => {});
    it("...vote registered.", async () => {});
    
    it("...proposal vote growth up.", async () => {});
    it("...vote is log.", async () => {});
  
    // startProposalsRegistering
    it("...only owner can start proposal registering.", async () => {});
    it("...owner start proposal registering.", async () => {});
    it("...start proposal registering is log.", async () => {});
  
    // endProposalsRegistering
    it("...only owner can end proposal registering.", async () => {});
    it("...owner end proposal registering.", async () => {});
    it("...end proposal registering is log.", async () => {});
  
    // startVotingSession
    it("...only owner can start voting session.", async () => {});
    it("...owner start voting session.", async () => {});
    it("...start voting session is log.", async () => {});
  
    // endVotingSession
    it("...only owner can end voting session.", async () => {});
    it("...owner end voting session.", async () => {});
    it("...end voting session is log.", async () => {});
  
    // tallyVotes
    it("...voting session is not finished.", async () => {});
    it("...tally votes is log.", async () => {});
    it("...workflow status change to votes tallied");
    it("...workflow status change to votes tallied");
    */
//const status = await votingInstance.workflowStatus();
// console.log(status.toString());
  // end describe  
  });
// end contracts  
});
