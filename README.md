# BANKsys (задача по унику) банковская система (Java + Spring Boot + PostgreSQL)

Учебный проект банковской системы для сотрудников банка.  
Хранит сотрудников и их роли в PostgreSQL, отдаёт данные через REST API.  
Проект рассчитан на интеграцию с фронтендом на Next.js.

---

## 1. Стек технологий

- **Java** 17+ (в pom.xml стоит 25, но запускается и на 21)
- **Spring Boot** 4.0.0
- **Spring Web (MVC)**
- **Spring Data JPA**
- **Spring Validation**
- **PostgreSQL**
- **Maven**

---

## 2. Архитектура и роли

В системе есть сотрудники с ролями:

- `EMPLOYEE` — просто сотрудник банка  
- `MANAGER` — менеджер по работе с клиентами  
- `ADMIN` — управляющий (администратор системы)

Роль определяет набор прав и функциональных обязанности

- **EMPLOYEE**
  - Может авторизоваться в системе
  - Может просматривать свою информацию (ФИО, логин, роли)
- **MANAGER**
  - Наследует всё от EMPLOYEE
  - Имеет доступ к функционалу менеджера (работа с клиентами, операциями)
- **ADMIN**
  - Наследует всё от EMPLOYEE и MANAGER
  - Имеет административные права (управление сотрудниками, ролями и т.п.)

---

## 3. Структура БД

Используется PostgreSQL. Основные таблицы:

### 3.1. Таблица `roles`

Хранит роли сотрудников.

```sql
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL, -- EMPLOYEE, MANAGER, ADMIN
    description VARCHAR(255)
);
```

### 3.2. Таблица `employees`

Хранит сотрудников.

```sql
CREATE TABLE employees (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL, -- пока обычный текст, в бою должен быть хэш
    is_active   BOOLEAN DEFAULT TRUE
);
```

### 3.3. Таблица `employee_roles`

Таблица связи «многие ко многим»: один сотрудник может иметь несколько ролей.

```sql
CREATE TABLE employee_roles (
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id     INT NOT NULL REFERENCES roles(id)     ON DELETE CASCADE,
    PRIMARY KEY (employee_id, role_id)
);
```

В реальном приложении эти таблицы создаются автоматически через JPA (аннотации `@Entity`, `@ManyToMany`).

---

## 4. Настройка окружения

### 4.1. Требования
- Установлен PostgreSQL
- Установлен Maven
- Установлен JDK 17+ (лучше 21/25, как в pom.xml)

### 4.2. Создание базы данных

Подключаемся к PostgreSQL и создаём базу (имя можно поменять):

```sql
CREATE DATABASE banksys OWNER taurbek;
```

Вместо `taurbek` можно указать своего пользователя PostgreSQL.

### 4.3. Настройка `application.properties`

Файл: `src/main/resources/application.properties`

Пример конфигурации (порт и юзер подбираются под вашу установку):

```properties
spring.datasource.url=jdbc:postgresql://localhost:5434/banksys
spring.datasource.username=taurbek
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

server.port=8080
```

- Если PostgreSQL слушает стандартный порт — используйте `5432` вместо `5434`.
- `ddl-auto=update` — удобно для разработки (таблицы создаются и изменяются автоматически).

---

## 5. Структура Java-проекта

Пакеты и ключевые классы:
- `com.example.banksys.BanksysApplication` — точка входа
- `com.example.banksys.model`
  - `Employee` — сущность сотрудника
  - `Role` — сущность роли
- `com.example.banksys.repository`
  - `EmployeeRepository` — JPA-репозиторий для сотрудников
  - `RoleRepository` — JPA-репозиторий для ролей
- `com.example.banksys.config`
  - `DataInitializer` — инициализация тестовых данных при старте
- `com.example.banksys.dto`
  - `LoginRequest`, `LoginResponse`, `EmployeeDto` — DTO для API
- `com.example.banksys.mapper`
  - `EmployeeMapper` — маппинг `Employee` → `EmployeeDto`
- `com.example.banksys.service`
  - `AuthTokenService` — генерация/парсинг мок-токенов
- `com.example.banksys.controller`
  - `AuthController` — авторизация (`/api/auth/login`)
  - `EmployeeController` — текущий сотрудник (`/api/employees/me`)

---

## 6. Инициализация данных (test users)

При старте приложение через `DataInitializer` создаёт:

**Роли**
- `EMPLOYEE` — «Базовый сотрудник банка»
- `MANAGER` — «Менеджер по работе с клиентами»
- `ADMIN` — «Управляющий/администратор системы»

**Сотрудников**
1) Обычный сотрудник  
`username: employee1`  
`password: password`  
`roles: [EMPLOYEE]`

2) Менеджер  
`username: manager1`  
`password: password`  
`roles: [EMPLOYEE, MANAGER]`

3) Управляющий (админ)  
`username: admin1`  
`password: admin`  
`roles: [EMPLOYEE, MANAGER, ADMIN]`

---

## 7. API — авторизация и роли

### 7.1. Логин

`POST /api/auth/login`

Тело запроса (JSON):

```json
{
  "username": "admin1",
  "password": "admin"
}
```

Пример успешного ответа:

```json
{
  "token": "mock-3",
  "employee": {
    "id": 3,
    "fullName": "Антон Управляющий",
    "username": "admin1",
    "roles": ["MANAGER", "ADMIN", "EMPLOYEE"]
  }
}
```

- `token` имеет формат `mock-<id>` — это упрощённый учебный токен (без JWT).
- `employee.roles` — список ролей сотрудника, который можно использовать на фронтенде для ограничения доступа.

При неверном логине/пароле возвращается статус `401 UNAUTHORIZED`.

### 7.2. Получить текущего сотрудника

`GET /api/employees/me`

Заголовок:

```
Authorization: Bearer mock-3
```

Пример ответа:

```json
{
  "id": 3,
  "fullName": "Антон Управляющий",
  "username": "admin1",
  "roles": ["MANAGER", "ADMIN", "EMPLOYEE"]
}
```

Если заголовок не передан или токен некорректен — `401`.

---

## 8. Запуск приложения

Из корневой папки бэкенда (там, где `pom.xml`):

```bash
mvn spring-boot:run
```

Приложение поднимется на `http://localhost:8080`.

Проверка логина через `curl`:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin"}'
```

---

## 9. Проверка данных в Postgres (macOS/psql)

1) Убедитесь, что PostgreSQL запущен (например, `brew services start postgresql@15` или ваш контейнер).  
2) Подключитесь к базе (порт и юзер подставьте из `application.properties`):

```bash
psql -h localhost -p 5434 -U taurbek -d banksys
```

3) Внутри `psql` для проверки таблиц и содержимого:

```
\dt
SELECT * FROM employees;
SELECT * FROM roles;
SELECT * FROM employee_roles;
```

4) Выход: `\q`.

Если `psql` не найден: `brew install libpq` и добавьте в PATH, например  
`echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`.

---
