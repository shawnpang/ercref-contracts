import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig, task } from 'hardhat/config';
import * as dotenv from 'dotenv';
import "@nomiclabs/hardhat-ethers";
dotenv.config();

task('deploy_n_verify', 'Deploy the contracts')
  .setAction(async (args, hre) => {
    async function deployByName(contractName: string, parameters: string[]): Promise<any> /*deployed address*/ {
      console.log(`Deploying ${contractName} with parameters ${parameters}`);
      const contractFactory = await hre.ethers.getContractFactory(contractName);
      const contract = await contractFactory.deploy(...parameters);
      await contract.deployed();
      console.log(`${contractName} deployed to: ${contract.address}`);
      let tx = contract.deployTransaction;
      console.log(`Contract ${contractName} deployed to ${contract.address}`);
      return { contract, tx };
    }

    const versionHex:string = "0x1002";

    const network = hre.network.name;
    console.log(`start deploy_n_verify version=${versionHex} on network ${network}`);
    await hre.run('compile');

    const results:any[] = [];
    for (const contractName of ['ERC5679Ext20RefImpl', 'ERC5679Ext721RefImpl', 'ERC5679Ext1155RefImpl']) {
      const { contract, tx } = await deployByName(contractName, [versionHex]);
      results.push({ contract, tx });
    }

    for (const {contractName, contract, tx} of results) {
      // console.log(`Waiting for tx ${tx.hash} to be mined`);
      for (let i = 0; i < 10; i++) {
        console.log(`Block ${i}...`);
        await tx.wait(i);
      }
      console.log(`Done waiting for the confirmation for contract ${contractName} at ${contract.address}`);
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: [versionHex],
      }).catch(e=>console.log(`Failure ${e} when verifying ${contractName} at ${contract.address}`));
    }
    console.log(`done deploy_n_verify`);
});

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
    },
    gnosis: {
      url: `https://rpc.gnosischain.com`,
      accounts: { mnemonic: process.env.MNEMONIC as string }
    }
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY as string,
      gnosis: process.env.GNOSIS_API_KEY as string,
    },
    customChains: [
      {
        network: "gnosis",
        chainId: 100,
        urls: {
          apiURL: "https://api.gnosisscan.io/api",
          browserURL: "https://gnosisscan.io"
        }
      }
    ]
  },
};

export default config;
