const { initiatePage, closeBrowser } = require("../utils/Browserinit");
const { connect, disconnect } = require("../utils/mongoDbOperations");
const updateQuestionStatus = require("./getstatuses");
const { processPendingTasks } = require("./pendingscript");


async function main() {
    let page = await initiatePage();
    await connect();
    await processPendingTasks(page);
    await updateQuestionStatus(page);
    await disconnect();
    await closeBrowser(page);
}
main();