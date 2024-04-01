
const puppeteer = require('puppeteer');
const https = require('https')
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
      setTimeout(resolve, delayms);
  });
}

var AsyncReadingScraper = async (postcode, streetAddress) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.reading.gov.uk/bin-calendar/')
    await PromiseTimeout(1500)
    // Get the inpput for the postcode...
    await page.type('input[placeholder="e.g. RG1 5SA"]', postcode, {delay: 20})
    await PromiseTimeout(3500);
    try {
      // Loop through the options
      const dropdownItems = await page.$$('.dropdown-item');
      let found = false;
      for (const item of dropdownItems) {
        const textContent = await page.evaluate(element => element.textContent.trim(), item);
        // Fix the street address to what we are looking for...
        if (textContent === "Your address not found?" || textContent.includes("No results for")) {
          continue;
        }
        addressParts = textContent.split(",")
        fixedAddress = addressParts[0].trim().toLowerCase() + " " + addressParts[1].trim().toLowerCase()
        if (fixedAddress === streetAddress.toLowerCase()) {
          // Click on the parent div...
          // console.log('Found matching option. Clicking on div..');
          await item.click();
          found = true;
          break;
        }
      }
      // Check if we found the address...
      if (!found) {
        throw new Error('Error: Dropdown populated with "No Addresses Found".');
      }

      // By this point we have clicked on the button so the bin data shoud be visible...
      await PromiseTimeout(1500);
      await page.waitForSelector('.tile.is-child.box.collection');

      // Extract information from each div
      const bins = await page.evaluate(() => {
        const bins = {};
        const divs = document.querySelectorAll('.tile.is-child.box.collection');
        divs.forEach(div => {
          const binName = div.querySelector('.title.is-2.service').textContent.trim();
          let date = div.querySelector('.date').textContent.trim();
          if (!bins[binName]) {
            bins[binName] = [];
          }
          bins[binName].push(date);
        });
        return bins;
      });

      // console.log(bins);

      let finalData = {}

      Object.entries(bins).forEach(([binName, dates]) => {
        let parsedDates = []
        dates.forEach(date => {
          let parts = date.split("-")
          let dateString = parts[1].trim()
          const [day, month, year] = dateString.split('/');
          dateString = `${year}-${month}-${day}`;
          parsedDates.push(new Date(Date.parse(dateString)))
        })
        const soonestDate = parsedDates.reduce((minDate, currentDate) => {
          return currentDate < minDate ? currentDate : minDate;
        }, parsedDates[0]);
        finalData[binName] = soonestDate
      });

      await browser.close();
      return {success: true, errors: null, result: finalData}
    }
    catch (error) {
      console.error(error.message);
      await browser.close();
      return {success: false, errors: error.message, result: null}
  } 
}

module.exports.ReadingScraper = AsyncReadingScraper
