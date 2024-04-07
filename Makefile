deploy-scraper:
	@echo "Deploying Scraper Api's to GCP"
	@gcloud functions deploy binbot-scraper --gen2 --region=europe-west2 --runtime=nodejs20 --source=src/binbotscraper/ --entry-point=mainHttp --trigger-http

deploy-main:
	@echo "Deploying BinBot Main to GCP"
	@gcloud functions deploy binbot-main --gen2 --region=europe-west2 --runtime=python311 --source=src/binbotmain/ --entry-point=main --trigger-http

deploy-spawner:
	@echo "Deploying BinBot Main to GCP"
	@gcloud functions deploy binbot-spawner --gen2 --region=europe-west2 --runtime=python311 --source=src/binbotspawner/ --entry-point=main --trigger-http

test-scraper:
	@echo "Running Scraper Tests"
	@cd src/binbotscraper/local && npm run test
test-bracknell-scraper:
	@echo "Running Bracknell Scraper Tests"
	@cd src/binbotscraper/local && npm run test-bracknell
test-westberks-scraper:
	@echo "Running WestBerks Scraper Tests"
	@cd src/binbotscraper/local && npm run test-westberks
test-reading-scraper:
	@echo "Running Reading Scraper Tests"
	@cd src/binbotscraper/local && npm run test-reading
test-main:
	@echo "Running BinBot Main Locally"
	@echo "+---------------------------------+"
	@cd src/binbotmain/ && python3 main.py
test-spawner:
	@echo "Running BinBot Spawner Locally"
	@echo "+---------------------------------+"
	@cd src/binbotspawner/ && python3 main.py
onboard-user:
	@echo "Onboarding User"
	@cd src/binbotmain/ && python3 onboard_user.py