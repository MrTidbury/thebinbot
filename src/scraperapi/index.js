'use strict';

// [START functions_http_method]
const functions = require('@google-cloud/functions-framework');

functions.http('mainHttp', (req, res) => {
    console.log(req)
    switch (req.method) {
    case 'GET':
        res.status(200).send('Hello World!');
        break;
    case 'PUT':
        res.status(403).send('Forbidden!');
        break;
    default:
        res.status(405).send({error: 'Something blew up!'});
        break;
    }
});
