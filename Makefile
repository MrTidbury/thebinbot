deploy-scraper:
	@echo "Deploying Scraper Api's to GCP"
	@gcloud functions deploy binbot-scraper --gen2 --region=europe-west2 --runtime=nodejs20 --source=src/scraperapi/ --entry-point=mainHttp --trigger-http

deploy-main:
	@echo "Deploying BinBot Main to GCP"
	@gcloud functions deploy binbot-main --gen2 --region=europe-west2 --runtime=python311 --source=src/binbotmain/ --entry-point=main --trigger-http

test-scraper:
	@echo "Running Scraper Tests"
	@cd src/scraperapi/local && npm run test
test-bracknell-scraper:
	@echo "Running Bracknell Scraper Tests"
	@cd src/scraperapi/local && npm run test-bracknell
test-main:
	@echo "Running BinBot Main Locally"
	@echo "+---------------------------------+"
	@cd src/binbotmain/ && python3 main.py