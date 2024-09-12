const { find } = require('./../utils/mongoDbOperations');
async function groupQuestions() {
    try {
        console.log('Fetching and grouping questions...');

        // Fetch all questions
        const questions = await find('questions', {});
        
        if (questions.length === 0) {
            console.log('No questions found in the database.');
            return;
        }

        console.log(`Found ${questions.length} questions.`);

        // Group questions by platform
        const groupedByPlatform = questions.reduce((acc, question) => {
            if (!acc[question.platform]) {
                acc[question.platform] = [];
            }
            acc[question.platform].push(question);
            return acc;
        }, {});

        // Further group Codeforces questions by set
        if (groupedByPlatform['Codeforces']) {
            groupedByPlatform['Codeforces'] = groupCodeforcesBySet(groupedByPlatform['Codeforces']);
        }

        // Display grouped questions
        Object.entries(groupedByPlatform).forEach(([platform, questions]) => {
            console.log(`\n${platform}:`);
            if (platform === 'Codeforces') {
                Object.entries(questions).forEach(([set, setQuestions]) => {
                    console.log(`  Set: ${set}`);
                    setQuestions.forEach(q => console.log(`    ${q.link}`));
                });
            } else {
                questions.forEach(q => console.log(`  ${q.link}`));
            }
        });

        console.log('\nFinished grouping questions.');
        return groupedByPlatform;
    } catch (error) {
        console.error('Error in groupQuestions:', error);
        if (error.name === 'MongoServerError') {
            console.error('MongoDB connection error. Please check your database connection and credentials.');
        } else if (error.name === 'TypeError') {
            console.error('Type error occurred. Please check if all required fields are present in the question documents.');
        }
    }

}

function groupCodeforcesBySet(codeforcesQuestions) {
    return codeforcesQuestions.reduce((acc, question) => {
        const pathParts = question.link.split('/');
        const setKey = pathParts.slice(0, -2).join('/'); 
        if (!acc[setKey]) {
            acc[setKey] = [];
        }
        acc[setKey].push(question);
        return acc;
    }, {});
}

module.exports = groupQuestions;