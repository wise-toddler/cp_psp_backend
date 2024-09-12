const { makeFriend, loginToCodeforces } = require('../../../utils/codeforces');
const { initiatePage, gotoPage, closeBrowser } = require('../../../utils/Browserinit');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../', '.env') });
const { find } = require('../../../utils/mongoDbOperations');

async function makeFriends() {
    let page;
    try {
        // Initialize the browser and get the page
        page = await initiatePage();

        // Log in to Codeforces
        await loginToCodeforces(page);

        // Fetch all students from MongoDB
        const students = await find('students', {});
        console.log(`Fetched ${students.length} students from the database.`);
        console.log(students);

        // Iterate through students and make friends on Codeforces
        for (const student of students) {
            if (student.codeforcesUsername) {
                try {
                    await makeFriend(page, student.codeforcesUsername);

                    // Add a random delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));
                } catch (error) {
                    console.error(`Error making friend with ${student.codeforcesUsername}:`, error);
                }
            }
        }
        console.log('Finished processing all students.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the browser
        await closeBrowser(page);
    }
}

// Run the script
makeFriends().then(() => {
    console.log('Script execution completed.');
}).catch((error) => {
    console.error('Script execution failed:', error);
});