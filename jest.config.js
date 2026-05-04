module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Указываем, где искать файлы тестов
  testMatch: ["**/tests/**/*.ts", "**/?(*.)+(spec|test).ts"],
};
