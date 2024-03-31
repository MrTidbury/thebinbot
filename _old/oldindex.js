const puppeteer = require('puppeteer');
const https = require('https')
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
      setTimeout(resolve, delayms);
  });
}

exports.runBinBot = (req, res) => {
  (async () => {
    conosle.log(req.body)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://selfservice.mybfc.bracknell-forest.gov.uk/w/webpage/waste-collection-days')
    await PromiseTimeout(1500)
    // Press enter to accept cookies ...
    await page.keyboard.press('Enter');
    await PromiseTimeout(1500);
    await page.type('input[placeholder="Postcode or street name"]', 'rg12 9pe', {delay: 20})
    await PromiseTimeout(3000);
    await page.select('.input_dropdown', "473691")
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

    console.log(`Recyling collection is on ${recylingCollection.toDateString()}`)
    console.log(`Refuse collection is on ${refuseCollection.toDateString()}`)
    res.send({recyling: recylingCollection, refuse: refuseCollection, food: foodCollection, garden: gardenCollection})

  })();
};