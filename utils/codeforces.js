const cheerio = require('cheerio');
const { gotoPage } = require('../utils/Browserinit');

const makeFriend = async (page, userHandle) => {
    if (!page) {
        console.log("Page is not initialized. Please log in first.");
        return;
    }

    console.log(`Navigating to profile page for user ${userHandle}`);
    await gotoPage(page, `https://codeforces.com/profile/${userHandle}`);

    // Wait for the page to load
    await page.waitForSelector('.userbox', { timeout: 10000 })
        .catch(() => {
            console.log(`Profile page for ${userHandle} did not load properly.`);
            return null;
        });

    const isAlreadyFriend = await page.evaluate(() => {
        const friendButton = document.querySelector('div.friendStar');
        return friendButton && friendButton.classList.contains('friendStarFilled');
    });

    if (isAlreadyFriend) {
        console.log(`User ${userHandle} is already a friend.`);
        return;
    }

    const friendButton = await page.$('div.friendStar:not(.friendStarFilled)')
        .catch(() => {
            console.log(`Friend button not found for ${userHandle}. The user might not exist.`);
            return null;
        });

    if (!friendButton) {
        console.log(`Unable to add ${userHandle} as a friend. Button not found.`);
        return;
    }

    try {
        await friendButton.click();
        console.log(`Clicked to add ${userHandle} as a friend.`);

        // Wait for the button to change state
        await page.waitForSelector('div.friendStar.friendStarFilled', { timeout: 5000 });
        console.log(`${userHandle} successfully added as a friend.`);
    } catch (error) {
        console.error(`Error occurred while adding ${userHandle} as a friend:`, error);
    }
};

const isLoggedIn = async (page) => {
    try {
        console.log('Checking login status on Codeforces...');
        
        // Navigate to the Codeforces homepage if not already there
        if (!page.url().startsWith('https://codeforces.com')) {
            console.log('Navigating to Codeforces homepage...');
            await page.goto('https://codeforces.com', { waitUntil: 'networkidle0' });
        }

        // Check for the presence of "Enter" and "Register" links
        const loginElement = await page.$('a[href^="/enter"]');
        const registerElement = await page.$('a[href="/register"]');

        const isLoggedIn = !loginElement && !registerElement;

        if (isLoggedIn) {
            // If logged in, try to get the username
            const usernameElement = await page.$('.lang-chooser div:first-child');
            const username = usernameElement ? await page.evaluate(el => el.textContent.trim(), usernameElement) : 'Unknown';
            console.log(`User is logged in as: ${username}`);
        } else {
            console.log('User is not logged in');
        }

        return isLoggedIn;
    } catch (error) {
        console.error('Error occurred while checking login status:', error);
        return false;
    }
};

const loginToCodeforces = async (page) => {
    const username = 'ganesh_97';
    const password = 'Cf,D!UGda~_Ge4$';

    try {
        console.log('Navigating to login page...');
        // await gotoPage(page, 'https://codeforces.com/');

        if (await page.$('a[href*="enter"]') !== null) {
            await page.click('a[href*="enter"]');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        } else {
            console.log("Login button not found");
            return;
        }
        console.log('Entering credentials...');
        await page.type('#handleOrEmail', username);
        await page.type('#password', password);

        console.log('Submitting login form...');
        await page.click('input[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Login successful.');
    } catch (error) {
        console.error('Login failed:', error);
    }
};

const extractContestLinks = async (page, contestUrl) => {
    try {
        console.log(`Navigating to contest page: ${contestUrl}`);
        await gotoPage(page, contestUrl);

        console.log('Extracting question links...');
        const links = await page.evaluate(() => {
            const problemRows = document.querySelectorAll('table.problems tr');
            const links = [];
            for (let i = 1; i < problemRows.length; i++) { // Start from 1 to skip header row
                const link = problemRows[i].querySelector('td:first-child a');
                if (link) {
                    links.push(new URL(link.href, window.location.origin).href);
                }
            }
            return links;
        });

        console.log('Extracted links:');
        links.forEach((link, index) => {
            console.log(`${index + 1}. ${link}`);
        });

        return links;
    } catch (error) {
        console.error('An error occurred while extracting links:', error);
        throw error;
    }
}

