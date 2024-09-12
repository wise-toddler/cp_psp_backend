const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');


const { insertOne, findOne, updateOne, connect, disconnect, clearCollection, } = require('../../utils/mongoDbOperations');

// Seed function to read the CSV file and insert unique student data
const seedStudents = async () => {
    return new Promise((resolve, reject) => {
        const results = [];
        const csvPath = path.resolve(__dirname, 'students.csv');

        if (!fs.existsSync(csvPath)) {
            console.error(`Error: CSV file not found at ${csvPath}`);
            reject(new Error('Students CSV file not found'));
            return;
        }

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => {
                results.push({
                    email: data.Email,
                    name: data.Name,
                    codeforcesUsername: data['Codeforces Username']
                });
            })
            .on('error', (error) => {
                console.error('Error reading students CSV file:', error);
                reject(error);
            })
            .on('end', async () => {
                await clearCollection('students');
                console.log(`Read ${results.length} student records from CSV`);
                if (results.length > 0) {
                    console.log('First student data:', JSON.stringify(results[0], null, 2));
                }
                try {
                    for (const student of results) {
                        try {
                            const existingStudent = await findOne('students', { email: student.email });
                            if (existingStudent) {
                                console.log(`Student with email ${student.email} already exists. Updating...`);
                                await updateOne('students', { email: student.email }, { $set: student });
                            } else {
                                const insertedId = await insertOne('students', student);
                                console.log(`Inserted new student: ${student.name} with ID: ${insertedId}`);
                            }
                        } catch (upsertError) {
                            console.error(`Error upserting student ${student.name}:`, upsertError);
                            console.error('Failed student data:', JSON.stringify(student, null, 2));
                        }
                    }
                    console.log('Student data seeding completed');
                    resolve();
                } catch (error) {
                    console.error('Error during student data insertion:', error);
                    reject(error);
                }
            });
    });
};

// Seed function to read the CSV file and insert unique question data
const seedQuestions = () => {
    return new Promise((resolve, reject) => {
        const questions = [];
        const csvPath = path.resolve(__dirname, 'questions.csv');

        if (!fs.existsSync(csvPath)) {
            console.error(`Error: CSV file not found at ${csvPath}`);
            reject(new Error('Questions CSV file not found'));
            return;
        }

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => {
                questions.push({
                    platform: getPlatform(data.questionLink),
                    link: data.questionLink,
                    solvedCount: 0
                });
            })
            .on('error', (error) => {
                console.error('Error reading questions CSV file:', error);
                reject(error);
            })
            .on('end', async () => {
                console.log(`Read ${questions.length} question records from CSV`);
                if (questions.length > 0) {
                    console.log('First question data:', JSON.stringify(questions[0], null, 2));
                }
                try {
                    for (const question of questions) {
                        try {
                            const existingQuestion = await findOne('questions', { link: question.link });
                            if (existingQuestion) {
                                console.log(`Question with link ${question.link} already exists. Updating...`);
                                await updateOne('questions', { link: question.link }, { $set: question });
                            } else {
                                const insertedId = await insertOne('questions', question);
                                console.log(`Inserted new question: ${question.link} with ID: ${insertedId}`);
                            }
                        } catch (upsertError) {
                            console.error(`Error upserting question ${question.link}:`, upsertError);
                            console.error('Failed question data:', JSON.stringify(question, null, 2));
                        }
                    }
                    console.log('Question data seeding completed');
                    resolve();
                } catch (error) {
                    console.error('Error during question data insertion:', error);
                    reject(error);
                }
            });
    });
};

const getPlatform = (link) => {
    if (link.includes('codeforces.com')) return 'Codeforces';
    if (link.includes('codechef.com')) return 'CodeChef';
    if (link.includes('atcoder.jp')) return 'AtCoder';
    if (link.includes('cses.fi')) return 'CSES';
    return 'Unknown';
};

// Main execution
const seedData = async () => {
    try {
        await connect();
        await seedStudents();
        // await seedQuestions();
        console.log('All data seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during data seeding:', error);
        process.exit(1);
    } finally {
        disconnect();
    }
};

seedData();