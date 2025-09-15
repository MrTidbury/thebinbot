const { BracknellScraper } = require("../scrapers/bracknell");
const { WestBerksScraper } = require("../scrapers/westberks");
const { ReadingScraper } = require("../scrapers/reading");
const prompt = require('prompt-sync')();

async function main(council, postcode, houseNumber) {
    var resp = null
    switch (council.toLowerCase()) {
        case 'bracknell':
            console.log('Running the Bracknell Scraper')
            resp = await BracknellScraper(postcode, houseNumber)
        case 'reading':
            console.log('Running the Reading Scraper')
            resp = await ReadingScraper(postcode, houseNumber)
        case 'westberks':
            console.log('Running the WestBerks Scraper')
            resp = await WestBerksScraper(postcode, houseNumber)
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
    console.log('Running the West Berks Scraper for 20 carston grove, rg31 7zn')
    const resp = await WestBerksScraper(postcode, houseNumber)
    console.log(resp)
}

async function testJo() {
    const postcode = 'RG18 9XP'
    const houseNumber = 'old windmill cottage'
    console.log('Running the West Berks Scraper for Old Windmill Cottage, rg18 9xp')
    const resp = await WestBerksScraper(postcode, houseNumber)
    console.log(resp)
}

async function testHarry() {
    const postcode = 'RG30 4LT'
    const houseNumber = '3 poole close'
    console.log('Running the Reading Scraper for 20 poole close, RG30 4LT')
    const resp = await ReadingScraper(postcode, houseNumber)
    console.log(resp)
}

async function test() {
    const council = prompt('What scraper to run?   > ');
    const poastCode = prompt('What postcode to check?   > ');
    const houseNumber = prompt('What street address to check?   > ');
    const resp = await main(council, poastCode, houseNumber)
}

module.exports = { main, testJagLane, test, testMumDad, testHarry, testJo}