const { BracknellScraper } = require("../scrapers/bracknell");
const { WestBerksScraper } = require("../scrapers/westberks");
const prompt = require('prompt-sync')();

async function main(council, postcode, houseNumber) {
    var resp = null
    switch (council.toLowerCase()) {
        case 'bracknell':
            console.log('Running the Bracknell Scraper')
            resp = await BracknellScraper(postcode, houseNumber)
    }
        
    console.log(resp)
}

async function testJagLane() {
    const postcode = 'rg12 9pe'
    const houseNumber = '11 jaguar lane'
    console.log('Running the Bracknell Scraper for 11 jaguar Lane, RG12 9PE')
    const resp = await BracknellScraper(postcode, houseNumber)
    console.log(resp)
}

async function testMumDad() {
    const postcode = 'rg31 7zn'
    const houseNumber = '20 Carston Grove'
    console.log('Running the Bracknell Scraper for 20 carston grove, rg31 7zn')
    const resp = await WestBerksScraper(postcode, houseNumber)
    console.log(resp)
}


async function test() {
    const council = prompt('What scraper to run?   > ');
    const poastCode = prompt('What postcode to check?   > ');
    const houseNumber = prompt('What street address to check?   > ');
    const resp = await main(council, poastCode, houseNumber)
}

module.exports = { main, testJagLane, test, testMumDad}