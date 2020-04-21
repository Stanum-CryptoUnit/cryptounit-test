# CRU tokens tests Framework

# Environment setup 

Please make sure you have docker and npm installed on test machine

# Install infeos
Infeos is npm based framework. To start using it you just need to install via npm:


In terminal: npm install infeos

# Initialize  project

In terminal: git clone "path to your repo"

# Run a local node
The power of the local EOSIO nodes is hidden in the Docker containers. We created small but yet powerful images that can be directly used for each local node.
Run the following command to start your local node: infeos run-node

Only the first time it could take some time before the whole image is downloaded locally. By default, the command starts an EOS node. 
It automatically set up a wallet, import keys and create a deployer account, 
create test account and setup rights for CRU tokens 
Re-running the command will rebuild your node with a fresh and clear new instance.

Please refer to config folder: node_config.js as init script and infeos_config,js for values and stages.

# Compile EOSIO smart contracts
You have a running node!

Before the first deploy, we need to compile our smart contract. To do that run the following command:
In terminal: infeos compile
The command will automatically create a build folder and place the generated WASM file inside it. 
If you want to generate both WASM & ABI run the command with the abi option

In terminal: infeos compile --abi

Note: by default it will compile only masterContract from configuration JSON

# Deploying EOSIO smart contracts
It will automatically 

Run the following command to deploy the sample contracts to the local node:
infeos deploy

Behind the scenes, the command uses the compiled WASM & ABI files previously and together with your pre-setup deployer account, it will automatically deploy the master contract to the blockchain.
At the end of the deployment process, the EOSIODeployer will return you an instance of the contract which you can use to interact with all the actions.
Check the deploy.js file in the deployment folder for more details where you’ll find the deployment logic.

# Testing

Tests have benn placed under test folder and all files will be executed to produce the result. 
Please remember that this is statefull procedure, so to re-run some tests you need to execute:infeos run-node.

Sample output:

infeos test    


  TokenLock Contract Tests
    1) [Non-existing] - Should add user with algorithm 0 to cruuser1


  0 passing (259ms)
  1 failing

