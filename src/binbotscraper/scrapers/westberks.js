
const puppeteer = require('puppeteer');
const https = require('https')
function PromiseTimeout(delayms) {
  return new Promise(function (resolve, reject) {
      setTimeout(resolve, delayms);
  });
}

function parseDateString(dateString) {
    // Map of month names to their index (0-based)
    const months = {
      "January": 0, "February": 1, "March": 2, "April": 3,
      "May": 4, "June": 5, "July": 6, "August": 7,
      "September": 8, "October": 9, "November": 10, "December": 11
    };
  
    // Split the date string into day, date, and month
    const [day, date, monthName] = dateString.split(" ");
  
    // Get the current year
    const currentYear = new Date().getFullYear();
  
    // Parse the month index from the months object
    const monthIndex = months[monthName];
  
    // Create a new Date object
    let dateObject = new Date(Date.UTC(currentYear, monthIndex, parseInt(date, 10)));
    
  
    // Check if the date has already passed this year
    if (dateObject < new Date()) {
      // If so, set the year to next year
      dateObject.setFullYear(currentYear + 1);
    }
    return dateObject;
}

var AsyncWestBerksScraper = async (postcode, streetAddress) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.westberks.gov.uk/article/35776/Find-Your-Next-Collection-Day')
  
    // // Assuming the textbox has the name attribute "FINDYOURBINDAYS_ADDRESSLOOKUPPOSTCODE"
    const postCodeInput = 'input[name="FINDYOURBINDAYS3WEEKLY_ADDRESSLOOKUPPOSTCODE"]';

    // // Type text into the textbox
    await page.type(postCodeInput, postcode, { delay: 20 });

    // // Press Enter key
    await page.keyboard.press('Enter');

    const dropdownSelector = '#FINDYOURBINDAYS3WEEKLY_ADDRESSLOOKUPADDRESS';
    try {
        // Wait for the dropdown to populate with some options...
        await page.waitForFunction((selector) => {
            const dropdown = document.querySelector(selector);
            return dropdown && dropdown.options && dropdown.options.length > 0;
          }, { timeout: 5000 }, dropdownSelector); // Adjust the timeout as needed
        // Dropdown has populated with something...
        // console.log('Dropdown populated successfully.');
        // Get all options of the dropdown
        const dropdownOptions = await page.evaluate((selector) => {
            const dropdown = document.querySelector(selector);
            const options = [];
            if (dropdown) {
                for (let i = 0; i < dropdown.options.length; i++) {
                    options.push({
                    value: dropdown.options[i].value,
                    text: dropdown.options[i].textContent.split(',')[0].trim().toLowerCase()
                    });
                }
            }
            return options;
        }, dropdownSelector);
        
        // console.log('Dropdown options:', dropdownOptions);
        // Check if the dropdown contains "No Addresses Found"
        if ( dropdownOptions.length == 1 && dropdownOptions[0].text === 'no addresses found') {
            throw new Error('Error: Dropdown populated with "No Addresses Found".');
        }

        //Find the options that match the street address...
        const selectedValue = dropdownOptions.find(option => option.text === streetAddress.toLowerCase());
        // console.log('Selected value:', selectedValue);
        if (!selectedValue) {
            throw new Error('Error: No street address found in the dropdown.');
        }

        // Select the street address from the dropdown..
        await page.select(dropdownSelector, selectedValue.value);

        // Map bin names to their identifying CSS classes in the new HTML
        const binSelectors = {
            "General Waste": { class: ".rubbish_collection_difs_black", text: null, date: null },
            "Recyling": { class: ".rubbish_collection_difs_green", text: null, date: null },
            "Food Waste": { class: ".rubbish_collection_difs_purple", text: null, date: null }
        };

        await PromiseTimeout(1500);

        for (const key in binSelectors) {
            if (binSelectors.hasOwnProperty(key)) {
                const value = binSelectors[key];

                // Wait for the relevant section to appear
                await page.waitForSelector(value.class);

                // Extract the date text from inside the correct container
                const divText = await page.evaluate((selector) => {
                    const container = document.querySelector(selector);
                    if (!container) return null;

                    const dateDiv = container.querySelector(".rubbish_date_container_left_datetext");
                    return dateDiv ? dateDiv.textContent.trim() : null;
                }, value.class);

                // Store text
                binSelectors[key].text = divText;

                // Convert to a Date
                if (divText === "Today") {
                    const today = new Date();
                    binSelectors[key].date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                } else {
                    try {
                        binSelectors[key].date = parseDateString(divText);
                    } catch (error) {
                        binSelectors[key].date = null;
                    }
                }
            }
        }

        // Special case for "old windmill cottage"
        if (binSelectors["General Waste"].date === null && streetAddress === 'old windmill cottage') {
            binSelectors["General Waste"].date = binSelectors["Food Waste"].date;
        }

        // Final return object
        binsToReturn = {
            next: {
                "Food Waste": binSelectors["Food Waste"].date,
                "Recyling": binSelectors["Recyling"].date,
                "General Waste": binSelectors["General Waste"].date,
                "Garden Waste": binSelectors["Recyling"].date,
            },
            food: [binSelectors["Food Waste"].date],
            recyling: [binSelectors["Recyling"].date],
            garden: [binSelectors["Recyling"].date],
            refuse: [binSelectors["General Waste"].date]
        };


        await browser.close();
        return {success: true, errors: null, result: binsToReturn}

    } catch (error) {
        throw error
        console.error(error.message);
        await browser.close();
        return {success: false, errors: error.message, result: null}
    }
}

module.exports.WestBerksScraper = AsyncWestBerksScraper
