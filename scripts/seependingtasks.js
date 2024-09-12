const { find, disconnect, connect } = require('./../utils/mongoDbOperations');
async function seePendingTasks() {
    try {
        console.log('Starting to see pending tasks...');
        await connect();
        // Fetch all pending tasks
        // fetch all not completed tasks
        const pendingTasks = await find('tasks', { status: { $ne: 'completed' } });
        // const pendingTasks = await find('tasks', { status: 'pending' });
        console.log(`Found ${pendingTasks.length} pending tasks.`);
        pendingTasks.forEach((task, index) => {
            console.log(`\nTask ${index + 1}:`);
            console.log(`ID: ${task._id}`);
            console.log(`Table: ${task.table}`);
            console.log(`Operation: ${task.operation}`);
            console.log('Data:', JSON.stringify(task.data, null, 2));
        });

        console.log('Finished seeing all pending tasks.');
    } catch (error) {
        console.error('Error in seePendingTasks:', error);
    }
    finally {
        disconnect();
    }
}
seePendingTasks();