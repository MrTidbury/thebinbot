import datetime
import os
import asyncio
from utils import DebugLogger
from scrapers.bracknell import BracknellScraper
from scrapers.reading import ReadingScraper
from scrapers.westberks import WestberksScraper

class TheBinBot(object):
    def __init__(self, target_council, debug=True):
        self.debug = debug
        self.target_council = target_council
        self.LOGGER = DebugLogger(debug=self.debug)
        return

    async def run(self):
        scraper = BracknellScraper(self.LOGGER)
        bin_dates = await scraper.get_bin_dates(postcode="RG12 9PE", house_number="11")
        self.LOGGER.log(f"Bin Dates: {bin_dates}")
        return

async def main(trigger_event):
    bin_bot = TheBinBot(target_council=trigger_event.get('target_council', 'bracknell'))
    await bin_bot.run()


def init(event, context):
    """This is the trigger if run by AWS Lambda
    """
    event_json = eval(str(event).replace('false', 'False').replace('true', 'True'))
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main(event_json))

if __name__ == '__main__':
    """This is the Trigger event if run locally
    """
    mock_event = {'target_council': 'bracknell'}
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main(mock_event))