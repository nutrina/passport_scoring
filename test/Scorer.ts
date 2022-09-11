import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Scorer", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployScorer() {
    const numMaxDataPoints = 8;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Scorer = await ethers.getContractFactory("Scorer");
    const lock = await Scorer.deploy(numMaxDataPoints);

    return { lock, numMaxDataPoints, owner, otherAccount };
  }

  function hashStamps(stamps: string[]) {
    return ethers.utils.keccak256(
      ethers.utils.formatBytes32String(stamps.join())
    );
  }

  describe("Building model", function () {
    it("Should initialize scorer", async function () {
      const { lock, numMaxDataPoints } = await loadFixture(deployScorer);

      expect(await lock.numMaxDataPoints()).to.equal(numMaxDataPoints);
    });

    it("Should record data point", async function () {
      const { lock, numMaxDataPoints } = await loadFixture(deployScorer);

      lock.addDataPoints(hashStamps(["Stamp1"]), 1);
      lock.addDataPoints(hashStamps(["Stamp2"]), 1);
      lock.addDataPoints(hashStamps(["Stamp2"]), 1);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2"]), 2);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2"]), 2);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2"]), 2);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2"]), 2);
      lock.addDataPoints(hashStamps(["Stamp3"]), 1);
      lock.addDataPoints(hashStamps(["Stamp2", "Stamp3"]), 2);
      lock.addDataPoints(hashStamps(["Stamp2", "Stamp3"]), 2);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2", "Stamp3"]), 3);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2", "Stamp3"]), 3);
      lock.addDataPoints(hashStamps(["Stamp1", "Stamp2", "Stamp3"]), 3);

      expect(await lock.comboCounter(hashStamps(["Stamp1"]))).to.equal(1);
      expect(await lock.comboCounter(hashStamps(["Stamp2"]))).to.equal(2);
      expect(await lock.comboCounter(hashStamps(["Stamp3"]))).to.equal(1);
      expect(
        await lock.comboCounter(hashStamps(["Stamp1", "Stamp2"]))
      ).to.equal(4);
      expect(
        await lock.comboCounter(hashStamps(["Stamp2", "Stamp3"]))
      ).to.equal(2);
      expect(
        await lock.comboCounter(hashStamps(["Stamp1", "Stamp2", "Stamp3"]))
      ).to.equal(3);

      expect(await lock.numDataPointsCounter(1)).to.equal(4);
      expect(await lock.numDataPointsCounter(2)).to.equal(6);
      expect(await lock.numDataPointsCounter(3)).to.equal(3);
    });
  });

  it("Should record data point", async function () {
    const { lock, numMaxDataPoints } = await loadFixture(deployScorer);

    lock.addDataPoints(hashStamps(["facebook"]), 1);
    lock.addDataPoints(hashStamps(["facebook"]), 1);
    lock.addDataPoints(hashStamps(["facebook"]), 1);
    lock.addDataPoints(hashStamps(["google"]), 1);
    lock.addDataPoints(hashStamps(["google"]), 1);
    lock.addDataPoints(hashStamps(["facebook", "twitter"]), 2);
    lock.addDataPoints(hashStamps(["facebook", "twitter"]), 2);
    lock.addDataPoints(hashStamps(["facebook", "twitter", "github"]), 3);
    lock.addDataPoints(hashStamps(["twitter"]), 1);
    lock.addDataPoints(hashStamps(["poh"]), 1);

    expect(await lock.getApuScore(hashStamps(["facebook"]), 1)).to.equal(
      ethers.BigNumber.from("196428571428571428")
    );
    expect(await lock.getApuScore(hashStamps(["google"]), 1)).to.equal(
      ethers.BigNumber.from("214285714285714285")
    );
    expect(
      await lock.getApuScore(hashStamps(["facebook", "twitter"]), 2)
    ).to.equal(ethers.BigNumber.from("250000000000000000"));
    expect(
      await lock.getApuScore(hashStamps(["facebook", "twitter", "github"]), 3)
    ).to.equal(ethers.BigNumber.from("375000000000000000"));
    expect(await lock.getApuScore(hashStamps(["twitter"]), 1)).to.equal(
      ethers.BigNumber.from("232142857142857142")
    );
    expect(await lock.getApuScore(hashStamps(["poh"]), 1)).to.equal(
      ethers.BigNumber.from("232142857142857142")
    );
  });
});
