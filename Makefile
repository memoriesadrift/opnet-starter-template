CONTRACTS_DIR = src
BUILD_DIR = build
TEST_SRC_DIR = __test__/unit/tests
INTEGRATION_TEST_SRC_DIR = __test__/integration/

SOURCE_FILES := $(shell find $(CONTRACTS_DIR) -type f -name "*.ts")
CONTRACT_FILES := $(shell find $(CONTRACTS_DIR) -name "index.ts" -exec grep -l Blockchain.contract {} \;)
OUTPUT_WASM_FILES_NOEXT = $(shell echo $(CONTRACT_FILES) | xargs -L1 dirname | xargs -L1 basename)
OUTPUT_WASM_FILES = $(shell echo $(OUTPUT_WASM_FILES_NOEXT) | xargs -L1 printf "$(BUILD_DIR)/%s.wasm\n")

TEST_FILES = $(shell find $(TEST_SRC_DIR) -type f -name '*.ts')

ASC = npx asc

ASC_OPTS = \
	--config asconfig.json

.PHONY: all
all: compile

.PHONY: check_node_modules
check_node_modules: package.json
	@if [ ! -d node_modules ]; then \
		echo "node_modules not found. Installing dependencies..."; \
		npm install; \
	else \
		if [ package.json -nt node_modules ]; then \
			echo "package.json was updated. Reinstalling dependencies..."; \
			npm install; \
		else \
			echo "Dependencies are up to date."; \
		fi \
	fi
	touch node_modules

.PHONY: compile 
compile: check_node_modules $(OUTPUT_WASM_FILES)

$(OUTPUT_WASM_FILES): $(SOURCE_FILES)
	@prereqs="$^"; \
	targets="$@"; \
	for prereq in $$prereqs; do \
		if echo "$(CONTRACT_FILES)" | grep -q "$$prereq"; then \
			target="$(BUILD_DIR)/$$(basename $$(dirname $$prereq)).wasm"; \
			echo "Compiling $$prereq to $$target"; \
			$(ASC) $$prereq \
				-o $$target \
				--textFile $(BUILD_DIR)/$$(basename $$target).wat \
				$(ASC_OPTS); \
		fi; \
	done

.PHONY: test
test: $(OUTPUT_WASM_FILES)
	@echo "Running all tests in $(TEST_SRC_DIR)"
	@for test_file in $(TEST_FILES); do \
		npx tsx "$$test_file"; \
	done

.PHONY: test-only
test-only: $(OUPUT_WASM_FILES)
	npx tsx $(TEST_SRC_DIR)/$(name).ts

.PHONY: interact
interact: check_node_modules
	npx tsx $(INTEGRATION_TEST_SRC_DIR)/index.ts


.PHONY: help
help:
	@echo "=== OP_NET Makefile Command Overview ==="
	@echo "make                             runs make compile" 
	@echo "make compile                     compiles contracts, installs dependencies" 
	@echo "make clean                       deletes build artifacts and node_modules" 
	@echo "make test                        runs unit tests, compiling contracts if necessary" 
	@echo "make test-only name=<file name>  runs only the given test file." 
	@echo "make interact                    runs the integration test file to interact with contracts on regtest."
	@echo "make help                        prints this message" 
	@echo "make check_node_modules          run implicitly by other commands" 

.PHONY: clean
clean:
	rm -f $(BUILD_DIR)/*.wasm
	rm -f $(BUILD_DIR)/*.wat
	rm -f $(BUILD_DIR)/*.js
	rm -f $(BUILD_DIR)/*.d.ts
	rm -rf node_modules
