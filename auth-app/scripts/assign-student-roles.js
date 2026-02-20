/**
 * Assign Student Roles to All Existing Users
 *
 * Quick fix to assign student role and generate student IDs for existing users
 */

const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });

function generateStudentId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `STU-${code}`;
}

async function assignRoles() {
    const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
    const client = await pool.connect();

    try {
        // Get all users without roles
        const usersResult = await client.query(`
            SELECT u.id, u.email, u.name
            FROM "user" u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.user_id IS NULL
        `);

        if (usersResult.rows.length === 0) {
            console.log('✅ All users already have roles assigned!');
            return;
        }

        console.log(`\n📋 Found ${usersResult.rows.length} users without roles\n`);

        for (const user of usersResult.rows) {
            // Assign student role
            await client.query(
                `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)`,
                [user.id, 'student']
            );

            // Create student profile with generated ID
            const studentId = generateStudentId();
            await client.query(
                `INSERT INTO student_profiles (user_id, student_id) VALUES ($1, $2)`,
                [user.id, studentId]
            );

            console.log(`✅ ${user.email} → Student (${studentId})`);
        }

        console.log('\n🎉 Successfully assigned student roles to all users!\n');

    } finally {
        client.release();
        await pool.end();
    }
}

assignRoles().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
