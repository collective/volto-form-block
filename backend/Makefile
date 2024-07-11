### Defensive settings for make:
#     https://tech.davis-hansson.com/p/make/
SHELL:=bash
.ONESHELL:
.SHELLFLAGS:=-xeu -o pipefail -O inherit_errexit -c
.SILENT:
.DELETE_ON_ERROR:
MAKEFLAGS+=--warn-undefined-variables
MAKEFLAGS+=--no-builtin-rules

# We like colors
# From: https://coderwall.com/p/izxssa/colored-makefile-for-golang-projects
RED=`tput setaf 1`
GREEN=`tput setaf 2`
RESET=`tput sgr0`
YELLOW=`tput setaf 3`

IMAGE_NAME_PREFIX=ghcr.io/collective/volto-form-block
IMAGE_TAG=latest

# Python checks
PYTHON?=python3

# installed?
ifeq (, $(shell which $(PYTHON) ))
  $(error "PYTHON=$(PYTHON) not found in $(PATH)")
endif

# version ok?
PYTHON_VERSION_MIN=3.8
PYTHON_VERSION_OK=$(shell $(PYTHON) -c "import sys; print((int(sys.version_info[0]), int(sys.version_info[1])) >= tuple(map(int, '$(PYTHON_VERSION_MIN)'.split('.'))))")
ifeq ($(PYTHON_VERSION_OK),0)
  $(error "Need python $(PYTHON_VERSION) >= $(PYTHON_VERSION_MIN)")
endif

PLONE_SITE_ID=Plone
BACKEND_FOLDER=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
PLONE_VERSION=$(shell cat $(BACKEND_FOLDER)/version.txt)
EXAMPLE_CONTENT_FOLDER=${BACKEND_FOLDER}/src/collective/voltoformblock/setuphandlers/examplecontent

GIT_FOLDER=$(BACKEND_FOLDER)/.git
VENV_FOLDER=$(BACKEND_FOLDER)/.venv
BIN_FOLDER=$(VENV_FOLDER)/bin

SEED=$(shell date +'%Y%m%d-%H%M%S')

all: build

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
.PHONY: help
help: ## This help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

$(BIN_FOLDER)/hatch:  ## Setup virtual env
	@echo "$(GREEN)==> Install dependencies$(RESET)"
	@pipx run hatch env create

instance/etc/zope.ini:  ## Create instance configuration
	@echo "$(GREEN)==> Create instance configuration$(RESET)"
	@pipx run cookiecutter -f --no-input --config-file instance.yaml gh:plone/cookiecutter-zope-instance

.PHONY: config
config: instance/etc/zope.ini

constraints-mxdev.txt: ## Generate constraints file
	@echo "$(GREEN)==> Generate constraints file$(RESET)"
	@echo '-c https://dist.plone.org/release/$(PLONE_VERSION)/constraints.txt' > requirements.txt
	@pipx run mxdev -c mx.ini

.PHONY: build-dev
build-dev: constraints-mxdev.txt config $(BIN_FOLDER)/hatch ## Install Plone packages

.PHONY: install
install: build-dev ## Install Plone

.PHONY: build
build: build-dev ## Install Plone

.PHONY: clean
clean: ## Clean environment
	@echo "$(RED)==> Cleaning environment and build$(RESET)"
	rm -rf $(VENV_FOLDER) pyvenv.cfg dist instance .venv .pytest_cache requirements-mxdev.txt constraints-mxdev.txt requirements.lock

.PHONY: start
start: ## Start a Plone instance on localhost:8080
	ALLOWED_DISTRIBUTIONS=portalbrasil-intranet PYTHONWARNINGS=ignore $(BIN_FOLDER)/runwsgi instance/etc/zope.ini

.PHONY: console
console: instance/etc/zope.ini ## Start a console into a Plone instance
	ALLOWED_DISTRIBUTIONS=portalbrasil-intranet PYTHONWARNINGS=ignore $(BIN_FOLDER)/zconsole debug instance/etc/zope.conf

.PHONY: create-site
create-site: instance/etc/zope.ini ## Create a new site from scratch
	ALLOWED_DISTRIBUTIONS=portalbrasil-intranet PYTHONWARNINGS=ignore $(BIN_FOLDER)/zconsole run instance/etc/zope.conf ./scripts/create_site.py

# Example Content
.PHONY: update-example-content
update-example-content: $(BIN_FOLDER)/tox ## Export example content inside package
	@echo "$(GREEN)==> Export example content into $(EXAMPLE_CONTENT_FOLDER) $(RESET)"
	if [ -d $(EXAMPLE_CONTENT_FOLDER)/content ]; then rm -r $(EXAMPLE_CONTENT_FOLDER)/* ;fi
	$(BIN_FOLDER)/plone-exporter instance/etc/zope.conf $(PLONE_SITE_ID) $(EXAMPLE_CONTENT_FOLDER)

.PHONY: lint
lint: $(BIN_FOLDER)/hatch ## Check and fix code base according to Plone standards
	@echo "$(GREEN)==> Lint codebase$(RESET)"
	$(BIN_FOLDER)/hatch run lint

.PHONY: format
format: $(BIN_FOLDER)/hatch ## Check and fix code base according to Plone standards
	@echo "$(GREEN)==> Format codebase$(RESET)"
	$(BIN_FOLDER)/hatch run format

.PHONY: i18n
i18n: ## Update locales
	@echo "$(GREEN)==> Updating locales$(RESET)"
	$(BIN_FOLDER)/hatch run i18n

# Tests
.PHONY: test
test: $(BIN_FOLDER)/pytest ## run tests
	$(BIN_FOLDER)/hatch run test

.PHONY: test-coverage
test-coverage: $(BIN_FOLDER)/pytest ## run tests with coverage
	$(BIN_FOLDER)/hatch run cov

# Build Docker images
.PHONY: build-image
build-image:  ## Build Docker Images
	@DOCKER_BUILDKIT=1 docker build . -t $(IMAGE_NAME_PREFIX)-backend:$(IMAGE_TAG) -f Dockerfile --build-arg PLONE_VERSION=$(PLONE_VERSION)
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-demo:$(IMAGE_TAG) $(RESET)"
	@DOCKER_BUILDKIT=1 docker build .  --pull=false -t $(IMAGE_NAME_PREFIX)-demo:$(IMAGE_TAG) -f Dockerfile.demo --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)


# Acceptance tests
.PHONY: acceptance-backend-start
acceptance-backend-start: ## Start backend acceptance server
	ZSERVER_HOST=0.0.0.0 ZSERVER_PORT=55001 LISTEN_PORT=55001 APPLY_PROFILES="plonegovbr/intranet:default" CONFIGURE_PACKAGES="plone.restapi,plone.volto,plone.volto.cors,plonegovbr/intranet" $(BIN_FOLDER)/robot-server plone.app.robotframework.testing.VOLTO_ROBOT_TESTING

.PHONY: acceptance-image-build
acceptance-image-build:  ## Build Docker Images
	@DOCKER_BUILDKIT=1 docker build . -t $(IMAGE_NAME_PREFIX)-backend-acceptance:$(IMAGE_TAG) -f Dockerfile.acceptance --build-arg PLONE_VERSION=$(PLONE_VERSION)
