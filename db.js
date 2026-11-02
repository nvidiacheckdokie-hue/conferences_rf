import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { fileURLToPath } from 'url';
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'conf.db'));

const hash = bcrypt.hashSync('demo', 10);
console.log(">>>", hash);

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

const hash1 = (pwd) => bcrypt.hashSync(pwd, 10);

if (users_count === 0) {
    const stat = db.prepare(`
        INSERT INTO users (login, password, fio, phone, email)
        VALUES (?, ?, ?, ?, ?)
    `);
    stat.run('ivan', hash, 'Иванов Иван', '8(999)123-45-67', 'ivan@example.com');
    stat.run('petr', hash, 'Петров Пётр', '8(999)123-45-68', 'petr@example.com');
    stat.run('anna', hash, 'Анна Сидорова', '8(999)123-45-69', 'anna@example.com');
    stat.run('Conf2027', hash1('Demo77'), 'Администратор', '8(999)000-00-00', 'admin@conf.ru');
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
    stat.run('Альфа', 'Аудитория', '565');
    stat.run('Бета', 'Коворкинг', '100');
    stat.run('Гамма', 'Кинозал', '10');
    console.log('Тестовые комнаты добавлены');
}

// ---------------------------------------------------------------------------

db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    review TEXT,
    created_at TEXT DEFAULT (datetime('now'))
    );
`);

const reviews_count = db.prepare('SELECT COUNT(*) AS c FROM reviews').get().c;

if (reviews_count === 0) {
    const stat = db.prepare(`
        INSERT INTO reviews (user_id, room_id, date_start, review)
        VALUES (?, ?, ?, ?)
    `);
    stat.run(1, 1, "2027-03-15", 'Прекрасный магазин!');
    stat.run(2, 2, "2027-03-20", "Хорошее обслуживание!");
    stat.run(3, 3, "2027-04-01", "Вот отстой!");
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
    // stmtRequest.run(1, 1, "2027-03-15", 'При очном посещении');
    // stmtRequest.run(1, 3, "2027-03-20", "Перевод по СБП");
    // stmtRequest.run(3, 3, "2027-04-01", "При очном посещении");

    const run = db.prepare(`
    INSERT INTO requests (user_id, room_id, date_start, payment, review)
    SELECT 
        reviews.user_id,
        reviews.room_id,
        reviews.date_start,
        'При очном посещении',
        reviews.review
    FROM reviews
`);
    run.run();
    console.log('Тестовые записи добавлены');
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
    return db.prepare(`SELECT EXISTS(SELECT 1 FROM ${this.table} WHERE login = ?)`).pluck().get(login);
    }
    create({login, password, fio, phone, email}) {
        const userHash = bcrypt.hashSync(password, 10); 
        const r = db.prepare(`
            INSERT INTO ${this.table} (login, password, fio, phone, email) VALUES (?, ?, ?, ?, ?)
            `).run(login, userHash, fio, phone, email);
        return this.findById(r.lastInsertRowid);
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
    create({userId, roomId, dateStart, payment}) {
        const r = db.prepare(`
            INSERT INTO ${this.table} (user_id, room_id, date_start, payment) VALUES (?, ?, ?, ?)
            `).run(userId, roomId, dateStart, payment);
        return this.findById(r.lastInsertRowid);
    }
}

export const Request = new RequestModel();

// const newRequest = Request.create( {
//     userId: 1,
//     roomId: 2,
//     dateStart: "2027-04-10",
//     payment: "При очном посещении",
// // });
// console.log("Созданная заявка");
// console.log(newRequest);

export default db;