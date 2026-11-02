import express from "express";
import session from "express-session";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import db from "./db.js";
import { User } from "./db.js";
import { Room } from "./db.js";
import { Request } from "./db.js";

import bcrypt from "bcryptjs";

// console.log("Все пользователи: ", User.findAll());
// console.log("Количество пользователей: ", User.count());
// console.log("Пользователь с логином ivan: ", User.exists("ivan"));
// console.log("Пользователь с id = 1: ", User.findById(1));
// console.log("Пользователь с логином ivan: ", User.findByLogin("ivan"));

// console.log("Все комнаты:");
// console.log(Room.findAll());

// console.log("Комната с id=1:");
// console.log(Room.findById(1));

// console.log("Все аудитории:");
// console.log(Room.findByType("Конференц-зал"));

// console.log("Всего комнат:");
// console.log(Room.count());

/*Request.updateStatus(1, "Завершено");

console.log("Заявка с id=1:");
console.log(Request.findById(1));

console.log("Заявки пользователя id=1:");
console.log(Request.findByUserId(1));

console.log("Все заявки (JOIN):");
console.log(Request.findAllDetailed());

console.log("Всего заявок:");
console.log(Request.count());*/

// const users = db.prepare('SELECT * FROM users').all();
// console.log('Все пользователи');
// console.log(users);

// const rooms = db.prepare('SELECT * FROM rooms').all();
// console.log('Все комнаты');
// console.log(rooms);

// const reviews = db.prepare('SELECT * FROM reviews').all();
// console.log('Все отзывы');
// console.log(reviews);

// const requests = db.prepare('SELECT * FROM requests').all();
// console.log('Все запросы');
// console.log(requests);

const __dirname = dirname(fileURLToPath(import.meta.url));
const bon = express();
const PORT = 3000;

bon.use(express.urlencoded({ extended: true }));

bon.set("view engine", "ejs");
bon.set("views", "./views");

bon.use(express.static(join(__dirname, "public")));

bon.use(
  session({
    secret: "conf2027-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, //1000 мс * 60 сек * 60 мин * 2 ч = 7 200 000 мс
      httpOnly: true,
      sameSite: "lax", // Защита от CSRF
    },
  }),
);

bon.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const validate = (data) =>
  RULES.filter(({ field, test }) => !test((data[field] || "").trim())).map(
    (r) => r.msg,
  );

const requireAuth = (req, res, next) => {
  req.session.userId ? next() : res.redirect("/login");
};

const requireAdmin = (req, res, next) => {
  req.session.login === "Conf2027" ? next() : res.redirect("/login");
};

const INACTIVITY_LIMIT = 20 * 60 * 1000;
bon.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();

    if (
      req.session.lastActivity &&
      now - req.session.lastActivity > INACTIVITY_LIMIT
    ) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
    }
    req.session.lastActivity = now;
  }
  next();
});

bon.get("/", (req, res) => res.redirect("rooms"));

bon.get("/register", (req, res) => {
  res.render("auth", {
    mode: "register",
    form: {},
    errors: [],
  });
});

bon.post("/register", (req, res) => {
  const errors = validate(req.body);

  if (User.exists(req.body.login)) {
    errors.push("Логин уже занят");
  }
  if (errors.length) {
    return res.render("auth", { mode: "register", form: req.body, errors });
  }

  User.create(req.body);
  req.session.flash = { type: "success", text: "Регистрация успешна" };
  res.redirect("/login");
});

bon.post("/register", (req, res) => {
  const errors = validate(req.body);
  if (req.body.login) {
    const isTaken = !!User.exists(req.body.login);

    if (isTaken) {
      errors.push("Логин уже занят");
    }
  }

  if (errors.length) {
    return res.render("auth", {
      mode: "register",
      form: req.body,
      errors,
      flash: null,
    });
  }

  req.body.password = bcrypt.hashSync(req.body.password, 10);

  User.create(req.body);

  req.session.flash = { type: "success", text: "Регистрация успешна" };
  res.redirect("/login");
});

bon.get("/login", (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;
  res.render("auth", {
    mode: "login",
    errors: null,
    flash: null,
  });
});

bon.post("/login", (req, res) => {
  const user = User.findByLogin(req.body.login);

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login;
    req.session.lastActivity = Date.now();

    return res.redirect(user.login === "Conf2027" ? "/admin" : "/dashboard");
  }

  res.render("auth", {
    mode: "login",
    errors: ["Неверный логин или пароль"],
    flash: null,
  });
});

bon.all('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

bon.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
})

bon.get("/dashboard", requireAuth, (req, res) => {
  const requests = Request.findByUserId(req.session.userId);
  const rooms = Room.findAll();
  res.render("dashboard", { isAdmin: false, requests: requests, rooms: rooms });
});

bon.get("/about", (req, res) => {
  res.render("about", { description: "Наша компания лучшая в мире!" });
});

bon.get("/contacts", (req, res) => res.render("contacts"));

bon.get("/rooms", (req, res) => {
  const rooms = Room.findAll();
  res.render("rooms", { rooms });
});

bon.get("/rooms/type/:type", (req, res) => {
  const rooms = Room.findAll().filter((r) => r.type === req.params.type);
  res.render("rooms", { rooms });
});

bon.use(express.json());

bon.get("/create", requireAuth, (req, res) => {
  const rooms = Room.findAll();
  res.render("create_request", { rooms, errors: [] });
});

bon.post("/create", requireAuth, (req, res) => {
  Request.create({
    userId: req.session.userId,
    roomId: req.body.room_id,
    dateStart: req.body.date_start,
    payment: req.body.payment,
  });
  res.redirect("/dashboard");
});

bon.get("/admin", (req, res) => {
  const requests = Request.findAllDetailed();
  res.render("requests_list", { isAdmin: true, requests });
});

bon.post("/admin", (req, res) => {
  Request.updateStatus(req.body.id, req.body.status);
  res.redirect("/admin");
});

// const NewUser = User.create({
//   login: 'new_user',
//   password: 'test12345',
//   fio: 'тест всех тестов',
//   phone: '8(999)111-22-33',
//   email: 'test@example.com',
// })
// console.log("Новый пользователь");
// console.log(NewUser);

// ======================== AUTH
const RULES = [
  {
    field: "login",
    test: (v) => /^[A-Za-z0-9]{6,}$/.test(v),
    msg: "Логин: латиница+цифры, минимум 6 символов",
  },
  {
    field: "password",
    test: (v) => v && v.length >= 8,
    msg: "Пароль: минимум 8 символов",
  },
  {
    field: "fio",
    test: (v) => /^[А-Яа-яЁё\s]+$/.test(v),
    msg: "ФИО: только кириллица и пробелы",
  },
  {
    field: "phone",
    test: (v) => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v),
    msg: "Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ",
  },
  {
    field: "email",
    test: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    msg: "Email: некорректный формат",
  },
];

bon.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
