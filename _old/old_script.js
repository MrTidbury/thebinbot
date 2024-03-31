const puppeteer = require('puppeteer');
const https = require('https')
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
      setTimeout(resolve, delayms);
  });
}

exports.runBinBot = (req, res) => {
  (async () => {
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
      }
    })

    console.log(`Recyling collection is on ${recylingCollection.toDateString()}`)
    console.log(`Refuse collection is on ${refuseCollection.toDateString()}`)

    const tommorow = new Date();
    tommorow.setDate(tommorow.getDate() + 1);
    let warnRefuse = tommorow.toDateString() == refuseCollection.toDateString()
    let warnRecyling = tommorow.toDateString() == recylingCollection.toDateString()

    console.log(warnRefuse)
    console.log(warnRecyling)

    let warnRefuseWording = 'The Rubbish bin needs to be put out tonight as it is being collected tommorow'
    let warnRecylingWording = 'The Recyling bins need to be put out tonight as they are being collected tommorow'
    let warnBothWording = 'Both the Recyling and Rubbish bins need to be put out as they are both being collected tommorow'

    let telegramWording = null
    if (warnRefuse && warnRecyling){
      telegramWording = warnBothWording
    } else if (warnRefuse && !warnRecyling){
      telegramWording = warnRefuseWording
    } else if (warnRecyling && !warnRefuse){
      telegramWording = warnRecylingWording
    }

    if (telegramWording !== null){
      url = `https://api.telegram.org/bot5733098009:AAEiSiO-BCdxAvc8nAuyDahPEcewUiMFN40/sendMessage?chat_id=-462702205&text=`
      https.get(url + encodeURIComponent(telegramWording), (resp) => {
        res.send('Send telegram message')
        console.log('Send telegram message')
      })
    } else {
      res.send('Not sending a telegram message as not needed');
      console.log('Not sending a telegram message as not needed')
    }

  })();
};