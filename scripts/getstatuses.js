const { find, updateOne, clearCollection } = require('../utils/mongoDbOperations');
const { getStandings } = require('../utils/codeforces');
const groupQuestions = require('./groupsetsofquestions');

async function updateQuestionStatus(page) {
    try {
        // Group questions
        const groupedQuestions = await groupQuestions();
        const students = await find('students', {});
        
        console.log('Updating question status...');
        // page = await initiatePage();
        await clearCollection('questionStatus');
        // Process Codeforces questions
        if (groupedQuestions['Codeforces']) {
            for (const [setKey, questions] of Object.entries(groupedQuestions['Codeforces'])) {
                const standingsUrl = `${setKey}/standings`;
                console.log(`Fetching standings for ${standingsUrl}`);
                const standings = await getStandings(page, standingsUrl);
                for (const question of questions) {
                    await processQuestion(question, standings,students);
                }
            }
        }

        console.log('Question status update completed.');
    } catch (error) {
        console.error('Error in updateQuestionStatus:', error);
    }
}

async function processQuestion(question, standings,students) 
{
    for (const student of students) {
        const status = standings[question.link] && standings[question.link][student.codeforcesUsername] ? true : false;
        await updateOne(
            'questionStatus',
            { questionId: question._id, studentId: student._id },
            { $set: { status: status } },
            { upsert: true }
        );
    }
    console.log(`Processed question: ${question.link}`);
}


module.exports = updateQuestionStatus;