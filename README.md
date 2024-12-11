# OP_NET Starter Template - Vesting Contract

A simple contract to serve as a template repo for writing and testing OP_NET contracts 🚀

## Code Structure

```
- __test__
   - unit              // unit tests
      - contracts      // contract interfaces
      - tests          // test files
   - integration       // integration tests
      - interfaces     // contract interfaces and ABIs
- src
   - vesting           // each contract has a separate folder for the Makefile build process
- build                // compiled contract bytecode
- lib
   - bytecode          // bytecode of contracts we depend on, but don't own
```

## Compiling, Testing, Deploying

I've provided a `Makefile` which bundles all the common commands into one convenient file, instead of crowding the `package.json` scripts and `asconfig.json` targets as OP_NET projects currently do.  
To see available commands, run `make help`.

```bash
$ make help
=== OP_NET Makefile Command Overview ===
make                             runs make compile
make compile                     compiles contracts, installs dependencies
make clean                       deletes build artifacts and node_modules
make test                        runs unit tests, compiling contracts if necessary
make test-only name=<file name>  runs only the given test file.
make interact                    runs the integration test file to interact with contracts on regtest.
make help                        prints this message
make check_node_modules          run implicitly by other commands
```

Most of the commands depend on each other for a smooth developer experience. For example, running `make test` on a fresh clone of this repository will run `make check_node_modules` to install dependencies, then run `make compile` to compile contracts and finally run tests when everything is in order.
I recommend sticking to this approach to begin with, as it simplifies the overhead of the many different layers of OP_NET contracts that you have to deal with due to the lack of a one stop shop tool like foundry.

### Notes on automatisation when using the provided Makefile

The makefile automatically detects contract files and test files based on certain heuristics that you'll have to follow in order for it to work.

#### Contract Heuristics

1. A Contract is defined as an index.ts file which contains the string `Blockchain.contract`
2. A Contract is compiled to a wasm file based on the name of the directory in which the contract's index.ts file is located
   i.e. `src/vesting/index.ts` gets compiled to `build/vesting.wasm`

#### Test Heuristics

1. A test file is any file in the test directory, defined as `__test__/unit/tests`
2. When running tests using `make test-only` the file name you provide is expanded as follows: `__test/unit/tests/<name>.ts`, for example: `make test-only name=vesting` runs the test file `__test__/unit/tests/vesting.ts`
   If you need to define fixtures or non-test files in the tests directory, simply create a subdirectory, for example: `__test__/unit/tests/fixtures`

### Unit Tests

I've provided some simple tests that verify the functionality of the vesting contract, as well as a sample of how fuzz testing can be implemented in OP_NET at the moment.

### Deploying contracts

Currently, the simplest way to deploy contracts is using OP_Wallet, instructions can be found in OP_NET official documentation, though it's just a simple drag and drop.

### Integration testing

The integration testing provided in this repo is to be considered a bare minimum setup. It provides a simple file with some example code that can be used to interact with a deployed contract.
You will need to set some environment variables according to `.env.template`.
