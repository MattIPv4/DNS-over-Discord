GIT_BRANCH = $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null)

error:
	$(error Please use a target of either deploy-production, deploy-staging)

.PHONY: deploy-production
deploy-production:
	git push origin $(GIT_BRANCH):production -f

.PHONY: deploy-staging
deploy-staging:
	git push origin $(GIT_BRANCH):staging -f
