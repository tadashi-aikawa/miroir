MAKEFLAGS += --warn-undefined-variables
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

.PHONY: $(shell egrep -oh ^[a-zA-Z0-9][a-zA-Z0-9_-]+: $(MAKEFILE_LIST) | sed 's/://')

#----

BASE_URL := http://localhost:8888/miroir/

help: ## Print this help
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9][a-zA-Z0-9_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)


init: ## Initialize for build and package
	@echo 'Start $@'
	@docker build -t tadashi-aikawa/miroir .
	@echo 'End $@'

_clean-package:
	@echo 'Start $@'
	@docker rm -f tmp-miroir || echo "No need to clean"
	@echo 'End $@'

package: _clean-package ## Package to dist (set BASE_URL)
	@echo 'Start $@'
	@docker run -i -e BASE_URL=$(BASE_URL) --name tmp-miroir tadashi-aikawa/miroir npm run package
	@rm -rf dist
	@docker cp tmp-miroir:/usr/src/app/dist .
	@docker rm -f tmp-miroir
	@echo 'End $@'

_clean-deploy-container:
	@echo 'Start $@'
	@docker rm -f miroir || echo "No need to clean"
	@echo 'End $@'

deploy-container: _clean-deploy-container ## Deploy by docker (Requirements dist)
	@echo 'Start $@'
	@docker run --name miroir -v `pwd`/dist:/usr/share/nginx/html/miroir:ro -p 8888:80 -d nginx
	@echo 'End $@'

