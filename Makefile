MAKEFLAGS += --warn-undefined-variables
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

.PHONY: $(shell egrep -oh ^[a-zA-Z0-9][a-zA-Z0-9_-]+: $(MAKEFILE_LIST) | sed 's/://')
#----

PORT := 8888
BASE_URL := http://localhost:8888/miroir/

-include .env

#-------------------------------------------------------

help: ## Print this help
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9][a-zA-Z0-9_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "[REQUIRED ERROR] \`$*\` is required."; \
		exit 1; \
	fi

#-------------------------------------------------------

dev: ## Run for development
	@npm run dev

build: ## Build
	@npm run build

serve-docs: ## Initialize for build and package
	@npm run docs

add-release:  ## Add releases to documentation
	@cat docs/releases/template.md | sed -r 's/x.y.z/$(version)/g' | sed -r s@yyyy/MM/dd@`date '+%Y/%m/%d'`@g > docs/releases/$(version).md

release: guard-version build ## make release version=x.y.z
	@echo '1. Staging and commit'
	git add docs
	git commit -m ':pencil: Add release note'

	@echo '2. Increment version'
	npm version $(version)

	@echo '3. Push'
	git push
	git push --tags

	@echo "All Successed!!"
	@echo 'Finally, you have to close a milestone about this version.'
	@echo 'https://github.com/tadashi-aikawa/miroir/milestones'

#==============

package: ## Package to dist (Set BASE_URL[def: http://localhost:8888/miroir/])
	@docker build -t tadashi-aikawa/miroir .
	@docker rm -f tmp-miroir || echo "No need to clean"
	@docker run -i -e BASE_URL=$(BASE_URL) --name tmp-miroir tadashi-aikawa/miroir npm run package
	@rm -rf dist
	@docker cp tmp-miroir:/usr/src/app/dist .
	@docker rm -f tmp-miroir

deploy-container: ## Deploy by docker (Set: PORT[def: 8888] and Requirements: dist)
	@docker rm -f miroir || echo "No need to clean"
	@docker run --name miroir -v `pwd`/dist:/usr/share/nginx/html/miroir:ro -p $(PORT):80 -d nginx

deploy-s3: ## Deploy by docker (Set: BUCKET and Requirements dist, aws-cli)
	@aws s3 rm s3://$(BUCKET) || echo "No need to clean"
	@aws s3 cp --acl private `pwd`/dist/ s3://$(BUCKET)/ --recursive
