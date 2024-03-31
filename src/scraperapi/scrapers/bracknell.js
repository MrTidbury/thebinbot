
const puppeteer = require('puppeteer');
const https = require('https')
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
      setTimeout(resolve, delayms);
  });
}

var AsyncBracknellScraper = async (postcode, streetAddress) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://selfservice.mybfc.bracknell-forest.gov.uk/w/webpage/waste-collection-days')
    await PromiseTimeout(1500)
    // Press enter to accept cookies ...
    await page.keyboard.press('Enter');
    await PromiseTimeout(1500);
    await page.type('input[placeholder="Postcode or street name"]', postcode, {delay: 20})
    await PromiseTimeout(3000);
    try {
        // Wait for the dropdown to appear for a maximum of 5 seconds
        await page.waitForSelector('.input_dropdown', { timeout: 5000 });        
        // Dropdown appeared
        console.log('Dropdown has appeared on the page.');
      } catch (error) {
        // Dropdown did not appear within the timeout
        console.log('Dropdown did not appear within the specified timeout.');
        return {success: false, errors: "Postcode not working", result: null}
      }
    // Get the dropdown values...
    const dropdownValues = await page.evaluate(() => {
        const dropdown = document.querySelector('.input_dropdown');
        const options = dropdown.querySelectorAll('option');
        
        // Mapping values to text displayed
        const values = Array.from(options).map(option => option.value.trim());
        const text = Array.from(options).map(option => option.textContent.split(',')[0].trim().toLowerCase());
        
        // Combine values and text into an array of objects
        return values.map((value, index) => ({ value, text: text[index] }));
      });
    const selectedValue = dropdownValues.find(option => option.text === streetAddress.toLowerCase());
    if (!selectedValue) {
        return {success: false, errors: "No street address found for postcode", result: null}
    }
    await page.select('.input_dropdown', selectedValue.value)
    await PromiseTimeout(2000);
    const data = await page.evaluate(() => {
      const tableBody = document.querySelectorAll('td');
      return Array.from(tableBody).map(element => element.innerText);
    });
    var refuseCollection = null
    var recylingCollection = null
    var gardenCollection = null
    var foodCollection = null
    data.forEach((foundString, index) => {
      if (foundString.includes('refuse')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup.startsWith(' next')){
            refuseCollection = pickup.substring(26)
            refuseCollection = new Date(Date.parse(refuseCollection.slice(1, -1)))
          }
        })
      } else if (foundString.includes('recycling')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup.startsWith(' next')){
            recylingCollection = pickup.substring(29)
            recylingCollection = new Date(Date.parse(recylingCollection.slice(1, -1)))
          }
        })
      } else if (foundString.includes('food')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup.startsWith(' next')){
            foodCollection = pickup.substring(24)
            foodCollection = new Date(Date.parse(foodCollection.slice(1, -1)))
          }
        })
      } else if (foundString.includes('garden')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup.startsWith(' next')){
            gardenCollection = pickup.substring(26)
            gardenCollection = new Date(Date.parse(gardenCollection.slice(1, -1)))
          }
        })
      }
    })
    const bin_values = [recylingCollection, refuseCollection, foodCollection, gardenCollection]
    if (bin_values.some(variable => variable !== null && variable !== undefined)){
        return {success: true, errors: null, result: {"Recylcing": recylingCollection, "General Waste": refuseCollection, "Food Waste": foodCollection, "Garden Waste": gardenCollection}}
    }
    else {
        return {success: false, errors: "No bin collection dates found", result: null}
    }

    
}

module.exports.BracknellScraper = AsyncBracknellScraper
