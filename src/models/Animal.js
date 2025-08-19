const db = require('../config/db');

class Animal {
    static async findAll() {
        const [rows] = await db.query(`
            SELECT *, 
                DATE_FORMAT(nascimento, '%Y-%m-%d') as nascimento,
                DATE_FORMAT(data_resgate, '%Y-%m-%d') as data_resgate
            FROM animais
        `);
        return rows;
    }

    static async findByPk(id) {
        const [rows] = await db.query('SELECT * FROM animais WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create(data) {
        const [result] = await db.query('INSERT INTO animais SET ?', data);
        return { id: result.insertId, ...data };
    }

    static async update(id, data) {
        await db.query('UPDATE animais SET ? WHERE id = ?', [data, id]);
        return this.findByPk(id);
    }

    static async destroy(id) {
        await db.query('DELETE FROM animais WHERE id = ?', [id]);
    }
}

module.exports = Animal;