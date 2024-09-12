const { find, updateOne, deleteOne, insertOne,findOne, getUpdateFilter, deleteMany, connect, disconnect, ObjectId} = require('../utils/mongoDbOperations');
const { makeFriend, loginToCodeforces, extractContestLinks } = require('../utils/codeforces');
const { addsinglequestion } = require('../utils/helper_question');

let page = null;

async function processPendingTasks(pagee) {
    try {
        page = pagee;
        console.log('Starting to process pending tasks...');
        await connect();
        // Fetch all pending tasks
        const pendingTasks = await find('tasks', { status: 'pending' });
        console.log(`Found ${pendingTasks.length} pending tasks.`);

        for (const task of pendingTasks) {
            console.log(`Processing task: ${task._id}`);

            try {
                switch (task.table) {
                    case 'questions':
                        await processQuestionTask(task);
                        break;
                    case 'students':
                        await processStudentTask(task, page);
                        break;
                    default:
                        console.log(`Unknown task type: ${task.table}`);
                        await updateOne('tasks', { _id: getUpdateFilter(task._id) }, { $set: { status: 'failed', error: 'Unknown task type' }}); // Update task status to failed
                        continue; // Skip to the next task
                }

                // Update task status to completed
                const updateFilter = getUpdateFilter(task._id);
                const updateResult = await updateOne('tasks', updateFilter, { $set: { status: 'completed' } });
                if (updateResult === 1) {
                    console.log(`Task ${task._id} status updated to completed.`);
                } else {
                    console.error(`Failed to update status for task ${task._id}.`);
                }
            } catch (error) {
                console.error(`Error processing task ${task._id}:`, error);
                // Update task status to failed
                const updateFilter = getUpdateFilter(task._id);
                const updateResult = await updateOne('tasks', updateFilter, { $set: { status: 'pending', error: error.message } });
                if (updateResult === 1) {
                    console.log(`Task ${task._id} status updated to failed.`);
                } else {
                    console.error(`Failed to update status for failed task ${task._id}.`);
                }
            }
        }

        console.log('Finished processing all pending tasks.');
    } catch (error) {
        console.error('Error in processPendingTasks:', error);
    }
}

async function processQuestionTask(task) {
    try {
        switch (task.operation) {
            case 'insert':
                if (task.data.platform === 'Codeforces' && !task.data.link.includes('/problem/')) {
                    console.log(`Detected Codeforces question set: ${task.data.link}`);
                    const questionLinks = await extractContestLinks(page, task.data.link);
                    console.log(`Found ${questionLinks.length} questions in the set`);
                    questionLinks.forEach(async (link) => { await addsinglequestion(link); });
                } else {
                    await addsinglequestion(task.data.link);
                }
                break;
            case 'delete':
                const id = task.data._id;
                const deleteResult = await deleteOne('questions', { _id: new ObjectId(id) });
                if (deleteResult === 0) {
                    throw new Error(`No question found with ID: ${id}`);
                }
                await deleteMany('questionStatus', { questionId: id });
                console.log(`Deleted question status for question: ${id}`);
                break;
            default:
                throw new Error(`Unsupported operation for questions: ${task.operation}`);
        }
    } catch (error) {
        console.error(`Error processing question task (${task.operation}):`, error);
        throw error;
    }
}
async function processStudentTask(task) {
    try {
        switch (task.operation) {
            case 'insert':
                const insertResult = await insertOne('students', task.data);
                if (!insertResult) {
                    throw new Error('Failed to insert student');
                }
                // Make friend on Codeforces if username is provided
                if (task.data.codeforcesUsername) {
                    await loginToCodeforces(page);
                    try {
                        await makeFriend(page, task.data.codeforcesUsername);
                        console.log(`Made friends with ${task.data.codeforcesUsername} on Codeforces`);
                    } catch (error) {
                        console.error(`Failed to make friends with ${task.data.codeforcesUsername} on Codeforces:`, error);
                    }
                }
                break;
            case 'delete':
                const id = task.data._id;
                const deleteResult = await deleteOne('students', { _id: id });
                if (deleteResult === 0) {
                    throw new Error(`No student found with ID: ${id}`);
                }
                await deleteMany('questionStatus', { studentId: id });
                console.log(`Deleted question status for student: ${id}`);
                break;
            default:
                throw new Error(`Unsupported operation for students: ${task.operation}`);
        }
    } catch (error) {
        console.error(`Error processing student task (${task.operation}):`, error);
        throw error;
    }
}
module.exports = { processPendingTasks };
// 66e0b1b70191ea18fd72701b 