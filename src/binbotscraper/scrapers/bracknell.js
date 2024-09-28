
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
    const datePattern = /\b\d{1,2} \w+ \d{4}\b/;
    await page.goto('https://selfservice.mybfc.bracknell-forest.gov.uk/w/webpage/waste-collection-days')
    await PromiseTimeout(1500)
    // Press enter to accept cookies ...
    await page.keyboard.press('Enter');
    await PromiseTimeout(1500);
    await page.type('input[placeholder="Postcode or street name"]', postcode, {delay: 20})
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

    function parseDate(str){
      let match = str.match(datePattern);
      let datestr = match ? match[0] : null;
      let collectionDate = new Date(Date.parse(datestr))
      return collectionDate
    }

    var nextrefuseCollection = null
    var nextrecylingCollection = null
    var nextgardenCollection = null
    var nextfoodCollection = null
    let gardenCollections = []
    let foodCollections = []
    let recylingCollections = []
    let refugeCollections = []
    data.forEach((foundString, index) => {
      if (foundString.includes('general')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup !== ''){
            let collectionDate = parseDate(pickup)
            refugeCollections.push(collectionDate)
            if (pickup.startsWith(' next')){
              nextrefuseCollection = collectionDate
            }
          }
        })
      } else if (foundString.includes('recycling')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup !== ''){
            let collectionDate = parseDate(pickup)
            if (pickup.startsWith(' next')){
              nextrecylingCollection = collectionDate
            }
            recylingCollections.push(collectionDate)
          }
        })
      } else if (foundString.includes('food')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup !== ''){
            let collectionDate = parseDate(pickup)
            if (pickup.startsWith(' next')){
              nextfoodCollection = collectionDate
            }
            foodCollections.push(collectionDate)
          }
        })
      } else if (foundString.includes('garden')){
        let array = foundString.split('Your')
        array.forEach((pickup) => {
          if (pickup !== ''){
            let collectionDate = parseDate(pickup)
            if (pickup.startsWith(' next')){
              nextgardenCollection = collectionDate
            }
            gardenCollections.push(collectionDate)
          }
        })
      }
    })

    const nextCollection = [nextrecylingCollection, nextrefuseCollection, nextfoodCollection, nextgardenCollection]
    if (nextCollection.some(variable => variable !== null && variable !== undefined)){
        let returnData = {
          next: {
            "Recylcing": nextrecylingCollection,
            "General Waste": nextrefuseCollection,
            "Food Waste": nextfoodCollection,
            "Garden Waste": nextgardenCollection
          },
          recyling: recylingCollections,
          refuse: refugeCollections,
          food: foodCollections,
          garden: gardenCollections
        }
        return {success: true, errors: null, result: returnData}
    }
    else {
        return {success: false, errors: "No bin collection dates found", result: null}
    }

    
}

module.exports.BracknellScraper = AsyncBracknellScraper
