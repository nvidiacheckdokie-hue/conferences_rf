import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'conf.db'));

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fio TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
    );
`);

const users_count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

if (users_count === 0) {
    const stat = db.prepare(`
        INSERT INTO users (login, password, fio, phone, email)
        VALUES (?, ?, ?, ?, ?)
    `);
    stat.run('ivan', 'demo', 'Иванов Иван', '8(999)123-45-67', 'ivan@example.com');
    stat.run('petr', 'demo', 'Петров Пётр', '8(999)123-45-68', 'petr@example.com');
    stat.run('anna', 'demo', 'Анна Сидорова', '8(999)123-45-69', 'anna@example.com');
    console.log('Тестовые пользователи добавлены');
}

// ---------------------------------------------------------------------------

db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    capacity TEXT NOT NULL
    );
`);

const rooms_count = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;

if (rooms_count === 0) {
    const stat = db.prepare(`
        INSERT INTO rooms (name, type, capacity)
        VALUES (?, ?, ?)
    `);
    stat.run('Альфа', 'Конференц-зал', 'Большая');
    stat.run('Бета', 'Конференц-зал', 'Средняя');
    stat.run('Гамма', 'Аудиенц-зал', 'Маленькая');
    console.log('Тестовые комнаты добавлены');
}

// ---------------------------------------------------------------------------

db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    review TEXT,
    created_at TEXT DEFAULT (datetime('now'))
    );
`);

const reviews_count = db.prepare('SELECT COUNT(*) AS c FROM reviews').get().c;

if (reviews_count === 0) {
    const stat = db.prepare(`
        INSERT INTO reviews (user_id, date_start, review)
        VALUES (?, ?, ?)
    `);
    stat.run(1, "2027-03-15", 'Прекрасный магазин!');
    stat.run(2, "2027-03-20", "Хорошее обслуживание!");
    stat.run(3, "2027-04-01", "Вот отстой!");
    console.log('Тестовые отзывы добавлены');
}

// ---------------------------------------------------------------------------

db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Новая',
    review TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    );
`);

const requests_count = db.prepare('SELECT COUNT(*) AS c FROM requests').get().c;

if (requests_count === 0) {
    const stmtRequest = db.prepare(`
        INSERT INTO requests (user_id, room_id, date_start, payment)
        VALUES (?, ?, ?, ?)
    `);
    stmtRequest.run(1, 1, "2027-03-15", 'При очном посещении');
    stmtRequest.run(1, 3, "2027-03-20", "Перевод по СБП");
    stmtRequest.run(3, 3, "2027-04-01", "При очном посещении");
    console.log('Тестовые записи добавлены');

    const run1 = db.prepare(`
    INSERT INTO requests (user_id, room_id, date_start, payment, review)
    SELECT 
        reviews.user_id,
        1,
        reviews.date_start,
        'При очном посещении',
        reviews.review
    FROM reviews
`);
    run1.run();
}

const run = db.prepare(`SELECT requests.*, rooms.name FROM requests
    JOIN users ON users.id = requests.user_id 
    JOIN rooms ON rooms.id = requests.room_id`);
run.run();


class UserModel {
    constructor() {
        this.table = "users";
    }
    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
    }
    findByLogin(login) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE login = ?`).get(login);
    }
    findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
    }
    count() {
        return db.prepare(`SELECT COUNT(*) FROM ${this.table}`).pluck().get();
    }
    exists(login) {
        return db.prepare(`SELECT CASE WHEN EXISTS(SELECT * FROM ${this.table} WHERE login = ?) THEN 'true' ELSE 'false' END`).pluck().get(login);
    }
}

export const User = new UserModel();

class RoomModel {
    constructor() {
        this.table = "rooms";
    }
    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
    }
    findByType(type) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE type = ?`).get(type);
    }
    findAll() {
        return db.prepare(`SELECT * FROM ${this.table}`).all();
    }
    count() {
        return db.prepare(`SELECT COUNT(*) FROM ${this.table}`).pluck().get();
    }
}

export const Room = new RoomModel();

class RequestModel {
    constructor() {
        this.table = "requests";
    }
    findById(id) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
    }
    findByUserId(userID) {
        return db.prepare(`SELECT * FROM ${this.table} WHERE user_id = ?`).all(userID);
    }
    findAllDetailed() {
        return db.prepare(`
        SELECT 
            requests.id,
            requests.date_start,
            requests.payment,
            requests.status,
            requests.created_at,
            users.fio AS user_fio,
            users.email AS user_email,
            users.phone AS user_phone,
            rooms.name AS room_name,
            rooms.type AS room_type,
            reviews.review AS user_review
        FROM requests
        JOIN users ON requests.user_id = users.id
        JOIN rooms ON requests.room_id = rooms.id
        LEFT JOIN reviews ON requests.user_id = reviews.user_id AND requests.date_start = reviews.date_start
    `).all();
    }
    count() {
        return db.prepare(`SELECT COUNT(*) FROM ${this.table}`).pluck().get();
    }
    updateStatus(id, status) {
        db.prepare(`UPDATE ${this.table} SET status = ? WHERE id = ?`).run(status, id);
    }
}

export const Request = new RequestModel();

export default db;