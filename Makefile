MAKEFLAGS += --warn-undefined-variables
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

.PHONY: $(shell egrep -oh ^[a-zA-Z0-9][a-zA-Z0-9_-]+: $(MAKEFILE_LIST) | sed 's/://')
#----

PORT := 8888
BASE_URL := http://localhost:8888/miroir/

-include .env
version := $(shell git rev-parse --abbrev-ref HEAD)


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

package: init _clean-package ## Package to dist (Set BASE_URL[def: http://localhost:8888/miroir/])
	@echo 'Start $@'
	@docker run -i -e BASE_URL=$(BASE_URL) --name tmp-miroir tadashi-aikawa/miroir npm run package
	@rm -rf dist
	@docker cp tmp-miroir:/usr/src/app/dist .
	@docker rm -f tmp-miroir
	@echo 'End $@'

add-release:  ## Add releases to documentation
	@echo 'Start $@'
	@cat docs/releases/template.md | sed -r 's/x.y.z/$(version)/g' | sed -r s@yyyy/MM/dd@`date '+%Y/%m/%d'`@g > docs/releases/$(version).md
	@echo 'End $@'

_clean-deploy-container:
	@echo 'Start $@'
	@docker rm -f miroir || echo "No need to clean"
	@echo 'End $@'

release:  ## Release
	@echo 'Start $@'

	@echo '1. Staging and commit'
	git add docs
	git commit -m ':pencil: Add release note'

	@echo '2. Version up'
	npm version $(version)

	@echo '3. Push'
	git push

	@echo 'End $@'

deploy-container: _clean-deploy-container ## Deploy by docker (Set: PORT[def: 8888] and Requirements: dist)
	@echo 'Start $@'
	@docker run --name miroir -v `pwd`/dist:/usr/share/nginx/html/miroir:ro -p $(PORT):80 -d nginx
	@echo 'End $@'

_clean-deploy-s3:
	@echo 'Start $@'
	@aws s3 rm s3://$(BUCKET) || echo "No need to clean"
	@echo 'End $@'

deploy-s3: _clean-deploy-s3 ## Deploy by docker (Set: BUCKET and Requirements dist, aws-cli)
	@echo 'Start $@'
	@aws s3 cp --acl private `pwd`/dist/ s3://$(BUCKET)/ --recursive
	@echo 'End $@'

