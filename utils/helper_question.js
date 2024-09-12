// import { findOne, insertOne } from "./mongoDbOperations";
const { findOne, insertOne } = require('./mongoDbOperations');

const getPlatform = (link) => {
    if (link.includes('codeforces.com')) return 'Codeforces';
    if (link.includes('codechef.com')) return 'CodeChef';
    if (link.includes('atcoder.jp')) return 'AtCoder';
    if (link.includes('cses.fi')) return 'CSES';
    if (link.includes('spoj.com')) return 'SPOJ';
    return 'Unknown';
};
const addsinglequestion = async (question) => {
    let qobj = {
        link: question,
        platform: getPlatform(question),
    };
    const questionResult = await findOne('questions', { link: question });
    if (questionResult.document) {
        return { error: 'Question already exists' };
    }
    const result = await insertOne('questions', qobj);
    return result;
};
// export { getPlatform, addsinglequestion };
module.exports = { getPlatform, addsinglequestion };