const navigateToFriendsStandings = async (page, link) => {
    console.log(`Navigating to initial page: ${link}`);
    await gotoPage(page, link);

    const friendsLinkSelector = 'a[href*="standings"][href*="friends"], a[href*="standings?friends=true"]';
    await page.waitForSelector(friendsLinkSelector, { timeout: 60000 })
        .catch(() => { throw new Error('Friends standings link not found within 60 seconds'); });

    const friendsLink = await page.$eval(friendsLinkSelector, el => el.href);
    console.log(`Found Friends standings link: ${friendsLink}`);

    await Promise.all([
        page.click(friendsLinkSelector),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
    ]).catch(error => {
        if (error.name === 'TimeoutError') {
            console.log('Navigation timeout occurred. Attempting to proceed anyway.');
        } else {
            throw error;
        }
    });
    console.log('Navigation to Friends standings complete or timed out');
};

const ensureUnofficialResultsShown = async (page) => {
    const checkboxSelector = 'input#showUnofficial';
    await page.waitForSelector(checkboxSelector, { timeout: 10000 });
    const isChecked = await page.$eval(checkboxSelector, el => el.checked);
    if (!isChecked) {
        await page.click(checkboxSelector);
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('Unofficial results checkbox checked and page reloaded.');
    }
};

const parseProblemLinks = ($) => {
    const problemLinks = {};
    $('table.standings tr th').each((_, element) => {
        const problemLink = $(element).find('a').attr('href');
        if (problemLink && problemLink.includes('/problem/')) {
            const fullLink = 'https://codeforces.com' + problemLink;
            problemLinks[fullLink] = {};
        }
    });
    console.log(`Found ${Object.keys(problemLinks).length} problems in the contest`);
    return problemLinks;
};

const createProblemIdToLinkMap = (problemLinks) => {
    return Object.fromEntries(
        Object.entries(problemLinks).map(([link, _], index) => [index, link])
    );
};

const parseStandingsRow = ($, row, problemLinks, problemIdToLink) => {
    let username = $(row).find('td:nth-child(2)').text().trim();
    username = username.startsWith('*') ? username.slice(2) : username;

    $(row).find('td[problemid]').each((index, colElement) => {
        const problemLink = problemIdToLink[index];
        const solved = $(colElement).find('span.cell-accepted').length > 0;
        if (problemLink) {
            problemLinks[problemLink][username] |= solved;
        }
    });
};

const scrapePage = async (page, result) => {
    const content = await page.content();
    const $ = cheerio.load(content);

    if (Object.keys(result).length === 0) {
        Object.assign(result, parseProblemLinks($));
    }

    const problemIdToLink = createProblemIdToLinkMap(result);
    console.log('Problem ID to Link map created:', problemIdToLink);

    const rows = $('table.standings tbody tr');
    console.log(`Found ${rows.length} rows on this page`);

    rows.each((_, element) => parseStandingsRow($, element, result, problemIdToLink));
    console.log(`Processed ${rows.length} rows on this page`);
};

const getStandings = async (page, link) => {
    let result = {};
    let currentPage = 1;

    try {
        if (!await isLoggedIn(page)) {
            console.log("Not logged in. Logging in...");
            await loginToCodeforces(page);
        }

        await navigateToFriendsStandings(page, link);
        await ensureUnofficialResultsShown(page);

        const paginationExists = await page.$('.custom-links-pagination');
        console.log(paginationExists ? 'Multiple pages of results expected.' : 'Single-page result.');

        do {
            console.log(`Scraping page ${currentPage}...`);
            await page.waitForSelector('table.standings tbody', { timeout: 30000 })
                .catch(() => { throw new Error(`Standings table not found on page ${currentPage}`); });

            await scrapePage(page, result);

            if (!paginationExists) break;

            const nextPageElement = await page.$(`span.page-index[pageindex="${currentPage + 1}"] a`);
            if (!nextPageElement) break;

            console.log(`Navigating to page ${currentPage + 1}...`);
            await Promise.all([
                nextPageElement.click(),
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
            ]).catch(error => {
                if (error.name === 'TimeoutError') {
                    console.log(`Navigation to page ${currentPage + 1} timed out. Attempting to proceed.`);
                } else {
                    throw error;
                }
            });
            currentPage++;
        } while (true);

        console.log(`Scraping complete. Total problems: ${Object.keys(result).length}`);
        for (const [problemLink, users] of Object.entries(result)) {
            console.log(`Problem ${problemLink}: ${Object.keys(users).length} users processed`);
        }
    } catch (error) {
        console.error('Error occurred during scraping:', error);
    }

    return result;
};

module.exports =
{
    makeFriend,
    isLoggedIn,
    loginToCodeforces,
    extractContestLinks,
    getStandings
}