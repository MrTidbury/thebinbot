'use strict';

// [START functions_http_method]
const functions = require('@google-cloud/functions-framework');
const { BracknellScraper } = require("./scrapers/bracknell");
const { WestBerksScraper } = require("./scrapers/westberks");
const API_KEY = process.env.API_KEY;

functions.http('mainHttp', async (req, res) => {
    // Check if the request method is GET
    if (req.method !== 'GET') {
        return res.status(403).send('Forbidden: Only GET requests are allowed.');
    }

    // Check if x-api-key header is present and matches the API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(403).send('Forbidden: API key is missing or invalid.');
    }

    // Extract the last part of the path
    const path = req.path.split('/').pop();

    // Parse URL parameters to extract streetAddress and postCode
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const streetAddress = urlParams.get('streetAddress');
    const postCode = urlParams.get('postCode');


    if (!streetAddress || !postCode) {
        return res.status(400).send('Bad Request: streetAddress and postCode are required.');
    }

    // Execute switch statement based on the last part of the path
    switch (path) {
        case 'bracknell':
            let resp = await BracknellScraper(postCode, streetAddress)
            if (resp.success) {
                return res.status(200).send(resp);
            } else {
                return res.status(400).send(resp);
            }
        case 'westberks':
            let bresp = await WestBerksScraper(postCode, streetAddress)
            if (bresp.success) {
                return res.status(200).send(bresp);
            } else {
                return res.status(400).send(bresp);
            }
        default:
            return res.status(404).send('Not Found');
    }
});
