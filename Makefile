deploy-scraper:
	@echo "Deploying Scraper Api's to GCP"
	@gcloud functions deploy binbot-scraper --gen2 --region=europe-west2 --runtime=nodejs20 --source=src/scraperapi/ --entry-point=mainHttp --trigger-http

test-scraper:
	@echo "Running Scraper Tests"
	@cd src/scraperapi/local && npm run test
test-bracknell-scraper:
	@echo "Running Bracknell Scraper Tests"
	@cd src/scraperapi/local && npm run test-bracknell