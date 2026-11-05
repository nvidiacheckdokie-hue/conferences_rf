import express from "express";
import session from "express-session";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import db from "./db.js";
import { User, Room, Request } from "./db.js";
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
bon.use(express.json());

bon.set("view engine", "ejs");
bon.set("views", "./views");
bon.use(express.static(join(__dirname, "public")));

bon.use(
  session({
    secret: "conf2027-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 часа
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

bon.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const RULES = [
  {
    field: "login",
    test: (v) => /^[A-Za-z0-9]{6,}$/.test(v),
    msg: "Логин должен содержать только латиницу и цифры, не менее 6 символов",
  },
  {
    field: "password",
    test: (v) => v && v.length >= 8,
    msg: "Пароль должен быть не менее 8 символов",
  },
  {
    field: "fio",
    test: (v) => /^[А-Яа-яЁё\s\-]+$/.test(v),
    msg: "ФИО должно содержать только кириллицу, пробелы или дефисы",
  },
  {
    field: "phone",
    test: (v) => v && v.trim().length > 0,
    msg: "Телефон обязателен для заполнения",
  },
  {
    field: "email",
    test: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    msg: "Некорректный формат Email",
  },
];

const validate = (data) =>
  RULES.filter(({ field, test }) => !test((data[field] || "").trim())).map((r) => r.msg);

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
    if (req.session.lastActivity && now - req.session.lastActivity > INACTIVITY_LIMIT) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
    }
    req.session.lastActivity = now;
  }
  next();
});



// --- РОУТЫ --- //

bon.get("/", (req, res) => res.redirect("/rooms"));

bon.get("/register", (req, res) => {
  res.render("auth", {
    mode: "register",
    form: {},
    errors: [],
    flash: null
  });
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

  req.session.flash = { type: "success", text: "Регистрация успешна! Теперь вы можете войти." };
  res.redirect("/login");
});

bon.get("/login", (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;
  res.render("auth", {
    mode: "login",
    form: {},
    errors: null,
    flash: flash,
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
    form: req.body,
    errors: ["Неверный логин или пароль"],
    flash: null,
  });
});

bon.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

bon.get("/dashboard", requireAuth, (req, res) => {
  const requests = Request.findByUserId(req.session.userId);
  const rooms = Room.findAll();
  res.render("dashboard", { isAdmin: false, requests, rooms });
});

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

bon.get("/admin", requireAdmin, (req, res) => {
  const requests = Request.findAllDetailed();
  res.render("requests_list", { isAdmin: true, requests });
});

bon.post("/admin", requireAdmin, (req, res) => {
  Request.updateStatus(req.body.id, req.body.status);
  res.redirect("/admin");
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

bon.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});